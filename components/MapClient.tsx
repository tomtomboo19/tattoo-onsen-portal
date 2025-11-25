import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'

// Fix default icon path issues in various bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

type Facility = {
  id: number
  name: string
  latitude?: number | null
  longitude?: number | null
  description?: string | null
  isTattooOk?: boolean | null
  tags?: string | null
}

// 施設ID→マーカーを外に渡すための型
type MapClientProps = {
  markers: Facility[]
  onMarkerReady?: (facilityId: number, marker: L.Marker) => void
  onMapReady?: (map: L.Map) => void
}

function MapLayers({
  markers,
  onMarkerReady,
  onMapReady,
}: {
  markers: Facility[]
  onMarkerReady?: (facilityId: number, marker: L.Marker) => void
  onMapReady?: (map: L.Map) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    // inform parent about the map instance (so callers can pan/fit without touching protected members)
    try {
      onMapReady?.(map)
    } catch (e) {
      // ignore
    }

    // cleanup previous cluster if present
    try {
      const prev = (map as any)._customCluster
      if (prev) {
        map.removeLayer(prev)
        ;(map as any)._customCluster = null
      }
    } catch (e) {
      // ignore
    }

    const latlngs: [number, number][] = []
    let clusterGroup: any = null

    const addMarker = (f: Facility, target: any) => {
      if (f.latitude == null || f.longitude == null) return
      const lat = f.latitude as number
      const lng = f.longitude as number
      latlngs.push([lat, lng])

      // color by tattoo availability
      const color = f.isTattooOk ? '#2ecc71' : '#e74c3c'

      // DivIcon with a colored dot and optional badge text
      const badge = f.isTattooOk ? 'タトゥー可' : 'タトゥー不可'
      const html = `
        <div class="custom-marker ${f.isTattooOk ? 'tattoo-ok' : 'tattoo-no'}">
          <span class="marker-hit"></span>
          <span class="marker-dot" style="background:${color}"></span>
          <span class="marker-badge">${badge}</span>
        </div>
      `

      const icon = L.divIcon({
        html,
        className: 'custom-marker-wrapper',
        iconSize: [36, 36],
        // anchor the icon at its center so the visible circular area is centered on the lat/lng
        iconAnchor: [18, 18],
        // interactive is not part of the DivIconOptions TS type in some @types/leaflet versions
        // cast to any to avoid type errors while keeping the runtime behavior
      } as any)
      // Ensure the marker and its divIcon are interactive so DOM events are captured for the
      // whole icon (not just the tip). riseOnHover helps with visual feedback and zIndexOffset
      // makes hovered markers appear above others.
      const marker = L.marker([lat, lng], { icon, interactive: true, riseOnHover: true, zIndexOffset: 1000 })
      // Build a richer popup matching the facility quick view
      const safeDesc = (f.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const popup = `
        <div class="map-popup-card">
          <div class="map-popup-body">
            <div class="map-popup-title">${f.name}</div>
            <div class="map-popup-location">${f.latitude && f.longitude ? '' : ''}</div>
            <div class="map-popup-desc">${safeDesc}</div>
          </div>
          <div class="map-popup-badge ${f.isTattooOk ? 'map-badge-ok' : 'map-badge-ng'}">${f.isTattooOk ? 'タトゥー可' : '要確認'}</div>
        </div>
      `
      marker.bindPopup(popup, { maxWidth: 360, className: 'map-popup-wrapper' })

      // カード側からもクリックできるように、マーカーを外へ通知
      if (onMarkerReady) {
        onMarkerReady(f.id, marker)
      }

      // PC: ホバーで開閉
      marker.on('mouseover', () => marker.openPopup())
      marker.on('mouseout', () => marker.closePopup())

      // クリックでも確実に開く（モバイル対応）
      marker.on('click', () => {
        marker.openPopup()
      })

      if (target && typeof target.addLayer === 'function') target.addLayer(marker)
      else marker.addTo(target)
    }

    // Try loading markercluster; fall back to simple markers
    import('leaflet.markercluster')
      .then(() => {
        const iconCreate = (cluster: any) => {
          const count = cluster.getChildCount()
          const size = count < 10 ? 'small' : count < 50 ? 'medium' : 'large'
          const html = `<div class="custom-cluster custom-cluster-${size}"><span>${count}</span></div>`
          return L.divIcon({ html, className: 'custom-cluster-wrapper', iconSize: [40, 40] })
        }

        clusterGroup = (L as any).markerClusterGroup ? (L as any).markerClusterGroup({ iconCreateFunction: iconCreate }) : null
        ;(map as any)._customCluster = clusterGroup

        if (clusterGroup) {
          markers.forEach(m => addMarker(m, clusterGroup))
          map.addLayer(clusterGroup)
        }

        if (latlngs.length) {
          try { map.fitBounds(L.latLngBounds(latlngs as any), { padding: [40, 40] }) } catch (_) {}
        }
      })
      .catch(() => {
        // fallback: add plain markers
        markers.forEach(m => addMarker(m, map))
        if (latlngs.length) { try { map.fitBounds(L.latLngBounds(latlngs as any), { padding: [40, 40] }) } catch (_) {} }
      })

    return () => {
      try {
        if (clusterGroup) {
          clusterGroup.clearLayers()
          map.removeLayer(clusterGroup)
        }
      } catch (_) {}
    }
  }, [map, markers, onMarkerReady])

  return null
}

export default function MapClient({ markers, onMarkerReady, onMapReady }: MapClientProps) {
  const center: [number, number] = markers && markers.length && markers[0].latitude && markers[0].longitude
    ? [markers[0].latitude as number, markers[0].longitude as number]
    : [35.6762, 139.6503]

  return (
    <div style={{ height: 360, borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={13}             // 少し寄り気味にして Google Maps の初期感に近づける
        minZoom={5}
        maxZoom={19}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Google マップ風タイル: 実運用では MapTiler / Stadia などに差し替えてください */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapLayers markers={markers} onMarkerReady={onMarkerReady} onMapReady={onMapReady} />
      </MapContainer>
    </div>
  )
}

