import { useState, useCallback, useMemo } from 'react'
import { useGolemStore } from '../../store/useGolemStore'
import { useComputedProfile as useActiveProfile } from '../../hooks/useActiveProfile'

/* ── Engine imports (all 22+ systems) ─────────────────────────── */
import { getNatalChart } from '../../engines/natalEngine'
import { computeHDChart } from '../../engines/hdEngine'
import { getKabbalahProfile, profileToKabArgs } from '../../engines/kabbalahEngine'
import { getNumerologyProfileFromDob } from '../../engines/numerologyEngine'
import { computeGeneKeysData } from '../../data/geneKeysData'
import { computeFullProfile as computeMayanProfile } from '../../data/mayanData'
import { getChineseProfileFromDob } from '../../engines/chineseEngine'
import { getEgyptianSign } from '../../engines/egyptianEngine'
import { getTibetanProfile } from '../../engines/tibetanEngine'
import { getVedicChart } from '../../engines/vedicEngine'
import { getGematriaProfile } from '../../engines/gematriaEngine'
import { computeCycleProfile } from '../../engines/cycleEngine'
import { getRecommendedRituals } from '../../engines/ritualEngine'
import { getCareerAlignment } from '../../engines/careerAlignmentEngine'

/* ── Styles ───────────────────────────────────────────────────── */
const S = {
  panel: {
    width: '100%', height: '100%', overflowY: 'auto', padding: '24px 28px',
    display: 'flex', flexDirection: 'column', gap: 24,
    background: 'var(--card)', color: 'var(--foreground)',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  sectionTitle: {
    fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 600, letterSpacing: '.25em',
    textTransform: 'uppercase', color: 'var(--muted-foreground)', paddingBottom: 8,
    borderBottom: '1px solid var(--accent)', marginBottom: 8,
  },
  glass: (extra = {}) => ({
    background: 'var(--secondary)', border: '1px solid var(--border)',
    borderRadius: 12, padding: 16, ...extra,
  }),
  badge: (color) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 10,
    fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.1em',
    textTransform: 'uppercase', background: color + '20', border: `1px solid ${color}44`,
    color: color, flexShrink: 0,
  }),
  btn: (active, color = '#c9a84c') => ({
    padding: '12px 28px', borderRadius: 8, cursor: active ? 'pointer' : 'not-allowed',
    fontSize: 13, fontFamily: "'Cinzel', serif", fontWeight: 700, letterSpacing: '.1em',
    textTransform: 'uppercase', transition: 'all .15s',
    background: active ? color : '#1a1a2e',
    border: `2px solid ${active ? color : '#333'}`,
    color: active ? '#000' : '#555',
    boxShadow: active ? `0 0 16px ${color}55` : 'none',
    opacity: active ? 1 : 0.5,
  }),
  checkRow: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
    cursor: 'pointer', fontSize: 13,
  },
}

const GOLD = '#c9a84c'

/* ── All report sections with their data sources ──────────────── */
export const ALL_SECTIONS = [
  { id: 'identity', label: 'Identity Agent Synthesis', icon: '⬡', storeKey: 'identityResult', category: 'AI Agents' },
  { id: 'natal', label: 'Natal Astrology', icon: '☉', engine: 'natal', category: 'Core Structural' },
  { id: 'hd', label: 'Human Design', icon: '△', engine: 'hd', category: 'Core Structural' },
  { id: 'kab', label: 'Kabbalah', icon: '✡', engine: 'kab', category: 'Core Structural' },
  { id: 'gk', label: 'Gene Keys', icon: '⬢', engine: 'gk', category: 'Core Structural' },
  { id: 'num', label: 'Numerology', icon: '∞', engine: 'num', category: 'Sacred Mathematics' },
  { id: 'gem', label: 'Gematria', icon: 'א', engine: 'gem', category: 'Sacred Mathematics' },
  { id: 'mayan', label: 'Mayan Calendar', icon: '⊿', engine: 'mayan', category: 'Archetypal' },
  { id: 'chi', label: 'Chinese Zodiac', icon: '☰', engine: 'chi', category: 'Archetypal' },
  { id: 'egyptian', label: 'Egyptian Astrology', icon: '𓂀', engine: 'egyptian', category: 'Archetypal' },
  { id: 'vedic', label: 'Vedic Astrology', icon: 'ॐ', engine: 'vedic', category: 'Eastern Wisdom' },
  { id: 'tibetan', label: 'Tibetan Astrology', icon: '☸', engine: 'tibetan', category: 'Eastern Wisdom' },
  { id: 'enn', label: 'Enneagram', icon: '⊘', storeKey: 'enneagramType', category: 'Self Knowledge' },
  { id: 'mbti', label: 'Myers-Briggs', icon: '⧫', storeKey: 'mbtiType', category: 'Self Knowledge' },
  { id: 'dosha', label: 'Ayurvedic Dosha', icon: '❦', storeKey: 'doshaType', category: 'Self Knowledge' },
  { id: 'archetype', label: 'Archetype', icon: '⊞', storeKey: 'archetypeType', category: 'Self Knowledge' },
  { id: 'lovelang', label: 'Love Language', icon: '♡', storeKey: 'loveLanguage', category: 'Self Knowledge' },
  { id: 'career', label: 'Career Alignment', icon: '⎈', engine: 'career', category: 'YOU' },
  { id: 'cycle', label: 'Cycle & Moon', icon: '◑', engine: 'cycle', category: 'Self Knowledge' },
  { id: 'palm', label: 'Palm Reading', icon: '✋', storeKey: 'palmReading', category: 'Self Knowledge' },
  { id: 'ritual', label: 'Rituals', icon: '◬', engine: 'ritual', category: 'YOU' },
]

