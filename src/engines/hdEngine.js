/**
 * hdEngine.js — Human Design calculation engine
 * Computes a full HD chart from birth date, time, and location.
 * Uses astronomy-engine for ephemeris calculations.
 */
import * as Astronomy from 'astronomy-engine'

// ─── Gate Sequence ────────────────────────────────────────────────────────────
// 64 I Ching gates in zodiac order, starting at Capricorn 0° (270° ecliptic)
const GATE_SEQUENCE = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
  27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
  28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
]

// HD Mandala offset: gate 41 starts at Capricorn 0° = 270° ecliptic
// Fine-tuned constant to match traditional HD software
// Gate 41 starts at 0° Capricorn = 270° ecliptic.
// Offset calibrated: user-reported 3/5 profile; +1 line shift from base 302.
// HD mandala anchor: Gate 41 begins at 302° tropical (2°00' Aquarius).
// (Was 301.0625, which is exactly one line-width too low and shifted every line +1.)
const HD_OFFSET = 302.0

// ─── Center / Channel definitions ─────────────────────────────────────────────
const CENTER_GATES = {
  HEAD:   [64, 61, 63],
  AJNA:   [47, 24, 4, 17, 11, 43],
  THROAT: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  G_SELF: [1, 13, 25, 46, 2, 15, 10, 7],
  HEART:  [21, 51, 26, 40],
  SACRAL: [34, 5, 14, 29, 9, 3, 42, 27, 59],
  SPLEEN: [48, 57, 44, 50, 32, 28, 18],
  SOLAR:  [36, 22, 37, 6, 49, 55, 30],
  ROOT:   [58, 38, 54, 53, 60, 52, 19, 39, 41],
}

