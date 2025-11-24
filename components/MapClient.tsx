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
}

function MapLayers({
  markers,
  onMarkerReady,
}: {
  markers: Facility[]
  onMarkerReady?: (facilityId: number, marker: L.Marker) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

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
          <span class="marker-dot" style="background:${color}"></span>
          <span class="marker-badge">${badge}</span>
        </div>
      `

      const icon = L.divIcon({
        html,
        className: 'custom-marker-wrapper',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        interactive: true, // ← 追加: divIcon 自体をインタラクティブに
      })
      const marker = L.marker([lat, lng], { icon })
      const popup = `<strong>${f.name}</strong><div style="font-size:12px;margin-top:6px;">${f.description || ''}</div>`
      marker.bindPopup(popup)

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

export default function MapClient({ markers, onMarkerReady }: MapClientProps) {
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
        <MapLayers markers={markers} onMarkerReady={onMarkerReady} />
      </MapContainer>
    </div>
  )
}

