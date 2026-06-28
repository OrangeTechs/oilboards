import { Children, cloneElement, isValidElement, ReactElement, ReactNode, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Side = 'top' | 'bottom' | 'left' | 'right';

/**
 * Tooltip instantáneo (sin el retraso del `title` nativo). Clona su hijo y le
 * inyecta los handlers de hover — no agrega wrappers que rompan el layout. El
 * globo se renderiza por portal en <body> con position:fixed, así que nunca lo
 * recorta un contenedor con overflow/scroll (sidebar, paleta, etc.).
 */
export function Tooltip({ content, side = 'top', children }: { content: string; side?: Side; children: ReactNode }) {
    const child = Children.only(children) as ReactElement<any>;
    const ref = useRef<HTMLElement | null>(null);
    const [box, setBox] = useState<{ left: number; top: number; tf: string } | null>(null);

    const place = () => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const map: Record<Side, { left: number; top: number; tf: string }> = {
            right:  { left: r.right + 8,        top: r.top + r.height / 2, tf: 'translateY(-50%)' },
            left:   { left: r.left - 8,         top: r.top + r.height / 2, tf: 'translate(-100%,-50%)' },
            top:    { left: r.left + r.width / 2, top: r.top - 8,          tf: 'translate(-50%,-100%)' },
            bottom: { left: r.left + r.width / 2, top: r.bottom + 8,       tf: 'translate(-50%,0)' },
        };
        setBox(map[side]);
    };

    if (!content || !isValidElement(child)) return <>{children}</>;

    const cp = child.props as Record<string, any>;
    const cloned = cloneElement(child as ReactElement<any>, {
        ref,
        onMouseEnter: (e: any) => { place(); cp.onMouseEnter?.(e); },
        onMouseLeave: (e: any) => { setBox(null); cp.onMouseLeave?.(e); },
        onFocus: (e: any) => { place(); cp.onFocus?.(e); },
        onBlur: (e: any) => { setBox(null); cp.onBlur?.(e); },
    } as any);

    return (
        <>
            {cloned}
            {box && typeof document !== 'undefined' && createPortal(
                <div
                    role="tooltip"
                    style={{ position: 'fixed', left: box.left, top: box.top, transform: box.tf, zIndex: 90 }}
                    className="pointer-events-none max-w-[240px] rounded-md border border-[#374151]/70 bg-[#1F2937]/80 backdrop-blur-md px-2.5 py-1.5 text-[11px] leading-snug text-[#E5E7EB] shadow-xl"
                >
                    {content}
                </div>,
                document.body,
            )}
        </>
    );
}