/* ── Compute section data ─────────────────────────────────────── */
export function computeSectionData(section, profile, store) {
  try {
    if (section.storeKey) {
      // Quiz-based or AI-generated data from store
      if (section.storeKey === 'identityResult') {
        const result = store.identityResults?.[profile?.name] || store.identityResult
        return result || null
      }
      if (section.storeKey === 'palmReading') return store.palmReading || null
      // For quiz types, check the profile
      const val = profile?.[section.storeKey]
      return val ? { type: val, source: 'profile' } : null
    }

    if (!section.engine) return null

    const dob = profile?.dob
    if (!dob && section.engine !== 'ritual') return null

    switch (section.engine) {
      case 'natal': {
        if (!profile?.birthTime || !profile?.birthLat) return { partial: true, note: 'Birth time and location needed for full natal chart' }
        const d = new Date(dob)
        const [hh, mm] = (profile.birthTime || '12:00').split(':').map(Number)
        return getNatalChart({ day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear(), hour: hh, minute: mm, lat: profile.birthLat, lon: profile.birthLng || profile.birthLon, timezone: profile.timezone || 0 }) || null
      }
      case 'hd': {
        if (!profile?.birthTime || !profile?.birthLat) return { partial: true, note: 'Birth time and location needed' }
        try { return computeHDChart({ dateOfBirth: dob, timeOfBirth: profile.birthTime, utcOffset: profile.timezone || 0 }) || null }
        catch { return null }
      }
      case 'kab': {
        try {
          const kabArgs = profileToKabArgs(profile)
          return getKabbalahProfile(kabArgs) || null
        } catch { return null }
      }
      case 'num': {
        return getNumerologyProfileFromDob(dob) || null
      }
      case 'gk': {
        return computeGeneKeysData(dob) || null
      }
      case 'mayan': {
        const d = new Date(dob)
        return computeMayanProfile(d.getFullYear(), d.getMonth() + 1, d.getDate()) || null
      }
      case 'chi': {
        return getChineseProfileFromDob(dob) || null
      }
      case 'egyptian': {
        const de = new Date(dob)
        return getEgyptianSign(de.getDate(), de.getMonth() + 1) || null
      }
      case 'tibetan': {
        const dt = new Date(dob)
        return getTibetanProfile({ day: dt.getDate(), month: dt.getMonth() + 1, year: dt.getFullYear(), gender: profile?.gender }) || null
      }
      case 'vedic': {
        if (!profile?.birthTime || !profile?.birthLat) return { partial: true, note: 'Birth time and location needed' }
        const dv = new Date(dob)
        const [hvv, mvv] = (profile.birthTime || '12:00').split(':').map(Number)
        return getVedicChart({ day: dv.getDate(), month: dv.getMonth() + 1, year: dv.getFullYear(), hour: hvv, minute: mvv, lat: profile.birthLat, lon: profile.birthLng || profile.birthLon, timezone: profile.timezone || 0 }) || null
      }
      case 'gem': {
        const d2 = new Date(dob)
        return getGematriaProfile({ fullName: profile?.name || '', day: d2.getDate(), month: d2.getMonth() + 1, year: d2.getFullYear() }) || null
      }
      case 'cycle': {
        try { return computeCycleProfile(dob) || null }
        catch { return null }
      }
      case 'career': {
        return getCareerAlignment(profile) || null
      }
      case 'ritual': {
        return getRecommendedRituals(profile) || null
      }
      default: return null
    }
  } catch (e) {
    console.warn(`Error computing ${section.id}:`, e)
    return null
  }
}

