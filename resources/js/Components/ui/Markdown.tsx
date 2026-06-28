import { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Render ligero de Markdown (sin dependencias) para las respuestas del asistente.
// Cubre el subconjunto que produce Claude: títulos (#), negritas (**), viñetas
// (- · *), citas (>), divisores (---) y párrafos.
// ---------------------------------------------------------------------------
function renderInline(text: string, k: string): ReactNode[] {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        /^\*\*[^*]+\*\*$/.test(part)
            ? <strong key={`${k}-${i}`} className="font-semibold text-white">{part.slice(2, -2)}</strong>
            : <span key={`${k}-${i}`}>{part}</span>
    );
}

export default function Markdown({ text }: { text: string }) {
    const blocks: ReactNode[] = [];
    let bullets: string[] = [];

    const flush = (key: string) => {
        if (!bullets.length) return;
        blocks.push(
            <ul key={key} className="list-disc pl-4 space-y-0.5 my-1.5">
                {bullets.map((b, i) => <li key={i}>{renderInline(b, `${key}-${i}`)}</li>)}
            </ul>
        );
        bullets = [];
    };

    text.split('\n').forEach((raw, idx) => {
        const line = raw.trimEnd();
        const k = `b-${idx}`;

        if (/^\s*[-*•]\s+/.test(line)) { bullets.push(line.replace(/^\s*[-*•]\s+/, '')); return; }
        flush(`ul-${idx}`);

        if (line.trim() === '') return;
        if (/^\s*[-_]{3,}\s*$/.test(line)) { blocks.push(<hr key={k} className="border-[#1F2937] my-2" />); return; }

        const h = line.match(/^(#{1,6})\s+(.*)$/);
        if (h) {
            blocks.push(<div key={k} className={`font-bold text-white mt-1.5 ${h[1].length <= 2 ? 'text-sm' : 'text-[13px]'}`}>{renderInline(h[2], k)}</div>);
            return;
        }
        if (/^>\s?/.test(line)) {
            blocks.push(<div key={k} className="border-l-2 border-[#F59E0B]/60 pl-2.5 py-0.5 my-1.5 text-[#FBBF24]">{renderInline(line.replace(/^>\s?/, ''), k)}</div>);
            return;
        }
        blocks.push(<p key={k} className="my-1">{renderInline(line, k)}</p>);
    });
    flush('ul-end');

    return <div className="space-y-0.5">{blocks}</div>;
}
