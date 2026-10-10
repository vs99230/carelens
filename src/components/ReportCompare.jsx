import { ArrowDownRight, ArrowUpRight, Minus, TrendingUp } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { fmtDate, statusOf, trendOf } from "../data/helpers.js";
import { Badge, Empty, Ruler } from "./ui.jsx";

const TREND = {
  improved: { tone: "ok", label: "Improved" },
  worse: { tone: "bad", label: "Moved away from range" },
  stable: { tone: "neutral", label: "Little change" },
  steady: { tone: "ok", label: "Steady, in range" },
  new: { tone: "neutral", label: "First reading" },
};

export default function ReportCompare() {
  const { state } = useApp();
  const meta = state.labMeta;
  const rows = state.labs.filter((l) => l.prev != null).map((l) => ({ ...l, trend: trendOf(l), delta: +(l.curr - l.prev).toFixed(2) }));
  if (!rows.length) {
    return <Empty icon={TrendingUp} title="Nothing to compare yet">Upload a second, newer report (or both reports together) and CareLens shows what changed between them.</Empty>;
  }
  const count = (t) => rows.filter((r) => r.trend === t).length;
  const attention = rows.filter((r) => statusOf(r.curr, r.refLow, r.refHigh) !== "normal");

  return (
    <div className="stack">
      <section className="card changed-hero">
        <TrendingUp size={22} aria-hidden="true" />
        <div>
          <h2>{count("improved")} of {rows.length} values moved in a better direction</h2>
          <p>
            Compared with {meta.prevDate ? `your ${fmtDate(meta.prevDate)} report` : "your previous report"}. {count("worse") ? `${count("worse")} moved away from range.` : "None moved away from range."}{" "}
            {attention.length} {attention.length === 1 ? "value is" : "values are"} still outside range, so keep them on your list for the doctor.
          </p>
        </div>
      </section>

      <section className="card flush">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Test</th>
                <th>{meta.prevDate ? fmtDate(meta.prevDate, { day: "numeric", month: "short" }) : "Before"}</th>
                <th>{meta.date ? fmtDate(meta.date, { day: "numeric", month: "short" }) : "Latest"}</th>
                <th>Change</th>
                <th className="hide-sm">Position on range</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const t = TREND[r.trend];
                const Arrow = r.delta === 0 ? Minus : r.delta > 0 ? ArrowUpRight : ArrowDownRight;
                return (
                  <tr key={r.id}>
                    <td><b>{r.name}</b><small>{r.unit}</small></td>
                    <td className="num muted">{r.prev}</td>
                    <td className="num"><b>{r.curr}</b></td>
                    <td>
                      <span className={`delta ${t.tone}`}><Arrow size={14} aria-hidden="true" />{r.delta > 0 ? "+" : ""}{r.delta}</span>
                      <Badge tone={t.tone}>{t.label}</Badge>
                    </td>
                    <td className="hide-sm wide">
                      <Ruler value={r.curr} prev={r.prev} min={r.min} max={r.max} low={r.refLow} high={r.refHigh} unit={r.unit} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="legend"><span className="lg dot" /> latest <span className="lg ghost" /> previous <span className="lg band" /> reference range</p>
      </section>
    </div>
  );
}