/* ── Generate placement cards for key data ──────────────────── */
function generateSummary(section, data) {
  // Create a brief interpretive summary for each section
  if (!data) return ''

  switch (section.id) {
    case 'natal': {
      if (data.sun && data.moon && data.asc) {
        return `Your cosmic signature is anchored in ${data.sun?.sign || '—'} (solar will), ${data.moon?.sign || '—'} (emotional nature), and ${data.asc?.sign || '—'} (outer presentation). This trinity shapes how you embody presence, feel, and are perceived.`
      }
      return 'Your natal chart captures the planetary positions at birth—the fundamental architecture of your consciousness and destiny.'
      break
    }
    case 'hd': {
      if (data.type) {
        return `Human Design Type ${data.type}: Your energetic authority and strategy are wired to ${data.strategy || 'engage authentically'}. Your definition carries ${data.definition || 'individual impulses'} to manifestation.`
      }
      return "Human Design reveals your energetic type, strategy, and definition\u2014how you're designed to move through the world and make decisions."
      break
    }
    case 'gk': {
      if (data.lifeWork) {
        return `Your life's work unfolds through Gene Key ${data.lifeWork.keyNumber || '—'}: shadow of ${data.lifeWork.shadow || '—'}, gift of ${data.lifeWork.gift || '—'}, siddhi of ${data.lifeWork.siddhi || '—'}. This is the path of your becoming.`
      }
      return 'Gene Keys illuminate the shadow-gift-siddhi architecture within you—the alchemy by which suffering transforms into radiance.'
      break
    }
    case 'num': {
      if (data.lifePath) {
        return `Life Path ${data.lifePath.number || '—'}: ${data.lifePath.meaning || 'Your numerological blueprint guides the themes and lessons that define your incarnation.'}`
      }
      return 'Numerology translates your birth data into archetypal numbers—each carrying specific frequency and purpose.'
      break
    }
    case 'chi': {
      if (data.animal && data.element) {
        return `You are a ${data.animal} of ${data.element}—carrying both the archetypal nature of your zodiacal sign and the elemental quality that colors your expression.`
      }
      return 'Chinese astrology assigns you an animal sign and element—together they form a complete personality archetype.'
      break
    }
    case 'kab': {
      if (data.paths?.length > 0) {
        return `Your Kabbalistic pattern weaves through the Tree of Life, crossing paths of ${data.paths.slice(0, 3).join(', ')}—each a gateway to deeper self-knowledge.`
      }
      return 'Kabbalah maps your spiritual anatomy onto the Tree of Life—sacred geometry that reveals the hidden structure within you.'
      break
    }
    case 'vedic': {
      if (data.moonSign) {
        return `In Vedic astrology, your natal moon in ${data.moonSign} is your emotional anchor and past-life carryforward, while your Nakshatra (lunar mansion) colors your deepest nature.`
      }
      return 'Vedic astrology brings dharmic depth to your chart—revealing karmic patterns and spiritual purpose.'
      break
    }
    case 'enn': {
      if (data.type) {
        return `Enneagram Type ${data.type} carries its own wound, gift, and path toward integration. You are ${data.type}—rooted in ${data.type === '1' ? 'perfection' : data.type === '2' ? 'service' : data.type === '3' ? 'achievement' : data.type === '4' ? 'authenticity' : data.type === '5' ? 'understanding' : data.type === '6' ? 'loyalty' : data.type === '7' ? 'freedom' : data.type === '8' ? 'power' : 'peace'}, moving toward wisdom.`
      }
      return 'The Enneagram reveals nine discrete personality structures—each with distinct emotional pattern, defense mechanism, and path to wholeness.'
      break
    }
    case 'mbti': {
      if (data.type) {
        return `Your four-letter type (${data.type}) reveals your cognitive wiring: how you perceive information, make decisions, and orient to the outer world.`
      }
      return 'Myers-Briggs maps your psychological preferences—a compass for understanding your natural strengths and blind spots.'
      break
    }
    case 'dosha': {
      if (data.type) {
        return `Your Ayurvedic dosha (${data.type}) is the bio-energetic foundation of your constitution—the elemental combination that shapes your body, temperament, and health patterns.`
      }
      return 'Ayurvedic doshas—Vata, Pitta, Kapha—are the three fundamental bio-energetic types. Knowing yours is knowing how to balance your body and mind.'
      break
    }
    case 'mayan': {
      if (data.kin && data.trecena) {
        return `Kin ${data.kin} (${data.trecena}): Your Mayan signature places you in a specific 13-day wave of consciousness. You are a frequency-bearer in the larger cosmic calendar.`
      }
      return 'The Mayan calendar encodes the frequencies of creation—your Kin number and wave position map your place in the cosmic spiral.'
      break
    }
    default: {
      return ''
    }
  }
}