// All 36 HD channels: [gate1, gate2, center1, center2, name, circuit]
const CHANNEL_DEFS = [
  [64, 47, 'HEAD',   'AJNA',   'Channel of Abstraction',       'Collective'],
  [61, 24, 'HEAD',   'AJNA',   'Channel of Awareness',         'Individual'],
  [63, 4,  'HEAD',   'AJNA',   'Channel of Logic',             'Collective'],
  [17, 62, 'AJNA',   'THROAT', 'Channel of Acceptance',        'Collective'],
  [11, 56, 'AJNA',   'THROAT', 'Channel of Curiosity',         'Collective'],
  [43, 23, 'AJNA',   'THROAT', 'Channel of Structuring',       'Individual'],
  [35, 36, 'THROAT', 'SOLAR',  'Channel of Transitoriness',    'Collective'],
  [12, 22, 'THROAT', 'SOLAR',  'Channel of Openness',          'Individual'],
  [45, 21, 'THROAT', 'HEART',  'Channel of Money',             'Tribal'],
  [33, 13, 'THROAT', 'G_SELF', 'Channel of The Prodigal',      'Collective'],
  [8,  1,  'THROAT', 'G_SELF', 'Channel of Inspiration',       'Individual'],
  [31, 7,  'THROAT', 'G_SELF', 'Channel of The Alpha',         'Collective'],
  [20, 10, 'THROAT', 'G_SELF', 'Channel of Awakening',         'Individual'],
  [16, 48, 'THROAT', 'SPLEEN', 'Channel of The Wavelength',    'Collective'],
  [25, 51, 'G_SELF', 'HEART',  'Channel of Initiation',        'Individual'],
  [46, 29, 'G_SELF', 'SACRAL', 'Channel of Discovery',         'Collective'],
  [2,  14, 'G_SELF', 'SACRAL', 'Channel of The Beat',          'Individual'],
  [15, 5,  'G_SELF', 'SACRAL', 'Channel of Rhythm',            'Collective'],
  [10, 20, 'G_SELF', 'THROAT', 'Channel of Awakening',         'Individual'],
  [7,  31, 'G_SELF', 'THROAT', 'Channel of The Alpha',         'Collective'],
  [13, 33, 'G_SELF', 'THROAT', 'Channel of The Prodigal',      'Collective'],
  [21, 45, 'HEART',  'THROAT', 'Channel of Money',             'Tribal'],
  [51, 25, 'HEART',  'G_SELF', 'Channel of Initiation',        'Individual'],
  [26, 44, 'HEART',  'SPLEEN', 'Channel of Surrender',         'Tribal'],
  [40, 37, 'HEART',  'SOLAR',  'Channel of Community',         'Tribal'],
  [34, 57, 'SACRAL', 'SPLEEN', 'Channel of Power',             'Individual'],
  [34, 20, 'SACRAL', 'THROAT', 'Channel of Charisma',          'Individual'],
  [34, 10, 'SACRAL', 'G_SELF', 'Channel of Exploration',       'Individual'],
  [5,  15, 'SACRAL', 'G_SELF', 'Channel of Rhythm',            'Collective'],
  [14, 2,  'SACRAL', 'G_SELF', 'Channel of The Beat',          'Individual'],
  [29, 46, 'SACRAL', 'G_SELF', 'Channel of Discovery',         'Collective'],
  [9,  52, 'SACRAL', 'ROOT',   'Channel of Concentration',     'Collective'],
  [3,  60, 'SACRAL', 'ROOT',   'Channel of Mutation',          'Individual'],
  [42, 53, 'SACRAL', 'ROOT',   'Channel of Maturation',        'Collective'],
  [27, 50, 'SACRAL', 'SPLEEN', 'Channel of Preservation',      'Tribal'],
  [59, 6,  'SACRAL', 'SOLAR',  'Channel of Mating',            'Tribal'],
  [48, 16, 'SPLEEN', 'THROAT', 'Channel of The Wavelength',    'Collective'],
  [57, 34, 'SPLEEN', 'SACRAL', 'Channel of Power',             'Individual'],
  [44, 26, 'SPLEEN', 'HEART',  'Channel of Surrender',         'Tribal'],
  [50, 27, 'SPLEEN', 'SACRAL', 'Channel of Preservation',      'Tribal'],
  [32, 54, 'SPLEEN', 'ROOT',   'Channel of Transformation',    'Tribal'],
  [28, 38, 'SPLEEN', 'ROOT',   'Channel of Struggle',          'Individual'],
  [18, 58, 'SPLEEN', 'ROOT',   'Channel of Judgment',          'Collective'],
  [36, 35, 'SOLAR',  'THROAT', 'Channel of Transitoriness',    'Collective'],
  [22, 12, 'SOLAR',  'THROAT', 'Channel of Openness',          'Individual'],
  [37, 40, 'SOLAR',  'HEART',  'Channel of Community',         'Tribal'],
  [6,  59, 'SOLAR',  'SACRAL', 'Channel of Mating',            'Tribal'],
  [49, 19, 'SOLAR',  'ROOT',   'Channel of Synthesis',         'Tribal'],
  [55, 39, 'SOLAR',  'ROOT',   'Channel of Emoting',           'Individual'],
  [30, 41, 'SOLAR',  'ROOT',   'Channel of Recognition',       'Collective'],
  [58, 18, 'ROOT',   'SPLEEN', 'Channel of Judgment',          'Collective'],
  [38, 28, 'ROOT',   'SPLEEN', 'Channel of Struggle',          'Individual'],
  [54, 32, 'ROOT',   'SPLEEN', 'Channel of Transformation',    'Tribal'],
  [53, 42, 'ROOT',   'SACRAL', 'Channel of Maturation',        'Collective'],
  [60, 3,  'ROOT',   'SACRAL', 'Channel of Mutation',          'Individual'],
  [52, 9,  'ROOT',   'SACRAL', 'Channel of Concentration',     'Collective'],
  [19, 49, 'ROOT',   'SOLAR',  'Channel of Synthesis',         'Tribal'],
  [39, 55, 'ROOT',   'SOLAR',  'Channel of Emoting',           'Individual'],
  [41, 30, 'ROOT',   'SOLAR',  'Channel of Recognition',       'Collective'],
]

// ─── Profile data ─────────────────────────────────────────────────────────────
const PROFILE_NAMES = {
  '1/3': 'Investigator / Martyr',
  '1/4': 'Investigator / Opportunist',
  '2/4': 'Hermit / Opportunist',
  '2/5': 'Hermit / Heretic',
  '3/5': 'Martyr / Heretic',
  '3/6': 'Martyr / Role Model',
  '4/6': 'Opportunist / Role Model',
  '4/1': 'Opportunist / Investigator',
  '5/1': 'Heretic / Investigator',
  '5/2': 'Heretic / Hermit',
  '6/2': 'Role Model / Hermit',
  '6/3': 'Role Model / Martyr',
}

