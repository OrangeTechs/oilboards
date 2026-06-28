import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { DEMO_WELLS, DEMO_ASSET, STATUS_META, DemoWell } from '@/data/demoData';

interface Props {
    height?: number | string;
    interactive?: boolean;
    onSelectWell?: (well: DemoWell) => void;
    className?: string;
}

// Estilo oscuro usando teselas CARTO dark (sin token)
const DARK_STYLE: maplibregl.StyleSpecification = {
    version: 8,
    sources: {
        carto: {
            type: 'raster',
            tiles: [
                'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap © CARTO',
        },
    },
    layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#0B0F19' } },
        {
            id: 'carto', type: 'raster', source: 'carto',
            paint: {
                'raster-opacity': 1,
                'raster-saturation': 0.25,
                'raster-contrast': 0.2,
                'raster-brightness-min': 0.15,
            },
        },
    ],
};

export default function FieldMap({ height = 420, interactive = true, onSelectWell, className = '' }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: DARK_STYLE,
            center: [DEMO_ASSET.longitude, DEMO_ASSET.latitude - 0.15],
            zoom: 7.7,
            interactive,
            attributionControl: false,
        });
        mapRef.current = map;

        map.addControl(new maplibregl.AttributionControl({ compact: true }));
        if (interactive) {
            map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
        }

        // Redimensionar el mapa cuando cambia el contenedor (bloques ajustables)
        const ro = new ResizeObserver(() => map.resize());
        ro.observe(containerRef.current);

        map.on('load', () => {
            // Pines de pozos como marcadores HTML (pulsantes por status)
            DEMO_WELLS.forEach((well) => {
                const meta = STATUS_META[well.status];
                const el = document.createElement('div');
                el.style.cssText = 'position:relative;width:22px;height:22px;cursor:pointer;';

                const ring = document.createElement('span');
                ring.className = 'map-pin-ring';
                ring.style.cssText = `position:absolute;inset:0;border-radius:9999px;background:${meta.color};opacity:.7;`;
                if (well.status === 'alert' || well.status === 'down') el.appendChild(ring);

                const dot = document.createElement('span');
                dot.style.cssText = `position:absolute;inset:5px;border-radius:9999px;background:${meta.color};box-shadow:0 0 16px ${meta.color},0 0 6px ${meta.color};border:2px solid rgba(255,255,255,.85);`;
                el.appendChild(dot);

                const popup = new maplibregl.Popup({ offset: 16, closeButton: false }).setHTML(`
                    <div style="font-family:Inter,sans-serif;min-width:150px">
                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                            <span style="width:8px;height:8px;border-radius:9999px;background:${meta.color};display:inline-block"></span>
                            <strong style="font-size:13px">${well.name}</strong>
                        </div>
                        <div style="font-size:10px;color:#9CA3AF;margin-bottom:6px">${well.liftType} · ${meta.label}</div>
                        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#F9FAFB">
                            ${well.netOilBbl > 0 ? `${well.netOilBbl} bbl/d` : 'Sin producción'}<br/>
                            ${well.thpPsi > 0 ? `THP: ${well.thpPsi} psi` : 'THP: —'}
                        </div>
                    </div>
                `);

                const marker = new maplibregl.Marker({ element: el })
                    .setLngLat([well.longitude, well.latitude])
                    .setPopup(popup)
                    .addTo(map);

                el.addEventListener('mouseenter', () => popup.addTo(map) && marker.togglePopup());
                el.addEventListener('click', () => onSelectWell?.(well));
            });
        });

        return () => {
            ro.disconnect();
            map.remove();
            mapRef.current = null;
        };
    }, [interactive, onSelectWell]);

    return (
        <div className={`relative overflow-hidden ${className}`} style={{ height }}>
            <div ref={containerRef} className="absolute inset-0" />
            {/* viñeta sutil para fundir con el fondo (sin tapar el mapa) */}
            <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 80px 10px rgba(11,15,25,0.35)' }} />
        </div>
    );
}
