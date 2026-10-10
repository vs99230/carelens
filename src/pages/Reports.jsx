import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, FileText, MessageCircle, Plus, ScanLine, TriangleAlert } from "lucide-react";
import { PageHeader, Badge, Ruler, Empty, STATUS_LABEL } from "../components/ui.jsx";
import ReportUpload from "../components/ReportUpload.jsx";
import ReportCompare from "../components/ReportCompare.jsx";
import { useApp } from "../context/AppContext.jsx";
import { fmtDate, statusOf } from "../data/helpers.js";

function ValueCard({ lab, lang, onAsk }) {
  const st = statusOf(lab.curr, lab.refLow, lab.refHigh);
  const range = lab.refLow != null && lab.refHigh != null ? `${lab.refLow}–${lab.refHigh}` : lab.refHigh != null ? `up to ${lab.refHigh}` : `${lab.refLow}+`;
  return (
    <article className={`card value ${st}`}>
      <div className="value-top">
        <div>
          <h3>{lab.name}</h3>
          <p className="muted small">Reference {range} {lab.unit}</p>
        </div>
        <div className="value-num">
          <b>{lab.curr}</b><small>{lab.unit}</small>
        </div>
      </div>
      <Ruler value={lab.curr} prev={lab.prev} min={lab.min} max={lab.max} low={lab.refLow} high={lab.refHigh} unit={lab.unit} />
      <div className="value-status">
        <Badge tone={st === "normal" ? "ok" : "warn"}>{STATUS_LABEL[st]}</Badge>
      </div>
      <p className="explain" lang={lang === "hi" ? "hi-Latn" : "en"}>{lab[lang]}</p>
      <button className="link" onClick={() => onAsk(lang === "hi" ? `Mera ${lab.name} kaisa hai?` : `What does my ${lab.name} result mean?`)}>
        <MessageCircle size={15} aria-hidden="true" /> Ask a follow-up
      </button>
    </article>
  );
}

export default function Reports() {
  const { state, openChat } = useApp();
  const [tab, setTab] = useState("analysis");
  const [adding, setAdding] = useState(false);
  const labValues = state.labs;
  const attention = labValues.filter((l) => statusOf(l.curr, l.refLow, l.refHigh) !== "normal");

  return (
    <>
      <PageHeader title="Reports" subtitle="Your lab reports explained in plain language.">
        <Link to="/app/scanner" className="btn"><ScanLine size={16} /> Scan a prescription</Link>
        <button className="btn primary" onClick={() => setAdding((v) => !v)}><Plus size={16} /> Add report</button>
      </PageHeader>

      {adding && <ReportUpload onDone={() => setAdding(false)} />}

      {state.uploads.length > 0 && (
        <section className="card uploads">
          <h3>Added to CareLens</h3>
          <ul>
            {state.uploads.slice(0, 4).map((u) => (
              <li key={u.id}>
                <FileText size={16} aria-hidden="true" /> <b>{u.name}</b>
                <span className="muted small">{fmtDate(u.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {labValues.length > 0 && <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "analysis"} className={tab === "analysis" ? "on" : ""} onClick={() => setTab("analysis")}>Report analysis</button>
        <button role="tab" aria-selected={tab === "changes"} className={tab === "changes" ? "on" : ""} onClick={() => setTab("changes")}>What changed since last time</button>
      </div>}

      {labValues.length === 0 ? (
        <Empty icon={FileText} title="No reports yet">Tap "Add report" and upload a lab report (PDF or photo). CareLens reads the values and explains them in plain language.</Empty>
      ) : tab === "analysis" ? (
        <>
          <section className="callout">
            {attention.length ? <TriangleAlert size={20} aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
            <div>
              <b>{labValues.length - attention.length} of {labValues.length} values are in range</b>
              <p>
                {attention.length ? `${attention.map((a) => a.name).join(", ")} ${attention.length === 1 ? "is" : "are"} outside the reference range. That alone doesn't tell you why, so these are worth discussing with your doctor.` : "Everything we could read is inside its reference range."}
                {" "}Report{state.labMeta.lab ? ` from ${state.labMeta.lab}` : ""}, {fmtDate(state.labMeta.date)}.
              </p>
            </div>
          </section>
          <div className="grid values">
            {labValues.map((l) => <ValueCard key={l.id} lab={l} lang={state.lang} onAsk={openChat} />)}
          </div>
        </>
      ) : (
        <ReportCompare />
      )}
    </>
  );
}