// ─── Type / Strategy / Authority / Signature / Not-Self ──────────────────────
const TYPE_DATA = {
  Manifestor: {
    strategy: 'Inform before acting',
    notSelf: 'Anger',
    signature: 'Peace',
  },
  Generator: {
    strategy: 'Wait to Respond',
    notSelf: 'Frustration',
    signature: 'Satisfaction',
  },
  'Manifesting Generator': {
    strategy: 'Wait to Respond, then Inform',
    notSelf: 'Frustration / Anger',
    signature: 'Satisfaction / Peace',
  },
  Projector: {
    strategy: 'Wait for the Invitation',
    notSelf: 'Bitterness',
    signature: 'Success',
  },
  Reflector: {
    strategy: 'Wait a Lunar Cycle',
    notSelf: 'Disappointment',
    signature: 'Surprise',
  },
}

const AUTHORITY_DATA = {
  SOLAR:  'Emotional - Solar Plexus',
  SACRAL: 'Sacral',
  SPLEEN: 'Splenic',
  HEART:  'Ego / Heart',
  G_SELF: 'Self-Projected',
  AJNA:   'Mental',
  THROAT: 'Mental',
  none:   'Lunar',
}

// ─── Incarnation Cross lookup ─────────────────────────────────────────────────
// Key: "pSun/pEarth|dSun/dEarth"
const CROSS_LOOKUP = {
  '41/31|28/27': 'Right Angle Cross of the Unexpected',
  '13/7|1/2':    'Right Angle Cross of The Sphinx',
  '2/1|49/4':    'Right Angle Cross of The Vessel of Love',
  '10/15|18/17': 'Right Angle Cross of The Four Ways',
  '25/46|51/57': 'Right Angle Cross of The Unexpected',
  '34/20|37/40': 'Left Angle Cross of Dedication',
  '29/30|46/25': 'Right Angle Cross of The Sleeping Phoenix',
  '36/6|11/12':  'Juxtaposition Cross of Crisis',
  '1/2|4/49':    'Left Angle Cross of Defiance',
  '3/50|41/31':  'Right Angle Cross of Contagion',
  '4/49|23/43':  'Juxtaposition Cross of Formulization',
  '5/35|47/22':  'Juxtaposition Cross of Habits',
  '6/36|12/11':  'Juxtaposition Cross of Conflict',
  '7/13|1/2':    'Left Angle Cross of Masks',
  '8/14|55/59':  'Juxtaposition Cross of Contribution',
  '9/16|64/63':  'Juxtaposition Cross of Determination',
  '11/12|46/25': 'Left Angle Cross of Education',
  '14/8|59/55':  'Left Angle Cross of Uncertainty',
  '15/10|17/18': 'Right Angle Cross of The Four Ways',
  '16/9|63/64':  'Left Angle Cross of Identification',
  '17/18|15/10': 'Right Angle Cross of Service',
  '19/33|1/2':   'Right Angle Cross of The Vessel of Love',
  '20/34|37/40': 'Left Angle Cross of Cycles',
  '21/48|54/53': 'Left Angle Cross of Wishes',
  '22/47|26/45': 'Left Angle Cross of Informing',
  '23/43|30/29': 'Juxtaposition Cross of Assimilation',
  '24/44|13/7':  'Left Angle Cross of The Clarion',
  '25/46|10/15': 'Right Angle Cross of The Vessel of Love',
  '26/45|22/47': 'Juxtaposition Cross of Trickery',
  '27/28|41/31': 'Right Angle Cross of Healing',
  '28/27|41/31': 'Right Angle Cross of the Unexpected',
  '29/30|41/31': 'Left Angle Cross of Oscillation',
  '30/29|41/31': 'Juxtaposition Cross of Fates',
  '31/41|7/13':  'Left Angle Cross of the Alpha',
  '32/42|62/61': 'Juxtaposition Cross of Continuity',
  '33/19|2/1':   'Left Angle Cross of Refinement',
  '34/57|20/10': 'Left Angle Cross of Dedication',
  '35/5|47/22':  'Left Angle Cross of Cycles',
  '36/6|36/6':   'Juxtaposition Cross of Crisis',
  '37/40|55/39': 'Juxtaposition Cross of Families',
  '38/39|28/27': 'Right Angle Cross of Tension',
  '39/38|55/59': 'Juxtaposition Cross of Provocation',
  '40/37|28/27': 'Left Angle Cross of the Wishes',
  '42/32|61/62': 'Left Angle Cross of Migration',
  '43/23|29/30': 'Left Angle Cross of Intuition',
  '44/24|7/13':  'Left Angle Cross of The Clarion',
  '45/26|47/22': 'Left Angle Cross of Demands',
  '46/25|10/15': 'Left Angle Cross of Serendipity',
  '47/22|64/63': 'Left Angle Cross of The Clarion',
  '48/21|53/54': 'Left Angle Cross of The Wish Fulfiller',
  '49/4|14/8':   'Right Angle Cross of Revolution',
  '50/3|31/41':  'Left Angle Cross of Dedication',
  '51/57|25/46': 'Juxtaposition Cross of Shock',
  '52/58|21/48': 'Juxtaposition Cross of Stillness',
  '53/54|42/32': 'Juxtaposition Cross of Beginnings',
  '54/53|32/42': 'Left Angle Cross of The Demands',
  '55/59|9/16':  'Left Angle Cross of Wishes',
  '56/60|27/28': 'Juxtaposition Cross of Stimulation',
  '57/51|32/42': 'Left Angle Cross of Refinement',
  '58/52|48/21': 'Left Angle Cross of Depth',
  '59/55|6/36':  'Juxtaposition Cross of Strategy',
  '60/56|28/27': 'Juxtaposition Cross of Limitation',
  '61/62|32/42': 'Juxtaposition Cross of Thinking',
  '62/61|17/18': 'Left Angle Cross of Obscuration',
  '63/64|26/45': 'Juxtaposition Cross of Doubts',
  '64/63|47/22': 'Left Angle Cross of The Clarion',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGate(lon) {
  const adjusted = ((lon - HD_OFFSET) % 360 + 360) % 360
  const gateIndex = Math.floor(adjusted / 5.625)
  const gate = GATE_SEQUENCE[gateIndex]
  const posInGate = (adjusted % 5.625) / 5.625
  const line = Math.ceil(posInGate * 6) || 1
  return { gate, line, lon }
}

function getSunLon(date) {
  const vec = Astronomy.GeoVector('Sun', date, false)
  return Astronomy.Ecliptic(vec).elon
}

function getMeanNorthNodeLon(date) {
  const J2000 = new Date('2000-01-01T12:00:00Z')
  const days = (date - J2000) / 86400000
  return ((125.0445479 - 0.0529539297 * days) % 360 + 360) % 360
}

function getPlanetPositions(date) {
  const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
  const result = {}

  for (const p of planets) {
    const vec = Astronomy.GeoVector(p, date, false)
    const ecl = Astronomy.Ecliptic(vec)
    result[p.toLowerCase()] = getGate(ecl.elon)
  }

  // Earth = Sun + 180°
  const sunLon = result.sun.lon
  const earthLon = (sunLon + 180) % 360
  result.earth = getGate(earthLon)

  // Nodes
  const nnLon = getMeanNorthNodeLon(date)
  const snLon = (nnLon + 180) % 360
  result.northNode = getGate(nnLon)
  result.southNode = getGate(snLon)

  return result
}

function findDesignDate(birthDate) {
  const birthSunLon = getSunLon(birthDate)
  const targetLon = ((birthSunLon - 88) % 360 + 360) % 360

  let lo = new Date(birthDate.getTime() - 95 * 24 * 3600000)
  let hi = new Date(birthDate.getTime() - 82 * 24 * 3600000)

  for (let i = 0; i < 64; i++) {
    const mid = new Date((lo.getTime() + hi.getTime()) / 2)
    const midLon = getSunLon(mid)
    let diff = midLon - targetLon
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360
    if (diff < 0) lo = mid
    else hi = mid
  }

  return new Date((lo.getTime() + hi.getTime()) / 2)
}

// ─── Channel / Center analysis ────────────────────────────────────────────────

function getActiveGateNumbers(personality, design) {
  const gates = new Set()
  const allPlanets = Object.values(personality).concat(Object.values(design))
  for (const p of allPlanets) {
    if (p && p.gate) gates.add(p.gate)
  }
  return gates
}

function computeActiveChannels(activeGates) {
  const active = []
  const seen = new Set()

  for (const [g1, g2, c1, c2, name, circuit] of CHANNEL_DEFS) {
    const key = [g1, g2].sort().join('-')
    if (seen.has(key)) continue
    if (activeGates.has(g1) && activeGates.has(g2)) {
      seen.add(key)
      active.push({
        gates: [g1, g2],
        centers: [c1, c2],
        name,
        circuit,
      })
    }
  }

  return active
}

function computeCenters(activeChannels) {
  const definedCenters = new Set()

  for (const ch of activeChannels) {
    definedCenters.add(ch.centers[0])
    definedCenters.add(ch.centers[1])
  }

  // Collect which gates are active in each center
  const activeGatesInCenter = {}
  for (const centerName of Object.keys(CENTER_GATES)) {
    activeGatesInCenter[centerName] = []
  }

  return Object.fromEntries(
    Object.entries(CENTER_GATES).map(([name, gates]) => [
      name,
      {
        defined: definedCenters.has(name),
        gates: gates,
      },
    ])
  )
}

// ─── Type determination ───────────────────────────────────────────────────────

function isThroadConnectedToMotor(activeChannels, centers) {
  if (!centers.THROAT.defined) return false

  const motorCenters = ['HEART', 'SOLAR', 'SACRAL', 'ROOT']
  // BFS: find if THROAT is connected to any motor
  const visited = new Set(['THROAT'])
  const queue = ['THROAT']

  while (queue.length > 0) {
    const current = queue.shift()
    for (const ch of activeChannels) {
      const other = ch.centers[0] === current ? ch.centers[1] : ch.centers[1] === current ? ch.centers[0] : null
      if (other && !visited.has(other)) {
        visited.add(other)
        if (motorCenters.includes(other)) return true
        queue.push(other)
      }
    }
  }

  return false
}

function determineType(centers, activeChannels) {
  const sacralDefined = centers.SACRAL.defined
  const throadMotorLinked = isThroadConnectedToMotor(activeChannels, centers)

  const anyDefined = Object.values(centers).some(c => c.defined)
  if (!anyDefined) return 'Reflector'

  if (sacralDefined) {
    if (throadMotorLinked) return 'Manifesting Generator'
    return 'Generator'
  }

  // No sacral
  if (throadMotorLinked) return 'Manifestor'
  return 'Projector'
}

// ─── Authority ────────────────────────────────────────────────────────────────

function determineAuthority(centers, type) {
  if (type === 'Reflector') return 'Lunar'
  if (centers.SOLAR.defined) return AUTHORITY_DATA.SOLAR
  if (centers.SACRAL.defined) return AUTHORITY_DATA.SACRAL
  if (centers.SPLEEN.defined) return AUTHORITY_DATA.SPLEEN
  if (centers.HEART.defined) return AUTHORITY_DATA.HEART
  if (centers.G_SELF.defined) return AUTHORITY_DATA.G_SELF
  if (centers.AJNA.defined) return AUTHORITY_DATA.AJNA
  if (centers.THROAT.defined) return AUTHORITY_DATA.THROAT
  return AUTHORITY_DATA.none
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function determineProfile(personality, design) {
  // Profile = Personality Sun line / Design Sun line
  const sunLine = personality.sun.line
  const designSunLine = design.sun.line
  const key = `${sunLine}/${designSunLine}`
  return {
    profile: key,
    profileNames: PROFILE_NAMES[key] || `${sunLine}/${designSunLine}`,
  }
}

// ─── Definition ───────────────────────────────────────────────────────────────

function determineDefinition(centers, activeChannels) {
  const definedCenters = Object.entries(centers)
    .filter(([, v]) => v.defined)
    .map(([k]) => k)

  if (definedCenters.length === 0) return 'No Definition'
  if (definedCenters.length === 1) return 'Single Definition'

  // Union-Find to group connected defined centers
  const parent = {}
  for (const c of definedCenters) parent[c] = c

  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x])
    return parent[x]
  }

  function union(a, b) {
    const ra = find(a), rb = find(b)
    if (ra !== rb) parent[ra] = rb
  }

  for (const ch of activeChannels) {
    const [c1, c2] = ch.centers
    if (centers[c1]?.defined && centers[c2]?.defined) {
      union(c1, c2)
    }
  }

  const groups = new Set(definedCenters.map(find))
  const count = groups.size

  if (count === 1) return 'Single Definition'
  if (count === 2) return 'Split Definition'
  if (count === 3) return 'Triple Split Definition'
  return 'Quadruple Split Definition'
}

