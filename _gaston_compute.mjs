// Compute Karen Yanina Szkliarski's full GOLEM signature from birth data.
// Birth: 23 Nov 1977, 06:30, Buenos Aires, Argentina (UTC-3)
import { getNatalChart } from './src/engines/natalEngine.js'
import { getVedicChart } from './src/engines/vedicEngine.js'
import { computeHDChart, buildHDTags } from './src/engines/hdEngine.js'
import { getGeneKeysProfile } from './src/engines/geneKeysEngine.js'
import { getNumerologyProfile } from './src/engines/numerologyEngine.js'
import { getMayanProfile } from './src/engines/mayanEngine.js'
import { getTibetanProfile } from './src/engines/tibetanEngine.js'
import { getChineseProfile } from './src/engines/chineseEngine.js'
import { getEgyptianSign } from './src/engines/egyptianEngine.js'
import { getKabbalahProfile } from './src/engines/kabbalahEngine.js'
import { getSabianProfile } from './src/engines/sabianEngine.js'
import { getFixedStars } from './src/engines/fixedStarsEngine.js'
import { getArabicParts } from './src/engines/arabicPartsEngine.js'
import { getGematriaProfile, birthDateGematria } from './src/engines/gematriaEngine.js'
import { getCareerAlignment } from './src/engines/careerAlignmentEngine.js'
import { detectPatterns } from './src/engines/patternEngine.js'

const B = {
  name: 'GASTON FRYDLEWSKI',
  day: 23, month: 1, year: 1981,
  hour: 22, minute: 10,
  lat: -34.6037, lon: -58.3816, timezone: -3,
}
const now = new Date()
const out = { birth: B }
const safe = (k, fn) => { try { out[k] = fn() } catch (err) { out[k] = { ERROR: err.message } } }

safe('natal', () => getNatalChart(B))
safe('vedic', () => getVedicChart(B))
safe('hd', () => { const c = computeHDChart({ dateOfBirth: '1981-01-23', timeOfBirth: '22:10', utcOffset: -3 }); try { c.tags = buildHDTags(c) } catch {} ; return c })
safe('geneKeys', () => getGeneKeysProfile(B))
safe('numerology', () => getNumerologyProfile({
  day: B.day, month: B.month, year: B.year,
  fullName: B.name.replace(/[^A-Z ]/g, ''),
  currentYear: now.getFullYear(), currentMonth: now.getMonth() + 1, currentDay: now.getDate(),
}))
safe('mayan', () => getMayanProfile(B.day, B.month, B.year))
safe('tibetan', () => getTibetanProfile({ day: B.day, month: B.month, year: B.year, gender: 'female' }))
safe('chinese', () => getChineseProfile({ day: B.day, month: B.month, year: B.year, hour: B.hour, minute: B.minute }))
safe('egyptian', () => getEgyptianSign(B.day, B.month))
safe('kabbalah', () => getKabbalahProfile({ day: B.day, month: B.month, year: B.year, hour: B.hour, minute: B.minute, timezone: B.timezone }))
safe('gematria', () => ({ ...getGematriaProfile({ fullName: B.name, day: B.day, month: B.month, year: B.year }), birthDate: birthDateGematria(B.day, B.month, B.year) }))

// natal-derived engines
const natal = out.natal && !out.natal.ERROR ? out.natal : null
if (natal) {
  safe('sabian', () => getSabianProfile(natal))
  safe('fixedStars', () => getFixedStars(natal))
  safe('arabicParts', () => getArabicParts(natal))
}

// profile-derived engines
const prof = {
  natal,
  hd: out.hd && !out.hd.ERROR ? out.hd : null,
  geneKeys: out.geneKeys && !out.geneKeys.ERROR ? out.geneKeys : null,
  numerology: out.numerology && !out.numerology.ERROR ? out.numerology : null,
  mayan: out.mayan && !out.mayan.ERROR ? out.mayan : null,
  enneagram: { type: 4 },
  mbti: 'INFJ',
}
safe('career', () => getCareerAlignment(prof))
safe('patterns', () => detectPatterns(prof))

console.log(JSON.stringify(out, null, 2))
