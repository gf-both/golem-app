import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * PlaceAutocomplete — birth city input with city search + coordinates.
 *
 * Two backends, auto-selected:
 *  1. Google Places API (New) — used when a key is configured
 *     (VITE_GOOGLE_MAPS_KEY or VITE_GOOGLE_PLACES_API_KEY). Returns precise
 *     lat/lon and a real UTC offset.
 *  2. OpenStreetMap Nominatim — keyless fallback so the selector always works.
 *     Returns lat/lon; timezone is approximated from longitude and can be
 *     fine-tuned by the user.
 *
 * Props:
 *  - value: string (current city name)
 *  - onChange: ({ city, lat, lon, timezone }) => void
 *  - placeholder, className, style
 */
export default function PlaceAutocomplete({ value, onChange, placeholder = 'City, Country', className, style }) {
  const [inputValue, setInputValue] = useState(value || '')
  const [suggestions, setSuggestions] = useState([]) // normalized: {main, secondary, lat, lon, placeId, source}
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)
  const reqIdRef = useRef(0)
  const sessionToken = useRef(crypto.randomUUID())

  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || import.meta.env.VITE_GOOGLE_PLACES_API_KEY
  const hasApiKey = !!API_KEY

  useEffect(() => { setInputValue(value || '') }, [value])

  // Rough timezone (hours) from longitude — used as a sensible default when
  // no precise offset is available. The user can adjust the birth time/zone.
  const tzFromLon = (lon) => Math.max(-12, Math.min(14, Math.round((Number(lon) || 0) / 15)))

  const fetchGoogle = useCallback(async (input) => {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': API_KEY },
      body: JSON.stringify({
        input,
        includedPrimaryTypes: ['locality', 'administrative_area_level_1'],
        sessionToken: sessionToken.current,
      }),
    })
    const data = await res.json()
    return (data.suggestions || []).map((s) => {
      const pred = s.placePrediction
      return {
        main: pred?.structuredFormat?.mainText?.text || pred?.text?.text || '',
        secondary: pred?.structuredFormat?.secondaryText?.text || '',
        placeId: pred?.placeId || null,
        lat: 0, lon: 0,
        source: 'google',
      }
    })
  }, [API_KEY])

  const fetchOSM = useCallback(async (input) => {
    // format=json (v1) exposes `class`; jsonv2 renames it to `category`.
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&accept-language=en&q=${encodeURIComponent(input)}`
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
    const data = await res.json()
    const rows = Array.isArray(data) ? data : []
    const toItem = (r) => {
      const a = r.address || {}
      const main = a.city || a.town || a.village || a.municipality || a.county || a.state || (r.display_name || '').split(', ')[0]
      const parts = (r.display_name || '').split(', ')
      const secondary = parts.slice(1).filter((p) => p !== main).join(', ')
      return {
        main: main || r.display_name,
        secondary,
        placeId: null,
        lat: parseFloat(r.lat) || 0,
        lon: parseFloat(r.lon) || 0,
        source: 'osm',
      }
    }
    const cat = (r) => r.class || r.category || ''
    const placeLike = rows.filter((r) => cat(r) === 'place' || cat(r) === 'boundary')
    // Prefer settlement-type results; if the filter removes everything, show all.
    return (placeLike.length ? placeLike : rows).map(toItem)
  }, [])

  const fetchSuggestions = useCallback(async (input) => {
    if (!input || input.length < 2) { setSuggestions([]); return }
    const reqId = ++reqIdRef.current
    setLoading(true)
    try {
      const out = hasApiKey ? await fetchGoogle(input) : await fetchOSM(input)
      if (reqId === reqIdRef.current) setSuggestions(out)
    } catch {
      if (reqId === reqIdRef.current) setSuggestions([])
    } finally {
      if (reqId === reqIdRef.current) setLoading(false)
    }
  }, [hasApiKey, fetchGoogle, fetchOSM])

  function handleInput(e) {
    const v = e.target.value
    setInputValue(v)
    setShowDropdown(true)
    clearTimeout(debounceRef.current)
    // 450ms respects Nominatim's ~1 req/sec usage policy
    debounceRef.current = setTimeout(() => fetchSuggestions(v), hasApiKey ? 280 : 450)
  }

  async function selectPlace(item) {
    setInputValue(item.main)
    setShowDropdown(false)
    setSuggestions([])

    // Google: fetch details for precise coords + real UTC offset.
    if (item.source === 'google' && item.placeId) {
      try {
        const res = await fetch(
          `https://places.googleapis.com/v1/places/${item.placeId}?fields=displayName,location,utcOffsetMinutes`,
          { headers: { 'X-Goog-Api-Key': API_KEY, 'X-Goog-FieldMask': 'displayName,location,utcOffsetMinutes' } }
        )
        const place = await res.json()
        const lat = place.location?.latitude || 0
        const lon = place.location?.longitude || 0
        const timezone = place.utcOffsetMinutes != null ? place.utcOffsetMinutes / 60 : tzFromLon(lon)
        const city = place.displayName?.text || item.main
        sessionToken.current = crypto.randomUUID()
        onChange?.({ city, lat, lon, timezone })
        return
      } catch {
        onChange?.({ city: item.main, lat: 0, lon: 0, timezone: 0 })
        return
      }
    }

    // OSM (or google w/o placeId): use coords from the suggestion.
    const city = item.secondary ? `${item.main}, ${item.secondary}` : item.main
    onChange?.({ city, lat: item.lat, lon: item.lon, timezone: tzFromLon(item.lon) })
  }

  function handleBlur() {
    setTimeout(() => setShowDropdown(false), 180)
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        value={inputValue}
        onChange={handleInput}
        onFocus={() => inputValue.length > 1 && setShowDropdown(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        style={style}
        autoComplete="off"
        spellCheck={false}
      />

      {loading && (
        <span style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          fontSize: 10, opacity: 0.4, pointerEvents: 'none',
        }}>⏳</span>
      )}

      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
          background: 'var(--card, #1a1a2e)', border: '1px solid var(--border, rgba(255,255,255,0.1))',
          borderRadius: 8, marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={() => selectPlace(s)}
              style={{
                padding: '8px 12px', cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border, rgba(255,255,255,0.05))' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: 13, color: 'var(--foreground, #fff)' }}>{s.main}</span>
              {s.secondary && (
                <span style={{ fontSize: 11, color: 'var(--muted-foreground, #888)', marginLeft: 6 }}>
                  {s.secondary}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
