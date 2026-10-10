import { zones } from "../data/constants.js";

export const intensityTone = (n) => (n <= 3 ? "mild" : n <= 6 ? "mod" : "sev");
const COLOR = { mild: "var(--ok)", mod: "var(--amber)", sev: "var(--red)" };

/** Front-view body. Tap a zone to select it; dots show recently logged symptoms. */
export default function BodyMap({ selected, onSelect, logs = [] }) {
  const recent = logs.filter((l) => Date.now() - new Date(l.at).getTime() < 14 * 864e5);
  return (
    <svg className="body" viewBox="0 0 240 520" role="group" aria-label="Body map. Select a body part.">
      {zones.map((z) => (
        <g
          key={z.id}
          className={`zone ${selected === z.id ? "on" : ""}`}
          role="button"
          tabIndex={0}
          aria-label={z.label}
          aria-pressed={selected === z.id}
          onClick={() => onSelect(z.id)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(z.id); } }}
        >
          <title>{z.label}</title>
          {z.shapes.map(([tag, props], i) => (tag === "ellipse" ? <ellipse key={i} {...props} /> : <rect key={i} {...props} />))}
        </g>
      ))}
      {recent.map((l, i) => {
        const z = zones.find((x) => x.id === l.part);
        if (!z) return null;
        const offset = recent.filter((x, j) => j < i && x.part === l.part).length * 9;
        return (
          <circle key={l.id} className="mark" cx={z.cx + offset} cy={z.cy} r={5 + l.intensity * 0.8} fill={COLOR[intensityTone(l.intensity)]}>
            <title>{`${l.type}, ${l.intensity}/10`}</title>
          </circle>
        );
      })}
    </svg>
  );
}
