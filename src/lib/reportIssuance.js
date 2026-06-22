/**
 * reportIssuance.js — issue, store, and download GOLEM reports.
 *
 * A "report issuance" packages the full multi-framework report for a subject
 * (a client or the user themselves) into a self-contained HTML document that
 * can be printed/saved as PDF. When a practitioner issues a report for a
 * client, the practitioner's name and the GOLEM marks are stamped onto it.
 *
 * Reports are recorded in the store (issuedReports) so they remain visible
 * and re-downloadable from both the Practitioner and Client portals.
 */
import {
  ALL_SECTIONS,
  computeSectionData,
  generateReportHTML,
} from '../components/details/FullReportDetail'

/**
 * Normalize any person object (app profile or practitioner client) into the
 * shape the report engine expects (birthTime, birthLat, birthLng, timezone…).
 */
export function toReportProfile(person) {
  if (!person) return {}
  const p = { ...person }

  // Birth time → "HH:MM"
  if (!p.birthTime) {
    if (p.tob) p.birthTime = p.tob
    else if (p.birthHour != null) {
      const hh = String(p.birthHour).padStart(2, '0')
      const mm = String(p.birthMinute ?? 0).padStart(2, '0')
      p.birthTime = `${hh}:${mm}`
    } else {
      p.birthTime = '12:00'
    }
  }

  // Coordinates
  if (p.birthLng == null) p.birthLng = p.birthLon ?? p.lon ?? null
  if (p.birthLat == null) p.birthLat = p.lat ?? null

  // Timezone (report engine reads `timezone`)
  if (p.timezone == null) p.timezone = p.birthTimezone ?? p.tz ?? 0

  // Location label
  if (!p.birthPlace) p.birthPlace = p.birthCity || p.location || ''

  return p
}

/** Compute section data for the given sections (defaults to all). */
export function computeAllSectionData(profile, store, sectionIds = null) {
  const sections = sectionIds
    ? ALL_SECTIONS.filter((s) => sectionIds.includes(s.id))
    : ALL_SECTIONS
  const sectionData = {}
  sections.forEach((s) => {
    try {
      sectionData[s.id] = computeSectionData(s, profile, store) || null
    } catch {
      sectionData[s.id] = null
    }
  })
  return { sections, sectionData }
}

/** Open an HTML string in a new window and trigger the print/save dialog. */
function openHtmlForPrint(html) {
  const win = window.open('', '_blank')
  if (!win) return false
  win.document.write(html)
  win.document.close()
  setTimeout(() => {
    try { win.print() } catch { /* user can print manually */ }
  }, 800)
  return true
}

/**
 * Issue a report for a subject. Builds the HTML, opens it for download, and
 * returns a record to store. Pass `practitionerName` to stamp the report.
 *
 * @returns {{record: object, opened: boolean}}
 */
export function issueReport({ subject, store, practitionerName = null, sectionIds = null, autoOpen = true }) {
  const profile = toReportProfile(subject)
  const { sections, sectionData } = computeAllSectionData(profile, store, sectionIds)
  const html = generateReportHTML(profile, sections, sectionData, {
    practitionerName: practitionerName || '',
  })

  const computedCount = Object.values(sectionData).filter((d) => d && !d.partial).length

  const newId = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const record = {
    id: newId,
    subjectName: profile?.name || 'Profile',
    subjectDob: profile?.dob || null,
    practitionerName: practitionerName || null,
    issuedAt: Date.now(),
    sectionCount: sections.length,
    computedCount,
    html,
  }

  const opened = autoOpen ? openHtmlForPrint(html) : false
  return { record, opened }
}

/** Re-open a stored report for printing / saving as PDF. */
export function openReport(record) {
  if (!record?.html) return false
  return openHtmlForPrint(record.html)
}

/** Download a stored report as a standalone .html file. */
export function downloadReportFile(record) {
  if (!record?.html) return false
  const safe = (record.subjectName || 'report').replace(/[^a-z0-9]+/gi, '_')
  const date = new Date(record.issuedAt || Date.now()).toISOString().slice(0, 10)
  const blob = new Blob([record.html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `GOLEM_Report_${safe}_${date}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return true
}

export function formatIssuedDate(ts) {
  try {
    return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}
