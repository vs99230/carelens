import { statusOf } from "../data/helpers.js";

export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}

export const Badge = ({ tone = "neutral", children }) => <span className={`badge ${tone}`}>{children}</span>;

export const STATUS_TONE = { normal: "ok", low: "warn", high: "warn" };
export const STATUS_LABEL = { normal: "In range", low: "Below range", high: "Above range" };

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="empty">
      {Icon && <Icon size={26} strokeWidth={1.6} aria-hidden="true" />}
      <b>{title}</b>
      {children && <p>{children}</p>}
    </div>
  );
}

/** The lab "ruler": reference band with a marker for the value (and optional ghost marker for the previous value). */
export function Ruler({ value, prev, min, max, low, high, unit }) {
  const pct = (v) => Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
  const l = low == null ? 0 : pct(low);
  const h = high == null ? 100 : pct(high);
  const tone = statusOf(value, low, high) === "normal" ? "ok" : "warn";
  const ticks = [min, low, high, max].filter((t) => t != null);
  return (
    <div className="ruler" role="img" aria-label={`${value} ${unit}. Reference ${low ?? "up to"} ${low != null && high != null ? "to" : ""} ${high ?? ""}`}>
      <div className="ruler-track">
        <div className="ruler-band" style={{ left: `${l}%`, width: `${h - l}%` }} />
        {prev != null && <span className="ruler-ghost" style={{ left: `${pct(prev)}%` }} title={`Previous: ${prev}`} />}
        <span className={`ruler-dot ${tone}`} style={{ left: `${pct(value)}%` }} />
      </div>
      <div className="ruler-ticks" aria-hidden="true">
        {[...new Set(ticks)].map((t) => (
          <span key={t} style={{ left: `${pct(t)}%` }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

export function Ring({ value, size = 92, stroke = 9, children, tone = "var(--teal)" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ring-track)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      <div className="ring-in">{children}</div>
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`switch ${checked ? "on" : ""}`} onClick={onChange}>
      <span />
    </button>
  );
}
