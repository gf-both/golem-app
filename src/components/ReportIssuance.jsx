import { useState } from 'react'
import { useGolemStore } from '../store/useGolemStore'
import {
  issueReport,
  openReport,
  downloadReportFile,
  formatIssuedDate,
} from '../lib/reportIssuance'

const GOLD = '#c9a84c'

const st = {
  panel: {
    border: `1px solid ${GOLD}33`,
    background: GOLD + '08',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontFamily: "'Cinzel',serif",
    fontSize: 12,
    letterSpacing: '.2em',
    textTransform: 'uppercase',
    color: 'var(--foreground)',
    marginBottom: 4,
  },
  sub: {
    fontSize: 12,
    color: 'var(--muted-foreground)',
    lineHeight: 1.6,
    marginBottom: 14,
  },
  issueBtn: (enabled) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: enabled ? GOLD + '20' : 'var(--secondary)',
    border: `1px solid ${enabled ? GOLD + '55' : 'var(--border)'}`,
    borderRadius: 8,
    padding: '10px 18px',
    fontFamily: "'Cinzel',serif",
    fontSize: 11,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    color: enabled ? GOLD : 'var(--muted-foreground)',
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'all .2s',
  }),
  list: { marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--secondary)',
  },
  rowMain: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 13, color: 'var(--foreground)', fontWeight: 600 },
  rowMeta: { fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 },
  action: {
    fontSize: 10,
    fontFamily: "'Cinzel',serif",
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    padding: '5px 10px',
    borderRadius: 6,
    border: `1px solid ${GOLD}44`,
    background: GOLD + '12',
    color: GOLD,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  remove: {
    fontSize: 14,
    color: 'var(--muted-foreground)',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
  empty: {
    fontSize: 12,
    color: 'var(--muted-foreground)',
    fontStyle: 'italic',
    marginTop: 12,
  },
  badge: {
    fontSize: 9,
    padding: '2px 8px',
    borderRadius: 10,
    background: GOLD + '18',
    border: `1px solid ${GOLD}33`,
    color: GOLD,
    fontFamily: "'Cinzel',serif",
    letterSpacing: '.08em',
    marginLeft: 8,
  },
}

/**
 * ReportIssuance — issue and manage full GOLEM reports for a subject.
 *
 * @param {object}  subject          person to report on (profile or client)
 * @param {string}  subjectKey       store key (client id, or 'self')
 * @param {string}  [practitionerName] when set, stamps the report (practitioner mode)
 * @param {'practitioner'|'client'} [mode]
 */
export default function ReportIssuance({ subject, subjectKey, practitionerName = null, mode = 'client' }) {
  const allReports = useGolemStore((s) => s.issuedReports || {})
  // subjectKey '*' aggregates every issued report (client-portal view).
  const reports = subjectKey === '*'
    ? Object.values(allReports).flat().sort((a, b) => (b.issuedAt || 0) - (a.issuedAt || 0))
    : (allReports[subjectKey] || [])
  const addIssuedReport = useGolemStore((s) => s.addIssuedReport)
  const removeIssuedReport = useGolemStore((s) => s.removeIssuedReport)
  const [issuing, setIssuing] = useState(false)

  const canIssue = !!subject?.dob && mode === 'practitioner'

  function handleIssue() {
    if (!canIssue || issuing) return
    setIssuing(true)
    try {
      const { record } = issueReport({
        subject,
        store: useGolemStore.getState(),
        practitionerName,
        autoOpen: true,
      })
      addIssuedReport(subjectKey, record)
    } finally {
      setIssuing(false)
    }
  }

  const isPractitioner = mode === 'practitioner'

  return (
    <div style={st.panel}>
      <div style={st.title}>
        {isPractitioner ? 'Issue Report' : 'My Reports'}
        <span style={st.badge}>{reports.length}</span>
      </div>
      <div style={st.sub}>
        {isPractitioner
          ? `Generate a comprehensive GOLEM report across all symbolic frameworks for ${subject?.name || 'this client'}. The report carries your name and the GOLEM seal, and stays available here and in the client's portal.`
          : 'Reports issued for you by your practitioner. Open to view or save as PDF, or download the source file.'}
      </div>

      {isPractitioner && (
        <div
          onClick={handleIssue}
          style={st.issueBtn(canIssue && !issuing)}
          onMouseEnter={(e) => { if (canIssue && !issuing) e.currentTarget.style.background = GOLD + '33' }}
          onMouseLeave={(e) => { if (canIssue && !issuing) e.currentTarget.style.background = GOLD + '20' }}
        >
          {issuing ? 'Generating…' : '✶ Issue New Report'}
        </div>
      )}

      {isPractitioner && !subject?.dob && (
        <div style={st.empty}>Add this client's birth date to issue a report.</div>
      )}

      {reports.length === 0 ? (
        <div style={st.empty}>
          {isPractitioner ? 'No reports issued yet.' : 'No reports have been issued for you yet.'}
        </div>
      ) : (
        <div style={st.list}>
          {reports.map((r) => (
            <div key={r.id} style={st.row}>
              <div style={st.rowMain}>
                <div style={st.rowName}>{r.subjectName}</div>
                <div style={st.rowMeta}>
                  {formatIssuedDate(r.issuedAt)} · {r.computedCount}/{r.sectionCount} sections
                  {r.practitionerName ? ` · by ${r.practitionerName}` : ''}
                </div>
              </div>
              <div style={st.action} onClick={() => openReport(r)}>Open / PDF</div>
              <div style={st.action} onClick={() => downloadReportFile(r)}>Download</div>
              {isPractitioner && (
                <div
                  style={st.remove}
                  title="Remove"
                  onClick={() => removeIssuedReport(subjectKey, r.id)}
                >
                  ✕
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