/* ── Format section data to readable text ─────────────────────── */
function formatSectionHTML(section, data) {
  if (!data) return '<p class="empty">Not yet computed — run this section in GOLEM to populate.</p>'
  if (data.partial) return `<p class="partial">${data.note || 'Partial data — additional input needed.'}</p>`

  let html = ''

  // Add summary paragraph
  const summary = generateSummary(section, data)
  if (summary) {
    html += `<p class="section-summary">${summary}</p>`
  }

  // ─────────────────────────────────────────────────────────────
  // NATAL ASTROLOGY
  // ─────────────────────────────────────────────────────────────
  if (section.id === 'natal' && typeof data === 'object') {
    html += '<div class="placement-grid">'

    // Big 3
    if (data.sun) {
      html += `<div class="placement-card big-three">
        <div class="placement-label">Sun</div>
        <div class="placement-value">${data.sun.sign || '—'}</div>
        <div class="placement-degree">${data.sun.degree || ''}°</div>
      </div>`
    }
    if (data.moon) {
      html += `<div class="placement-card big-three">
        <div class="placement-label">Moon</div>
        <div class="placement-value">${data.moon.sign || '—'}</div>
        <div class="placement-degree">${data.moon.degree || ''}°</div>
      </div>`
    }
    if (data.asc) {
      html += `<div class="placement-card big-three">
        <div class="placement-label">Ascendant</div>
        <div class="placement-value">${data.asc.sign || '—'}</div>
        <div class="placement-degree">${data.asc.degree || ''}°</div>
      </div>`
    }

    html += '</div>'

    // Planets grid
    if (data.planets && Object.keys(data.planets).length > 0) {
      html += '<div class="subsection"><h4>Planetary Placements</h4><div class="placement-grid">'
      Object.entries(data.planets).forEach(([name, planet]) => {
        if (planet && planet.sign) {
          html += `<div class="placement-card">
            <div class="placement-label">${name}</div>
            <div class="placement-value">${planet.sign || '—'}</div>
            ${planet.house ? `<div class="placement-house">House ${planet.house}</div>` : ''}
          </div>`
        }
      })
      html += '</div></div>'
    }

    // Aspects table
    if (data.aspects && data.aspects.length > 0) {
      html += '<div class="subsection"><h4>Key Aspects</h4><table class="aspects-table">'
      html += '<tr><th>Planets</th><th>Aspect</th><th>Orb</th></tr>'
      data.aspects.slice(0, 8).forEach(aspect => {
        html += `<tr><td>${aspect.p1} — ${aspect.p2}</td><td>${aspect.aspect}</td><td>${aspect.orb || '—'}°</td></tr>`
      })
      html += '</table></div>'
    }
  }

  // ─────────────────────────────────────────────────────────────
  // HUMAN DESIGN
  // ─────────────────────────────────────────────────────────────
  else if (section.id === 'hd' && typeof data === 'object') {
    html += '<div class="placement-grid">'

    if (data.type) {
      html += `<div class="placement-card hd-type">
        <div class="placement-label">Type</div>
        <div class="placement-value">${data.type}</div>
      </div>`
    }
    if (data.strategy) {
      html += `<div class="placement-card">
        <div class="placement-label">Strategy</div>
        <div class="placement-value">${data.strategy}</div>
      </div>`
    }
    if (data.authority) {
      html += `<div class="placement-card">
        <div class="placement-label">Authority</div>
        <div class="placement-value">${data.authority}</div>
      </div>`
    }
    if (data.profile) {
      html += `<div class="placement-card">
        <div class="placement-label">Profile</div>
        <div class="placement-value">${data.profile}</div>
      </div>`
    }

    html += '</div>'

    // Centers
    if (data.centers && typeof data.centers === 'object') {
      html += '<div class="subsection"><h4>Centers</h4><div class="centers-grid">'
      Object.entries(data.centers).forEach(([name, status]) => {
        const isActive = status === 'Defined' || status === true
        html += `<div class="center-card ${isActive ? 'defined' : 'undefined'}">
          <span class="center-name">${name}</span>
          <span class="center-status">${isActive ? '◯ Defined' : '◯ Undefined'}</span>
        </div>`
      })
      html += '</div></div>'
    }
  }

  // ─────────────────────────────────────────────────────────────
  // GENE KEYS
  // ─────────────────────────────────────────────────────────────
  else if (section.id === 'gk' && typeof data === 'object') {
    const spheres = ['lifeWork', 'evolution', 'radiance', 'purpose', 'venus', 'pearl']
    html += '<div class="genekeys-spheres">'

    spheres.forEach(sphereName => {
      const sphere = data[sphereName]
      if (sphere && sphere.keyNumber) {
        html += `<div class="genekey-card">
          <div class="genekey-header">${sphereName.replace(/([A-Z])/g, ' $1').trim()}</div>
          <div class="genekey-number">Key ${sphere.keyNumber}</div>
          <div class="genekey-arc">
            <span class="arc-shadow">${sphere.shadow || '—'}</span>
            <span class="arc-arrow">→</span>
            <span class="arc-gift">${sphere.gift || '—'}</span>
            <span class="arc-arrow">→</span>
            <span class="arc-siddhi">${sphere.siddhi || '—'}</span>
          </div>
          ${sphere.iching ? `<div class="genekey-iching">${sphere.iching}</div>` : ''}
        </div>`
      }
    })

    html += '</div>'
  }

  // ─────────────────────────────────────────────────────────────
  // NUMEROLOGY
  // ─────────────────────────────────────────────────────────────
  else if (section.id === 'num' && typeof data === 'object') {
    html += '<div class="numerology-grid">'

    const numFields = ['lifePath', 'expression', 'soulUrge', 'birthday', 'personalYear']
    numFields.forEach(field => {
      const numData = data[field]
      if (numData && numData.number) {
        html += `<div class="number-card">
          <div class="number-value">${numData.number}</div>
          <div class="number-label">${field.replace(/([A-Z])/g, ' $1').trim()}</div>
          ${numData.meaning ? `<div class="number-meaning">${numData.meaning}</div>` : ''}
        </div>`
      }
    })

    html += '</div>'
  }

  // ─────────────────────────────────────────────────────────────
  // CHINESE ZODIAC
  // ─────────────────────────────────────────────────────────────
  else if (section.id === 'chi' && typeof data === 'object') {
    html += '<div class="placement-grid">'

    if (data.animal) {
      html += `<div class="placement-card">
        <div class="placement-label">Animal</div>
        <div class="placement-value">${data.animal}</div>
      </div>`
    }
    if (data.element) {
      html += `<div class="placement-card">
        <div class="placement-label">Element</div>
        <div class="placement-value">${data.element}</div>
      </div>`
    }
    if (data.yinYang) {
      html += `<div class="placement-card">
        <div class="placement-label">Polarity</div>
        <div class="placement-value">${data.yinYang}</div>
      </div>`
    }

    html += '</div>'

    if (data.traits && data.traits.length > 0) {
      html += `<div class="subsection"><h4>Character</h4><p>${data.traits.join(', ')}</p></div>`
    }
  }

  // ─────────────────────────────────────────────────────────────
  // ENNEAGRAM, MBTI, DOSHA (Quiz-based simple types)
  // ─────────────────────────────────────────────────────────────
  else if (['enn', 'mbti', 'dosha', 'archetype', 'lovelang', 'egyptian'].includes(section.id)) {
    let typeValue = data.type || data
    let typeLabel = typeValue.toString()

    html += `<div class="placement-grid">`
    html += `<div class="placement-card quiz-type">
      <div class="placement-label">${section.label}</div>
      <div class="placement-value" style="font-size: 2.5em;">${typeLabel}</div>
    </div>`
    html += `</div>`

    if (data.description) {
      html += `<div class="subsection"><p>${data.description}</p></div>`
    }
  }

  // ─────────────────────────────────────────────────────────────
  // KABBALAH
  // ─────────────────────────────────────────────────────────────
  else if (section.id === 'kab' && typeof data === 'object') {
    if (data.paths && data.paths.length > 0) {
      html += '<div class="subsection"><h4>Tree of Life Paths</h4><div class="paths-list">'
      data.paths.forEach(path => {
        html += `<div class="path-item"><strong>${path.name || path}</strong>${path.description ? ` — ${path.description}` : ''}</div>`
      })
      html += '</div></div>'
    }
    if (data.sephiroth && Object.keys(data.sephiroth).length > 0) {
      html += '<div class="subsection"><h4>Sephiroth</h4><div class="placement-grid">'
      Object.entries(data.sephiroth).slice(0, 6).forEach(([name, value]) => {
        html += `<div class="placement-card"><div class="placement-label">${name}</div><div class="placement-value">${value.number || '—'}</div></div>`
      })
      html += '</div></div>'
    }
  }

  // ─────────────────────────────────────────────────────────────
  // MAYAN CALENDAR
  // ─────────────────────────────────────────────────────────────
  else if (section.id === 'mayan' && typeof data === 'object') {
    html += '<div class="placement-grid">'

    if (data.kin) {
      html += `<div class="placement-card">
        <div class="placement-label">Kin</div>
        <div class="placement-value">${data.kin}</div>
      </div>`
    }
    if (data.trecena) {
      html += `<div class="placement-card">
        <div class="placement-label">Trecena (Wave)</div>
        <div class="placement-value">${data.trecena}</div>
      </div>`
    }
    if (data.tone) {
      html += `<div class="placement-card">
        <div class="placement-label">Tone</div>
        <div class="placement-value">${data.tone}</div>
      </div>`
    }

    html += '</div>'
  }

  // ─────────────────────────────────────────────────────────────
  // IDENTITY AGENT (AI Synthesis)
  // ─────────────────────────────────────────────────────────────
  else if (section.id === 'identity') {
    if (typeof data === 'string') {
      html = `<div class="identity-synthesis">${data.replace(/\n/g, '<br>')}</div>`
    } else if (data.synthesis || data.summary) {
      html = `<div class="identity-synthesis">${(data.synthesis || data.summary || '').replace(/\n/g, '<br>')}</div>`
    }
  }

  // ─────────────────────────────────────────────────────────────
  // FALLBACK: Generic object renderer for unmapped sections
  // ─────────────────────────────────────────────────────────────
  else if (!html) {
    function renderObj(obj, depth = 0) {
      if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
        return `<span>${String(obj)}</span>`
      }
      if (Array.isArray(obj)) {
        if (obj.length === 0) return '<span>—</span>'
        return '<ul>' + obj.map(item =>
          typeof item === 'object' && item !== null
            ? '<li>' + renderObj(item, depth + 1) + '</li>'
            : `<li>${String(item)}</li>`
        ).join('') + '</ul>'
      }
      if (typeof obj === 'object' && obj !== null) {
        const entries = Object.entries(obj).filter(([k]) => !k.startsWith('_'))
        if (entries.length === 0) return '<span>—</span>'
        return '<div class="obj-grid">' + entries.map(([k, v]) => {
          const label = k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()
          const val = typeof v === 'object' && v !== null ? renderObj(v, depth + 1) : String(v ?? '—')
          return `<div class="obj-row"><span class="obj-key">${label}</span><span class="obj-val">${val}</span></div>`
        }).join('') + '</div>'
      }
      return '<span>—</span>'
    }
    html = renderObj(data)
  }

  return html
}

