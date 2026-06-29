import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { DEMO_PIPELINE_SEGMENTS } from '@/data/demoData';
import { C } from '@/lib/chart';

const SEG_COLORS: Record<string, string> = { normal: C.green, warning: C.yellow, alert: C.red };

// Mapa de integridad del ducto (MapLibre) con tramos por color, estaciones y
// el marcador de toma clandestina (huachicol). Reutilizado por el módulo
// Midstream y por el widget de la Sala de Monitoreo.
export default function PipelineMap({ interactive = true }: { interactive?: boolean }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: {
                version: 8,
                sources: {
                    carto: {
                        type: 'raster',
                        tiles: [
                            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                        ],
                        tileSize: 256,
                        attribution: '© OpenStreetMap © CARTO',
                    },
                },
                layers: [
                    { id: 'bg', type: 'background', paint: { 'background-color': '#0B0F19' } },
                    { id: 'carto', type: 'raster', source: 'carto', paint: { 'raster-opacity': 1, 'raster-saturation': 0.15, 'raster-contrast': 0.15, 'raster-brightness-min': 0.1 } },
                ],
            } as maplibregl.StyleSpecification,
            center: [-92.0, 18.38],
            zoom: 8.2,
            interactive,
            attributionControl: false,
        });
        mapRef.current = map;
        map.addControl(new maplibregl.AttributionControl({ compact: true }));
        if (interactive) map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

        const ro = new ResizeObserver(() => map.resize());
        ro.observe(containerRef.current);

        map.on('load', () => {
            const fullCoords = DEMO_PIPELINE_SEGMENTS.flatMap(s => s.coords);
            map.addSource('pipeline-bg', {
                type: 'geojson',
                data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: fullCoords } },
            });
            map.addLayer({ id: 'pipeline-bg-line', type: 'line', source: 'pipeline-bg', paint: { 'line-color': '#374151', 'line-width': 8, 'line-opacity': 0.6 } });

            DEMO_PIPELINE_SEGMENTS.forEach((seg) => {
                const color = SEG_COLORS[seg.status];
                const sid = seg.id;
                map.addSource(sid, {
                    type: 'geojson',
                    data: { type: 'Feature', properties: { status: seg.status }, geometry: { type: 'LineString', coordinates: seg.coords } },
                });
                map.addLayer({
                    id: `${sid}-line`, type: 'line', source: sid,
                    paint: { 'line-color': color, 'line-width': seg.status === 'alert' ? 5 : 3, 'line-opacity': seg.status === 'alert' ? 1 : 0.85 },
                });
            });

            const stations = [
                { coords: [-92.60, 18.00], name: 'Est. Macuspana', km: 'KP-0', type: 'inlet' },
                { coords: [-91.92, 18.38], name: 'Est. Chiltepec', km: 'KP-42', type: 'alert' },
                { coords: [-91.65, 18.50], name: 'Est. Mactún', km: 'KP-57', type: 'alert' },
                { coords: [-91.82, 18.65], name: 'Est. Isla del Carmen', km: 'KP-82', type: 'outlet' },
            ];
            stations.forEach((s) => {
                const el = document.createElement('div');
                el.style.cssText = 'position:relative;cursor:pointer;';
                const dot = document.createElement('span');
                const color = s.type === 'alert' ? C.red : s.type === 'inlet' ? C.blue : C.green;
                dot.style.cssText = `display:block;width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 12px ${color};`;
                el.appendChild(dot);
                new maplibregl.Marker({ element: el, anchor: 'center' })
                    .setLngLat(s.coords as [number, number])
                    .setPopup(new maplibregl.Popup({ closeButton: false, offset: 12 }).setHTML(
                        `<div style="font-family:Inter,sans-serif;font-size:11px;color:#F9FAFB">
                            <div style="font-weight:700;color:${color}">${s.name}</div>
                            <div style="color:#9CA3AF;margin-top:2px">${s.km}</div>
                        </div>`
                    ))
                    .addTo(map);
            });

            const alertSeg = DEMO_PIPELINE_SEGMENTS.find(s => s.status === 'alert');
            if (alertSeg) {
                const midLng = (alertSeg.coords[0][0] + alertSeg.coords[1][0]) / 2;
                const midLat = (alertSeg.coords[0][1] + alertSeg.coords[1][1]) / 2;
                const el = document.createElement('div');
                el.innerHTML = `<div class="pulse-alert" style="background:rgba(239,68,68,0.15);border:1.5px solid #EF4444;border-radius:8px;padding:4px 8px;font-size:10px;font-weight:700;color:#EF4444;font-family:Inter,sans-serif;white-space:nowrap;">⚠️ ALERTA HUACHICOL</div>`;
                new maplibregl.Marker({ element: el, anchor: 'center' })
                    .setLngLat([midLng, midLat + 0.03])
                    .addTo(map);
            }
        });

        return () => {
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
            ro.disconnect();
        };
    }, [interactive]);

    return <div ref={containerRef} className="h-full w-full rounded-lg overflow-hidden" />;
}
