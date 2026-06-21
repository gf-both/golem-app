import { SynastryInner } from '../overlays/SynastryPanel'
import AboutSystemButton from '../ui/AboutSystemButton'

export default function SynastryDetail() {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <style>{`
        .synastry-detail-embed .synastry-panel {
          width: 100% !important;
          max-width: 100% !important;
          height: 100% !important;
          border-radius: 0 !important;
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
        }
      `}</style>
      <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div>Synastry</div>
        <AboutSystemButton systemName="Synastry" />
      </div>
      <div className="synastry-detail-embed" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <SynastryInner />
      </div>
    </div>
  )
}