/* ── Generate printable HTML ──────────────────────────────────── */
export function generateReportHTML(profile, sections, sectionData, meta = {}) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const practitionerName = meta.practitionerName ? String(meta.practitionerName).trim() : ''

  const sectionsByCategory = {}
  sections.forEach(s => {
    const cat = s.category || 'Other'
    if (!sectionsByCategory[cat]) sectionsByCategory[cat] = []
    sectionsByCategory[cat].push(s)
  })

  let body = ''
  for (const [category, catSections] of Object.entries(sectionsByCategory)) {
    body += `<div class="category"><h2>${category}</h2>`
    for (const section of catSections) {
      const data = sectionData[section.id]
      body += `
        <div class="section">
          <h3><span class="section-icon">${section.icon}</span> ${section.label}</h3>
          ${formatSectionHTML(section, data)}
        </div>
      `
    }
    body += '</div>'
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>GOLEM — Full Profile Report — ${profile?.name || 'Unknown'}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @page {
    size: A4;
    margin: 20mm 18mm;
  }

  body {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 11pt;
    line-height: 1.8;
    color: #2d2d3d;
    background: #fff;
    padding: 0;
  }

  /* ── COVER PAGE ───────────────────────────────────────────── */
  .cover {
    page-break-after: always;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 95vh;
    text-align: center;
    padding: 60px 40px;
  }

  .cover-logo {
    font-family: 'Cinzel', serif;
    font-size: 56pt;
    font-weight: 700;
    letter-spacing: 0.4em;
    color: #c9a84c;
    margin-bottom: 4px;
    text-transform: uppercase;
  }

  .cover-sub {
    font-family: 'Cinzel', serif;
    font-size: 9.5pt;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 64px;
    font-weight: 400;
  }

  .cover-name {
    font-family: 'Cinzel', serif;
    font-size: 28pt;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 16px;
    letter-spacing: 0.05em;
  }

  .cover-dob {
    font-size: 12pt;
    color: #666;
    margin-bottom: 6px;
  }

  .cover-date {
    font-size: 9.5pt;
    color: #aaa;
    margin-top: 64px;
    font-style: italic;
  }

  .cover-line {
    width: 100px;
    height: 1.5px;
    background: linear-gradient(90deg, transparent, #c9a84c, transparent);
    margin: 32px auto;
  }

  /* ── TABLE OF CONTENTS ────────────────────────────────────── */
  .toc {
    page-break-after: always;
    padding: 40px 0;
  }

  .toc h2 {
    font-family: 'Cinzel', serif;
    font-size: 13pt;
    font-weight: 600;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #c9a84c;
    border-bottom: 2px solid #c9a84c;
    padding-bottom: 12px;
    margin-bottom: 28px;
  }

  .toc-category {
    font-family: 'Cinzel', serif;
    font-size: 9.5pt;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #2d2d3d;
    margin: 18px 0 10px;
    padding-top: 8px;
  }

  .toc-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 0 5px 20px;
    font-size: 11pt;
    color: #444;
  }

  .toc-icon {
    width: 18px;
    text-align: center;
    font-size: 11pt;
  }

  .toc-status {
    margin-left: auto;
    font-size: 8pt;
    color: #aaa;
    font-style: italic;
  }

  /* ── CATEGORY HEADERS ─────────────────────────────────────── */
  .category h2 {
    font-family: 'Cinzel', serif;
    font-size: 13pt;
    font-weight: 600;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #c9a84c;
    border-bottom: 2px solid #c9a84c;
    padding-bottom: 10px;
    margin: 40px 0 24px;
    page-break-after: avoid;
  }

  /* ── SECTION CONTAINERS ───────────────────────────────────── */
  .section {
    margin-bottom: 28px;
    page-break-inside: avoid;
  }

  .section h3 {
    font-family: 'Cinzel', serif;
    font-size: 11.5pt;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #2d2d3d;
    border-bottom: 1.5px solid #c9a84c;
    padding-bottom: 8px;
    margin-bottom: 14px;
    page-break-after: avoid;
  }

  .section-icon {
    margin-right: 10px;
    opacity: 0.8;
  }

  /* ── SUMMARY PARAGRAPHS ───────────────────────────────────── */
  .section-summary {
    font-style: italic;
    color: #555;
    margin-bottom: 16px;
    line-height: 1.7;
    padding: 10px 0;
    border-left: 2px solid #c9a84c;
    padding-left: 12px;
  }

  /* ── PLACEMENT CARDS (Key data in visual grid) ──────────── */
  .placement-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin: 14px 0;
  }

  .placement-card {
    border: 1px solid #c9a84c;
    border-radius: 6px;
    padding: 12px 10px;
    text-align: center;
    background: #fafaf8;
    page-break-inside: avoid;
  }

  .placement-card.big-three {
    border: 1.5px solid #c9a84c;
    background: #fef9f0;
    padding: 14px 10px;
  }

  .placement-card.hd-type {
    border: 1.5px solid #c9a84c;
    background: #fef9f0;
  }

  .placement-card.quiz-type {
    border: 1.5px solid #c9a84c;
    background: #fef9f0;
  }

  .placement-label {
    font-family: 'Cinzel', serif;
    font-size: 8pt;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #c9a84c;
    margin-bottom: 6px;
  }

  .placement-value {
    font-size: 13pt;
    font-weight: 600;
    color: #2d2d3d;
    margin-bottom: 4px;
  }

  .placement-degree {
    font-size: 9pt;
    color: #999;
  }

  .placement-house {
    font-size: 8pt;
    color: #c9a84c;
    margin-top: 4px;
    font-style: italic;
  }

  /* ── GENE KEYS SPHERES ────────────────────────────────────── */
  .genekeys-spheres {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
    margin: 14px 0;
  }

  .genekey-card {
    border: 1px solid #c9a84c;
    border-radius: 6px;
    padding: 12px;
    background: #fafaf8;
    page-break-inside: avoid;
  }

  .genekey-header {
    font-family: 'Cinzel', serif;
    font-size: 8pt;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #c9a84c;
    margin-bottom: 6px;
  }

  .genekey-number {
    font-size: 12pt;
    font-weight: 600;
    color: #2d2d3d;
    margin-bottom: 6px;
  }

  .genekey-arc {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 9pt;
    line-height: 1.5;
  }

  .arc-shadow, .arc-gift, .arc-siddhi {
    padding: 3px 4px;
    background: #f0f0f0;
    border-radius: 4px;
  }

  .arc-shadow {
    background: #fff0f0;
    color: #d32f2f;
  }

  .arc-gift {
    background: #f0f8ff;
    color: #1976d2;
  }

  .arc-siddhi {
    background: #f0fff0;
    color: #388e3c;
  }

  .arc-arrow {
    font-size: 8pt;
    color: #c9a84c;
    text-align: center;
  }

  .genekey-iching {
    font-size: 8pt;
    color: #999;
    margin-top: 6px;
    font-style: italic;
  }

  /* ── NUMEROLOGY CARDS ─────────────────────────────────────── */
  .numerology-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 12px;
    margin: 14px 0;
  }

  .number-card {
    border: 1.5px solid #c9a84c;
    border-radius: 6px;
    padding: 12px 8px;
    text-align: center;
    background: #fef9f0;
    page-break-inside: avoid;
  }

  .number-value {
    font-size: 24pt;
    font-weight: 700;
    color: #c9a84c;
    margin-bottom: 4px;
  }

  .number-label {
    font-family: 'Cinzel', serif;
    font-size: 8pt;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #2d2d3d;
    margin-bottom: 6px;
  }

  .number-meaning {
    font-size: 8.5pt;
    color: #666;
    line-height: 1.4;
  }

  /* ── CENTERS GRID (Human Design) ──────────────────────────── */
  .centers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 10px;
    margin: 14px 0;
  }

  .center-card {
    border: 1px solid #c9a84c;
    border-radius: 6px;
    padding: 10px;
    text-align: center;
    background: #fafaf8;
  }

  .center-card.defined {
    background: #f0fff0;
  }

  .center-card.undefined {
    background: #f5f5f5;
  }

  .center-name {
    display: block;
    font-family: 'Cinzel', serif;
    font-size: 9pt;
    font-weight: 600;
    color: #2d2d3d;
    margin-bottom: 4px;
  }

  .center-status {
    display: block;
    font-size: 8pt;
    color: #c9a84c;
  }

  /* ── SUBSECTIONS (for nested content) ──────────────────────── */
  .subsection {
    margin: 14px 0;
    padding: 12px 14px;
    background: #f8f8f6;
    border-left: 2px solid #c9a84c;
    page-break-inside: avoid;
  }

  .subsection h4 {
    font-family: 'Cinzel', serif;
    font-size: 9.5pt;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #c9a84c;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #c9a84c33;
  }

  .subsection p {
    margin: 6px 0;
    font-size: 10.5pt;
    line-height: 1.6;
  }

  /* ── PATHS LIST (Kabbalah) ────────────────────────────────── */
  .paths-list {
    display: grid;
    gap: 8px;
  }

  .path-item {
    padding: 8px 10px;
    border-left: 2px solid #c9a84c;
    padding-left: 12px;
    font-size: 10pt;
  }

  /* ── ASPECTS TABLE (Natal) ────────────────────────────────── */
  .aspects-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 10pt;
  }

  .aspects-table th {
    font-family: 'Cinzel', serif;
    font-size: 8.5pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #c9a84c;
    border-bottom: 1px solid #c9a84c;
    padding: 6px 6px;
    text-align: left;
  }

  .aspects-table td {
    padding: 5px 6px;
    border-bottom: 1px solid #e0e0e0;
  }

  .aspects-table tr:nth-child(odd) td {
    background: #fafaf8;
  }

  /* ── IDENTITY SYNTHESIS (AI) ──────────────────────────────── */
  .identity-synthesis {
    line-height: 1.8;
    font-size: 11pt;
    color: #2d2d3d;
    padding: 12px 0;
  }

  /* ── PLACEHOLDER / ERROR STATES ───────────────────────────── */
  .empty {
    color: #aaa;
    font-style: italic;
    padding: 12px 14px;
    background: #f5f5f5;
    border: 1px dashed #ddd;
    border-radius: 4px;
    font-size: 10pt;
  }

  .partial {
    color: #d97706;
    font-style: italic;
    padding: 12px 14px;
    background: #fffbf0;
    border: 1px solid #fed7aa;
    border-radius: 4px;
    font-size: 10pt;
  }

  /* ── GENERIC OBJECT GRID (fallback) ───────────────────────── */
  .obj-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2px;
    padding: 6px 0;
  }

  .obj-row {
    display: flex;
    gap: 12px;
    padding: 4px 0;
    border-bottom: 1px solid #f0f0f0;
    page-break-inside: avoid;
  }

  .obj-key {
    font-weight: 600;
    text-transform: capitalize;
    color: #555;
    min-width: 120px;
    flex-shrink: 0;
    font-size: 10pt;
  }

  .obj-val {
    color: #2d2d3d;
    flex: 1;
    font-size: 10pt;
  }

  /* ── ISSUANCE SEAL ────────────────────────────────────────── */
  .issued-seal {
    margin-top: 40px;
    text-align: center;
  }
  .issued-seal-mark {
    font-family: 'Cinzel', serif;
    font-size: 11pt;
    letter-spacing: 0.35em;
    color: #c9a84c;
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  .issued-seal-label {
    font-size: 8.5pt;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #aaa;
  }
  .issued-seal-name {
    font-family: 'Cinzel', serif;
    font-size: 14pt;
    color: #1a1a2e;
    margin: 2px 0 2px;
  }
  .issued-seal-sub {
    font-size: 8pt;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #c9a84c;
  }

  /* ── FOOTER ───────────────────────────────────────────────── */
  .footer {
    margin-top: 56px;
    padding-top: 12px;
    border-top: 1px solid #ddd;
    text-align: center;
    font-size: 8.5pt;
    color: #999;
    font-style: italic;
  }
  .footer-mark {
    font-family: 'Cinzel', serif;
    font-size: 9pt;
    letter-spacing: 0.3em;
    color: #c9a84c;
    font-style: normal;
    margin-bottom: 6px;
  }

  /* ── LISTS ────────────────────────────────────────────────── */
  ul {
    padding-left: 18px;
    margin: 6px 0;
  }

  li {
    margin: 3px 0;
    font-size: 10pt;
  }

  /* ── PRINT MEDIA ──────────────────────────────────────────── */
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- Cover Page -->
<div class="cover">
  <div class="cover-logo">GOLEM</div>
  <div class="cover-sub">Self-Knowledge Operating System</div>
  <div class="cover-line"></div>
  <div class="cover-name">${profile?.name || 'Profile'}</div>
  <div class="cover-dob">${profile?.dob ? new Date(profile.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</div>
  ${profile?.birthPlace ? `<div class="cover-dob">${profile.birthPlace}</div>` : ''}
  <div class="cover-line"></div>
  <div class="cover-date">Generated ${dateStr}</div>
  <div class="cover-date" style="margin-top:4px; font-size:8pt;">22 Symbolic Frameworks · Computation & Synthesis · ${sections.length} Sections</div>
  ${practitionerName ? `
  <div class="cover-line"></div>
  <div class="issued-seal">
    <div class="issued-seal-mark">✶ GOLEM ✶</div>
    <div class="issued-seal-label">Issued by</div>
    <div class="issued-seal-name">${practitionerName}</div>
    <div class="issued-seal-sub">Certified GOLEM Practitioner</div>
  </div>` : ''}
</div>

<!-- Table of Contents -->
<div class="toc">
  <h2>Table of Contents</h2>
  ${Object.entries(sectionsByCategory).map(([cat, secs]) => `
    <div class="toc-category">${cat}</div>
    ${secs.map(s => `
      <div class="toc-item">
        <span class="toc-icon">${s.icon}</span>
        <span>${s.label}</span>
        <span class="toc-status">${sectionData[s.id] ? (sectionData[s.id].partial ? 'partial' : 'computed') : 'pending'}</span>
      </div>
    `).join('')}
  `).join('')}
</div>

<!-- Report Body -->
${body}

<!-- Footer -->
<div class="footer">
  <div class="footer-mark">✶ GOLEM ✶</div>
  GOLEM — Know Thyself · Computation is the foundation, synthesis is the product · ${dateStr}
  ${practitionerName ? `<div style="margin-top:4px;">Issued by ${practitionerName} · Certified GOLEM Practitioner</div>` : ''}
</div>

</body>
</html>`
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Component                                                */
/* ═══════════════════════════════════════════════════════════════ */
export default function FullReportDetail() {
  const profile = useActiveProfile()
  const store = useGolemStore()

  const [selectedSections, setSelectedSections] = useState(
    ALL_SECTIONS.map(s => s.id)
  )
  const [generating, setGenerating] = useState(false)

  const toggleSection = (id) => {
    setSelectedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedSections.length === ALL_SECTIONS.length) {
      setSelectedSections([])
    } else {
      setSelectedSections(ALL_SECTIONS.map(s => s.id))
    }
  }

  // Compute status for each section
  const sectionStatus = useMemo(() => {
    const status = {}
    ALL_SECTIONS.forEach(section => {
      const data = computeSectionData(section, profile, store)
      status[section.id] = {
        hasData: !!data && !data.partial,
        partial: data?.partial,
        data,
      }
    })
    return status
  }, [profile, store])

  const computedCount = Object.values(sectionStatus).filter(s => s.hasData).length
  const totalCount = ALL_SECTIONS.length

  /* ── Generate Report ────────────────────────────────────────── */
  const generateReport = useCallback(() => {
    setGenerating(true)

    try {
      const sections = ALL_SECTIONS.filter(s => selectedSections.includes(s.id))
      const sectionData = {}
      sections.forEach(s => {
        sectionData[s.id] = sectionStatus[s.id]?.data || null
      })

      const html = generateReportHTML(profile, sections, sectionData)

      // Open in new window for printing
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
        // Auto-trigger print dialog after a brief delay
        setTimeout(() => {
          win.print()
        }, 800)
      }
    } finally {
      setGenerating(false)
    }
  }, [selectedSections, profile, sectionStatus])

  // Group sections by category for display
  const categories = useMemo(() => {
    const cats = {}
    ALL_SECTIONS.forEach(s => {
      const cat = s.category || 'Other'
      if (!cats[cat]) cats[cat] = []
      cats[cat].push(s)
    })
    return cats
  }, [])

  return (
    <div style={S.panel}>
      {/* Header */}
      <div style={S.glass({ borderColor: GOLD + '44', background: GOLD + '08' })}>
        <div style={S.sectionTitle}>Full GOLEM Report</div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted-foreground)' }}>
          Generate a comprehensive PDF report across all {totalCount} symbolic frameworks.
          Sections you haven't computed yet will appear as placeholders in the report.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={S.badge(GOLD)}>{computedCount} of {totalCount} computed</span>
          <span style={S.badge('#4caf50')}>{selectedSections.length} selected for report</span>
        </div>
      </div>

      {/* Profile Info */}
      <div style={S.glass()}>
        <div style={S.sectionTitle}>Report Subject</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)' }}>{profile?.name || 'No name set'}</div>
          {profile?.dob && <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Born: {new Date(profile.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>}
          {profile?.birthPlace && <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Location: {profile.birthPlace}</div>}
          {profile?.birthTime && <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Time: {profile.birthTime}</div>}
        </div>
      </div>

      {/* Section Selection */}
      <div style={S.glass()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={S.sectionTitle}>Select Sections</div>
          <div
            onClick={toggleAll}
            style={{
              fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase',
              color: GOLD, cursor: 'pointer', padding: '4px 10px', borderRadius: 6,
              border: `1px solid ${GOLD}44`, background: GOLD + '10',
            }}
          >
            {selectedSections.length === totalCount ? 'Deselect All' : 'Select All'}
          </div>
        </div>

        {Object.entries(categories).map(([cat, sections]) => (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase',
              color: 'var(--muted-foreground)', marginBottom: 6, paddingLeft: 4,
            }}>
              {cat}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sections.map(section => {
                const status = sectionStatus[section.id]
                const checked = selectedSections.includes(section.id)
                return (
                  <div
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    style={S.checkRow}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: `1.5px solid ${checked ? GOLD : 'var(--border)'}`,
                      background: checked ? GOLD + '30' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .15s', fontSize: 10, color: GOLD,
                    }}>
                      {checked ? '✓' : ''}
                    </div>
                    <span style={{ fontSize: 14 }}>{section.icon}</span>
                    <span style={{ flex: 1, color: 'var(--foreground)' }}>{section.label}</span>
                    <span style={S.badge(
                      status?.hasData ? '#4caf50' : status?.partial ? '#ff9800' : '#555'
                    )}>
                      {status?.hasData ? 'ready' : status?.partial ? 'partial' : 'pending'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Generate Button */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        <div
          onClick={() => selectedSections.length > 0 && !generating && generateReport()}
          style={S.btn(selectedSections.length > 0 && !generating, GOLD)}
        >
          {generating ? 'Generating...' : `Download Report (${selectedSections.length} sections)`}
        </div>
      </div>

      {/* How it works */}
      <div style={S.glass({ opacity: 0.7 })}>
        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
          The report opens in a new window with your browser's Print dialog.
          Select "Save as PDF" to download. All computed sections will include full data;
          uncomputed sections will show as placeholders you can fill in later by running those sections in GOLEM.
        </div>
      </div>
    </div>
  )
}