// ─── Incarnation Cross ────────────────────────────────────────────────────────

function determineIncarnationCross(personality, design) {
  const pSun   = personality.sun.gate
  const pEarth = personality.earth.gate
  const dSun   = design.sun.gate
  const dEarth = design.earth.gate

  const key = `${pSun}/${pEarth}|${dSun}/${dEarth}`
  const altKey = `${dSun}/${dEarth}|${pSun}/${pEarth}`

  const name =
    CROSS_LOOKUP[key] ||
    CROSS_LOOKUP[altKey] ||
    `Cross of Gates ${pSun}/${pEarth} | ${dSun}/${dEarth}`

  return `${name} (${pSun}/${pEarth} | ${dSun}/${dEarth})`
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Compute a full Human Design chart.
 *
 * @param {Object} params
 * @param {string} params.dateOfBirth  ISO date string 'YYYY-MM-DD'
 * @param {string} params.timeOfBirth  Time string 'HH:MM' (local time)
 * @param {number} params.utcOffset    UTC offset in hours (e.g. -3 for Buenos Aires)
 * @returns {Object} Full HD chart object
 */
export function computeHDChart({ dateOfBirth, timeOfBirth = '00:00', utcOffset = 0 }) {
  // Parse birth datetime → UTC
  const [year, month, day] = dateOfBirth.split('-').map(Number)
  const [hour, minute] = timeOfBirth.split(':').map(Number)
  const birthDate = new Date(Date.UTC(year, month - 1, day, hour - utcOffset, minute))

  // Find design date (88° of Sun arc before birth)
  const designDate = findDesignDate(birthDate)

  // Get planet positions for both dates
  const personality = getPlanetPositions(birthDate)
  const design = getPlanetPositions(designDate)

  // Active gates (union of all planets)
  const activeGates = getActiveGateNumbers(personality, design)

  // Channels and centers
  const activeChannels = computeActiveChannels(activeGates)
  const centers = computeCenters(activeChannels)

  // Type, authority, profile, definition, cross
  const type = determineType(centers, activeChannels)
  const authority = determineAuthority(centers, type)
  const { profile, profileNames } = determineProfile(personality, design)
  const definition = determineDefinition(centers, activeChannels)
  const cross = determineIncarnationCross(personality, design)

  const typeInfo = TYPE_DATA[type] || TYPE_DATA.Projector

  return {
    personality,
    design,
    centers,
    activeChannels,
    type,
    strategy: typeInfo.strategy,
    authority,
    profile,
    profileNames,
    definition,
    cross,
    notSelf: typeInfo.notSelf,
    signature: typeInfo.signature,
    designDate: designDate.toISOString().slice(0, 10),
    birthDate: birthDate.toISOString().slice(0, 10),
  }
}

/**
 * Build HD tags array for UI display (compatible with HD_TAGS in hdData.js)
 */
export function buildHDTags(chart) {
  const { type, profile, profileNames, authority, definition, cross } = chart
  return [
    {
      label: type.toUpperCase(),
      bg: 'rgba(64,204,221,.07)', border: 'rgba(64,204,221,.22)', color: 'var(--aqua2)',
    },
    {
      label: `${profile} ${profileNames.split(' / ')[0].toUpperCase()}·${(profileNames.split(' / ')[1] || '').toUpperCase()}`,
      bg: 'rgba(201,168,76,.06)', border: 'rgba(201,168,76,.18)', color: 'var(--gold)',
    },
    {
      label: authority.toUpperCase(),
      bg: 'rgba(212,48,112,.06)', border: 'rgba(240,96,160,.18)', color: 'var(--rose2)',
    },
    {
      label: definition.toUpperCase(),
      bg: 'rgba(104,32,176,.06)', border: 'rgba(144,80,224,.18)', color: 'var(--violet2)',
    },
    {
      label: (TYPE_DATA[type]?.strategy || '').toUpperCase(),
      bg: 'rgba(96,176,48,.06)', border: 'rgba(96,176,48,.18)', color: 'var(--lime2)',
    },
    {
      label: `CROSS ${cross.replace(/\(.*\)/, '').trim().split(' ').slice(-1)[0]}`.toUpperCase(),
      bg: 'rgba(136,68,255,.06)', border: 'rgba(136,68,255,.18)', color: '#aa80ff',
    },
  ]
}

export default computeHDChart
