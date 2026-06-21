import { useState, useEffect, useCallback } from 'react'
import { useGolemStore } from '../../store/useGolemStore'
import { computeCycleProfile, getMoonPhase } from '../../engines/cycleEngine'
import CycleWheel from '../canvas/CycleWheel'
import AboutSystemButton from '../ui/AboutSystemButton'

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
    borderBottom: '1px solid var(--accent)', marginBottom: 4,
  },
}

export default function CycleDetail() {
  const activeViewProfile = useGolemStore(s => s.activeViewProfile)
  const primaryProfile = useGolemStore(s => s.primaryProfile)
  const profile = activeViewProfile || primaryProfile
  const isPrimary = !activeViewProfile
  const setPrimaryProfile = useGolemStore(s => s.setPrimaryProfile)
  const updatePerson = useGolemStore(s => s.updatePerson)
  const setActiveViewProfile = useGolemStore(s => s.setActiveViewProfile)

  const [lastPeriod, setLastPeriod] = useState(profile?.lastPeriodDate || '')
  const [cycleLen, setCycleLen] = useState(profile?.cycleLength || 28)
  const [gender, setGender] = useState(profile?.gender || '')
  const [saved, setSaved] = useState(false)

  // Save to correct target: primaryProfile or person in people array
  const saveProfile = useCallback((updates) => {
    if (isPrimary) {
      setPrimaryProfile(updates)
    } else if (profile?.id) {
      updatePerson(profile.id, updates)
      // Also update the activeViewProfile so the UI reflects changes immediately
      setActiveViewProfile({ ...profile, ...updates })
    }
  }, [isPrimary, profile?.id, setPrimaryProfile, updatePerson, setActiveViewProfile])

  // Auto-save cycle data whenever inputs change
  const autoSave = useCallback((lp, cl, g) => {
    const updates = { cycleLength: cl, gender: g }
    if (lp) updates.lastPeriodDate = lp
    saveProfile(updates)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }, [saveProfile])

  // Re-sync local state if profile changes (e.g. switching active profile)
  useEffect(() => {
    setLastPeriod(profile?.lastPeriodDate || '')
    setCycleLen(profile?.cycleLength || 28)
    setGender(profile?.gender || '')
  }, [profile?.lastPeriodDate, profile?.cycleLength, profile?.gender, profile?.id])

  function handleLastPeriodChange(val) {
    setLastPeriod(val)
    if (val) autoSave(val, cycleLen, gender)
  }

  function handleCycleLenChange(val) {
    const n = Number(val)
    setCycleLen(n)
    autoSave(lastPeriod, n, gender)
  }

  function handleGenderChange(val) {
    setGender(val)
    if (val !== 'female') {
      // Clear cycle data when switching away from female
      setLastPeriod('')
      setCycleLen(28)
      saveProfile({ gender: val, lastPeriodDate: '', cycleLength: 28 })
    } else {
      saveProfile({ gender: val })
    }
  }

  const isFemale = gender === 'female'
  const cycle = lastPeriod ? computeCycleProfile(lastPeriod, cycleLen) : null
  const moon = getMoonPhase()

  return (
    <div style={S.panel}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 18, letterSpacing: '.18em', color: 'var(--foreground)', marginBottom: 4 }}>
            CYCLE · MOON PHASES
          </div>
          <AboutSystemButton systemName="Cycle" />
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
          Your menstrual cycle mapped to lunar rhythms. Ancient wisdom meets modern tracking.
        </div>
      </div>

      {/* Gender Selection */}
      <div>
        <div style={S.sectionTitle}>PROFILE</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['female', 'male'].map(g => (
            <div
              key={g}
              onClick={() => handleGenderChange(g)}
              style={{
                padding: '8px 18px', borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
                fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase',
                background: gender === g ? (g === 'female' ? 'rgba(196,77,122,.15)' : 'rgba(201,168,76,.1)') : 'var(--secondary)',
                border: `1px solid ${gender === g ? (g === 'female' ? 'rgba(196,77,122,.4)' : 'rgba(201,168,76,.3)') : 'var(--border)'}`,
                color: gender === g ? (g === 'female' ? '#c44d7a' : '#c9a84c') : 'var(--muted-foreground)',
              }}
            >{g}</div>
          ))}
        </div>
      </div>

      {/* Cycle Input — shown for female or if data already exists */}
      {(isFemale || lastPeriod) && (
        <div>
          <div style={S.sectionTitle}>CYCLE DATA</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 5 }}>Last period start</div>
              <input
                type="date"
                value={lastPeriod}
                onChange={e => handleLastPeriodChange(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 7, background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 12, fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 5 }}>Cycle length (days)</div>
              <input
                type="number"
                min={21}
                max={40}
                value={cycleLen}
                onChange={e => handleCycleLenChange(e.target.value)}
                style={{ width: 70, padding: '8px 12px', borderRadius: 7, background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 12, fontFamily: 'inherit' }}
              />
            </div>
            {saved && (
              <div style={{ fontSize: 10, color: '#60b030', fontFamily: "'Cinzel',serif", letterSpacing: '.1em', padding: '8px 0' }}>
                ✓ SAVED
              </div>
            )}
          </div>

          {/* Fertility Tracking */}
          {isFemale && cycle && (
            <div style={{ marginTop: 16 }}>
              <div style={S.sectionTitle}>FERTILITY WINDOW</div>
              <div style={{
                padding: 16, borderRadius: 10,
                background: cycle.isFertile ? 'rgba(96,200,80,.06)' : 'rgba(201,168,76,.04)',
                border: `1px solid ${cycle.isFertile ? 'rgba(96,200,80,.2)' : 'rgba(201,168,76,.12)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 24 }}>{cycle.isFertile ? '🌸' : cycle.currentPhase?.name === 'Follicular' ? '🌱' : cycle.currentPhase?.name === 'Luteal' ? '🌙' : '🩸'}</div>
                  <div>
                    <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, color: cycle.isFertile ? '#60c850' : '#c9a84c', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                      {cycle.isFertile ? 'Fertile Window — Active' : `${cycle.currentPhase?.name || 'Cycle'} Phase`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
                      Day {cycle.cycleDay} of {cycleLen} · Ovulation day ~{cycle.ovulationDay}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
                  {cycle.isFertile
                    ? 'Peak fertility — ovulation window is open. Egg is released and available for fertilization.'
                    : cycle.daysToOvulation > 0
                    ? `Fertility increasing toward ovulation. Fertile window opens around day ${cycle.fertileWindow.start}.`
                    : 'Post-ovulation — fertility window has passed for this cycle. Progesterone dominant.'}
                </div>
                {/* Fertility bar */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--muted-foreground)', fontFamily: "'Cinzel',serif", letterSpacing: '.1em', marginBottom: 4 }}>
                    <span>Day 1</span>
                    <span>Fertile</span>
                    <span>Day {cycleLen}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--secondary)', position: 'relative', overflow: 'hidden' }}>
                    {/* Fertile window zone */}
                    <div style={{
                      position: 'absolute', height: '100%', borderRadius: 3,
                      left: `${(cycle.fertileWindow.start / cycleLen) * 100}%`,
                      width: `${((cycle.fertileWindow.end - cycle.fertileWindow.start) / cycleLen) * 100}%`,
                      background: 'rgba(96,200,80,.25)',
                    }} />
                    {/* Current day marker */}
                    <div style={{
                      position: 'absolute', height: '100%', width: 3, borderRadius: 2,
                      left: `${(cycle.cycleDay / cycleLen) * 100}%`,
                      background: cycle.isFertile ? '#60c850' : '#c9a84c',
                      boxShadow: `0 0 4px ${cycle.isFertile ? 'rgba(96,200,80,.6)' : 'rgba(201,168,76,.4)'}`,
                    }} />
                  </div>
                </div>
                {!cycle.isFertile && cycle.daysToOvulation > 0 && (
                  <div style={{
                    marginTop: 8, padding: '6px 12px', borderRadius: 6,
                    background: 'rgba(201,168,76,.06)', display: 'inline-block',
                    fontFamily: "'Inconsolata', monospace", fontSize: 11, color: 'var(--muted-foreground)',
                  }}>
                    ~{cycle.daysToOvulation} days until ovulation
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Non-female: just show moon data */}
      {!isFemale && !lastPeriod && (
        <div>
          <div style={S.sectionTitle}>CURRENT MOON</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 16, borderRadius: 10, background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.15)', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 4 }}>{moon.phaseEmoji}</div>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, color: '#c9a84c', marginBottom: 4 }}>{moon.phaseName}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>{moon.illumination}% illuminated</div>
            </div>
            <div style={{ padding: 16, borderRadius: 10, background: 'rgba(130,90,220,.06)', border: '1px solid rgba(130,90,220,.15)' }}>
              <div style={{ fontSize: 11, color: 'rgba(160,130,220,.7)', fontFamily: "'Cinzel',serif", letterSpacing: '.1em', marginBottom: 8 }}>MOON ENERGY</div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted-foreground)' }}>{moon.phaseEnergy}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(196,77,122,.6)', fontStyle: 'italic', marginTop: 12, textAlign: 'center' }}>
            Select "female" above to unlock full cycle tracking
          </div>
        </div>
      )}

      {cycle && (
        <>
          {/* Current State */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 16, borderRadius: 10, background: cycle.currentPhase.color + '15', border: `1px solid ${cycle.currentPhase.color}33` }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{cycle.currentPhase.emoji}</div>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, color: cycle.currentPhase.color, marginBottom: 4 }}>{cycle.currentPhase.name} Phase</div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>Day {cycle.cycleDay} of {cycle.cycleLength}</div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4, fontStyle: 'italic' }}>{cycle.currentPhase.archetype}</div>
            </div>
            <div style={{ padding: 16, borderRadius: 10, background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.15)' }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{cycle.moonPhase.phaseEmoji}</div>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, color: '#c9a84c', marginBottom: 4 }}>{cycle.moonPhase.phaseName}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>{cycle.moonPhase.illumination}% illuminated</div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4, fontStyle: 'italic' }}>{cycle.moonPhase.phaseEnergy}</div>
            </div>
          </div>

          {/* Moon-Cycle Alignment */}
          <div>
            <div style={S.sectionTitle}>MOON-CYCLE ALIGNMENT</div>
            <div style={{ padding: 16, borderRadius: 10, background: 'rgba(201,168,76,.04)', border: '1px solid rgba(201,168,76,.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 24, color: '#c9a84c' }}>{cycle.moonCycleAlignment.score}%</div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, color: cycle.moonCycleAlignment.score > 80 ? '#60b030' : cycle.moonCycleAlignment.score > 50 ? '#e09040' : '#c44d7a' }}>
                  {cycle.moonCycleAlignment.label}
                </div>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted-foreground)' }}>
                {cycle.moonCycleAlignment.description}
              </div>
            </div>
          </div>

          {/* Cycle Visualization */}
          <div>
            <div style={S.sectionTitle}>CYCLE WHEEL</div>
            <div style={{ height: 280, borderRadius: 10, background: 'rgba(0,0,0,.2)', border: '1px solid var(--border)' }}>
              <CycleWheel cycleDay={cycle.cycleDay} cycleLength={cycle.cycleLength} />
            </div>
          </div>

          {/* Current Phase Energy */}
          <div>
            <div style={S.sectionTitle}>PHASE ENERGY</div>
            <div style={{ padding: 16, borderRadius: 10, background: cycle.currentPhase.color + '08', border: `1px solid ${cycle.currentPhase.color}20` }}>
              <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--muted-foreground)' }}>
                {cycle.currentPhase.energy}
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 10, background: cycle.currentPhase.color + '20', color: cycle.currentPhase.color, border: `1px solid ${cycle.currentPhase.color}40` }}>
                  {cycle.currentPhase.element} Element
                </span>
                <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 10, background: 'rgba(201,168,76,.08)', color: '#c9a84c', border: '1px solid rgba(201,168,76,.2)' }}>
                  {cycle.currentPhase.moonCorrelation}
                </span>
              </div>
            </div>
          </div>

          {/* Fertility Window */}
          <div>
            <div style={S.sectionTitle}>FERTILITY WINDOW</div>
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--secondary)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 12, color: cycle.isFertile ? '#60b030' : 'var(--foreground)' }}>
                    {cycle.isFertile ? '● Fertile Window Active' : '○ Outside Fertile Window'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>
                    Days {cycle.fertileWindow.start}–{cycle.fertileWindow.end} · Ovulation ~Day {cycle.ovulationDay}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                    {cycle.daysToOvulation > 0 ? `${cycle.daysToOvulation} days to ovulation` : cycle.daysToOvulation === 0 ? 'Ovulation day' : `${Math.abs(cycle.daysToOvulation)} days past ovulation`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 7-Day Forecast */}
          <div>
            <div style={S.sectionTitle}>7-DAY FORECAST</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {cycle.weekForecast.map((day, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 8, background: i === 0 ? 'rgba(201,168,76,.1)' : 'var(--secondary)', border: `1px solid ${i === 0 ? 'rgba(201,168,76,.3)' : 'var(--border)'}` }}>
                  <div style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>{day.date.toLocaleDateString('en', { weekday: 'short' })}</div>
                  <div style={{ fontSize: 14, margin: '4px 0' }}>{day.moon.phaseEmoji}</div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: day.phase.color, margin: '0 auto 2px' }} />
                  <div style={{ fontSize: 8, color: 'var(--muted-foreground)' }}>D{day.day}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Period */}
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(196,77,122,.06)', border: '1px solid rgba(196,77,122,.12)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#c44d7a' }}>
              Next period in ~{cycle.daysToNextPeriod} days · {cycle.nextPeriodDate.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Phase Guide */}
          <div>
            <div style={S.sectionTitle}>ALL PHASES</div>
            {cycle.phases.map((phase, i) => (
              <div key={i} style={{
                padding: '12px 14px', marginBottom: 6, borderRadius: 8,
                background: cycle.currentPhase.name === phase.name ? phase.color + '12' : 'var(--secondary)',
                border: `1px solid ${cycle.currentPhase.name === phase.name ? phase.color + '40' : 'var(--border)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{phase.emoji}</span>
                  <div>
                    <div style={{ fontSize: 12, color: phase.color, fontFamily: "'Cinzel',serif" }}>{phase.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>Days {phase.days[0]}–{phase.days[1]} · {phase.moonCorrelation} · {phase.archetype}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
