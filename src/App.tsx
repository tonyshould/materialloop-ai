import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  ChevronRight,
  CircleDollarSign,
  Cloud,
  Database,
  Factory,
  FileCheck2,
  FileText,
  Fingerprint,
  Leaf,
  LoaderCircle,
  LockKeyhole,
  Network,
  PackageCheck,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Upload,
  Warehouse
} from "lucide-react";
import type { AnalysisResult, DemoCaseId, EvidenceField } from "../shared/contracts";

type Provider = "demo" | "gemini";
type Stage = "landing" | "input" | "analyzing" | "result";

interface AppConfig {
  defaultProvider: Provider;
  geminiConfigured: boolean;
  model: string | null;
  googleServices: string[];
}

const cases: Array<{ id: DemoCaseId; code: string; title: string; note: string; tone: string }> = [
  { id: "case-a-success", code: "A", title: "Verified pathway", note: "Photo + certificate + lot data", tone: "ready" },
  { id: "case-b-photo-only", code: "B", title: "Missing evidence", note: "Photo only — value claims blocked", tone: "missing" },
  { id: "case-c-conflict", code: "C", title: "Conflicting evidence", note: "Lot and composition conflict", tone: "conflict" }
];

const analysisSteps = [
  "Reading material evidence",
  "Structuring a material passport",
  "Evaluating evidence sufficiency",
  "Calculating deterministic value and impact",
  "Matching conditional reuse pathways"
];

function formatTwd(value: number | null) {
  return value === null ? "Blocked" : new Intl.NumberFormat("en-US", { style: "currency", currency: "TWD", maximumFractionDigits: 0 }).format(value);
}

function humanize(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (character) => character.toUpperCase());
}

function StatusChip({ status }: { status: AnalysisResult["decisionStatus"] }) {
  const map = {
    ready: ["Decision-ready", "positive"],
    insufficient_evidence: ["Insufficient evidence", "warning"],
    evidence_conflict: ["Evidence conflict", "danger"],
    manual_review: ["Manual review", "warning"],
    analysis_failed: ["Analysis failed", "danger"]
  } as const;
  return <span className={`status-chip ${map[status][1]}`}>{map[status][0]}</span>;
}

function SourceBadge({ field }: { field: EvidenceField }) {
  const labels: Record<EvidenceField["provenance"], string> = {
    USER_PROVIDED: "User input",
    DOCUMENT_EXTRACTED: "Document",
    AI_INFERRED: "Gemini inference",
    DEMO_DATA: "Demo fixture",
    VERIFIED: "Verified",
    RULE_ENGINE: "Rule engine"
  };
  return <span className={`source-badge ${field.verificationStatus}`}>{labels[field.provenance]}</span>;
}

function App() {
  const [stage, setStage] = useState<Stage>("landing");
  const [caseId, setCaseId] = useState<DemoCaseId>("case-a-success");
  const [provider, setProvider] = useState<Provider>("demo");
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [sourceProcess, setSourceProcess] = useState("CNC Milling");
  const [quantityKg, setQuantityKg] = useState("500");
  const [location, setLocation] = useState("Taiwan");
  const [photo, setPhoto] = useState<File | null>(null);
  const [certificate, setCertificate] = useState<File | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((response) => response.json())
      .then((data: AppConfig) => {
        setConfig(data);
        if (data.defaultProvider === "gemini" && data.geminiConfigured) setProvider("gemini");
      })
      .catch(() => setConfig({ defaultProvider: "demo", geminiConfigured: false, model: null, googleServices: [] }));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [stage]);

  useEffect(() => {
    if (caseId === "case-b-photo-only") {
      setQuantityKg("");
      setLocation("");
    } else {
      setQuantityKg("500");
      setLocation("Taiwan");
    }
    setCertificate(null);
  }, [caseId]);

  const selectedCase = useMemo(() => cases.find((item) => item.id === caseId)!, [caseId]);

  async function analyze() {
    setError(null);
    setResult(null);
    setStepIndex(0);
    setStage("analyzing");

    const animation = window.setInterval(() => setStepIndex((current) => Math.min(current + 1, analysisSteps.length - 1)), 500);
    try {
      const data = new FormData();
      data.append("caseId", caseId);
      data.append("provider", provider);
      data.append("sourceProcess", sourceProcess);
      if (quantityKg) data.append("quantityKg", quantityKg);
      if (location) data.append("location", location);
      if (photo) data.append("photo", photo);
      if (certificate) data.append("certificate", certificate);
      const response = await fetch("/api/analyze", { method: "POST", body: data });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "The analysis could not be completed.");
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      setResult(payload as AnalysisResult);
      setStage("result");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The analysis could not be completed.");
      setStage("input");
    } finally {
      window.clearInterval(animation);
    }
  }

  function restart() {
    setResult(null);
    setError(null);
    setStage("input");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setStage("landing")} aria-label="MaterialLoop home">
          <span className="brand-mark"><Network size={20} /></span>
          <span>MaterialLoop <strong>AI</strong></span>
        </button>
        <div className="topbar-meta">
          <span className="live-dot" />
          <span>{provider === "gemini" ? config?.model || "Gemini on Vertex AI" : "Safe deterministic demo"}</span>
          <span className="google-pill"><Cloud size={14} /> Google Cloud</span>
        </div>
      </header>

      {stage === "landing" && <Landing onStart={() => setStage("input")} />}
      {stage === "input" && (
        <main className="workspace page-enter">
          <section className="workspace-head">
            <div>
              <span className="eyebrow">Material intelligence workspace</span>
              <h1>Turn material evidence into a decision-ready pathway.</h1>
              <p>Gemini interprets unstructured evidence. Deterministic rules protect every financial, environmental and matching claim.</p>
            </div>
            <div className="trust-card">
              <ShieldCheck size={22} />
              <div><strong>Evidence-gated by design</strong><span>No certificate, no definitive claim.</span></div>
            </div>
          </section>

          <section className="case-switcher" aria-label="Demo scenarios">
            {cases.map((item) => (
              <button key={item.id} className={`case-card ${caseId === item.id ? "selected" : ""} ${item.tone}`} onClick={() => setCaseId(item.id)}>
                <span className="case-code">{item.code}</span>
                <span><strong>{item.title}</strong><small>{item.note}</small></span>
                {caseId === item.id && <Check size={18} />}
              </button>
            ))}
          </section>

          <section className="input-grid">
            <div className="panel evidence-panel">
              <div className="panel-title"><div><span className="step-number">01</span><h2>Material evidence</h2></div><span className="demo-label">Synthetic demo data</span></div>
              <div className="upload-grid">
                <label className="upload-card photo-card">
                  <input type="file" accept="image/png,image/jpeg" onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
                  <img src="/demo/aluminum-offcuts-demo.png" alt="Synthetic demo aluminum offcuts" />
                  <span className="upload-overlay"><Upload size={18} />{photo ? photo.name : "Replace demo photo"}</span>
                </label>
                <label className={`upload-card document-card ${caseId === "case-b-photo-only" ? "disabled-look" : ""}`}>
                  <input type="file" accept="application/pdf" disabled={caseId === "case-b-photo-only"} onChange={(event) => setCertificate(event.target.files?.[0] || null)} />
                  <FileText size={34} />
                  <strong>{certificate ? certificate.name : caseId === "case-c-conflict" ? "Demo_COA_Conflict_ML-C-077.pdf" : caseId === "case-b-photo-only" ? "No certificate supplied" : "Demo_COA_Aluminum_6061_ML-A-001.pdf"}</strong>
                  <span>{caseId === "case-b-photo-only" ? "Evidence intentionally missing" : "PDF · Synthetic certificate"}</span>
                  {caseId !== "case-b-photo-only" && <small><Upload size={14} /> Replace certificate</small>}
                </label>
              </div>
              <div className="field-grid">
                <label>Source process<input value={sourceProcess} onChange={(event) => setSourceProcess(event.target.value)} /></label>
                <label>Quantity (kg)<input type="number" placeholder="Required" value={quantityKg} onChange={(event) => setQuantityKg(event.target.value)} /></label>
                <label>Location<input placeholder="Required" value={location} onChange={(event) => setLocation(event.target.value)} /></label>
              </div>
            </div>

            <aside className="panel intelligence-panel">
              <div className="panel-title"><div><span className="step-number">02</span><h2>Analysis mode</h2></div></div>
              <div className="provider-toggle">
                <button className={provider === "demo" ? "active" : ""} onClick={() => setProvider("demo")}><BadgeCheck size={18} /><span><strong>Demo</strong><small>Always reproducible</small></span></button>
                <button className={provider === "gemini" ? "active" : ""} onClick={() => setProvider("gemini")} disabled={!config?.geminiConfigured}><Sparkles size={18} /><span><strong>Gemini</strong><small>{config?.geminiConfigured ? "Live Vertex AI" : "Needs cloud config"}</small></span></button>
              </div>
              <div className="pipeline-list">
                {[
                  [ScanLine, "Multimodal extraction", "Gemini"],
                  [FileCheck2, "Evidence sufficiency", "Rule engine"],
                  [CircleDollarSign, "Value model", "Versioned dataset"],
                  [Leaf, "Impact factors", "Versioned factors"],
                  [Network, "Buyer matching", "Deterministic score"]
                ].map(([Icon, label, source]) => {
                  const PipelineIcon = Icon as typeof ScanLine;
                  return <div className="pipeline-row" key={String(label)}><PipelineIcon size={18} /><span><strong>{String(label)}</strong><small>{String(source)}</small></span><ChevronRight size={15} /></div>;
                })}
              </div>
              {provider === "gemini" && <div className="model-note"><LockKeyhole size={16} /><span>Credentials stay server-side via Application Default Credentials.</span></div>}
              {error && <div className="error-box"><AlertTriangle size={18} />{error}</div>}
              <button className="primary-action" onClick={analyze}><Sparkles size={18} />Analyze material<ArrowRight size={18} /></button>
              <p className="action-note">Selected: Case {selectedCase.code} · {selectedCase.title}</p>
            </aside>
          </section>
          <GoogleRail config={config} provider={provider} />
        </main>
      )}

      {stage === "analyzing" && <Analyzing stepIndex={stepIndex} provider={provider} />}
      {stage === "result" && result && <Results result={result} onRestart={restart} />}
    </div>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <main className="landing page-enter">
      <section className="hero-copy">
        <span className="eyebrow"><Sparkles size={14} /> Gemini-powered industrial circularity</span>
        <h1>Industrial leftovers.<br /><em>Decision-ready value.</em></h1>
        <p>MaterialLoop AI transforms photos, certificates and process data into evidence-linked material passports, reuse pathways and auditable impact.</p>
        <div className="hero-actions">
          <button className="primary-action hero-button" onClick={onStart}>Analyze a material<ArrowRight size={18} /></button>
          <span><ShieldCheck size={17} /> Human approval before outreach</span>
        </div>
      </section>
      <section className="flow-visual" aria-label="Factory material exchange flow">
        <div className="flow-glow" />
        <article className="factory-node source-node"><span><Factory size={30} /></span><small>FACTORY A</small><strong>CNC offcuts</strong><em>Underused material</em></article>
        <div className="flow-line"><span className="moving-dot" /><ArrowRight size={19} /></div>
        <article className="ai-core"><div className="core-ring"><Network size={36} /></div><small>MATERIALLOOP AI</small><strong>Evidence → insight</strong><div className="mini-tags"><span>Gemini</span><span>Rules</span><span>Audit</span></div></article>
        <div className="flow-line"><span className="moving-dot delay" /><ArrowRight size={19} /></div>
        <article className="factory-node buyer-node"><span><Warehouse size={30} /></span><small>FACTORY B</small><strong>New application</strong><em>Conditional match</em></article>
      </section>
      <section className="proof-strip">
        <div><Fingerprint /><span><strong>Traceable</strong><small>Field-level provenance</small></span></div>
        <div><ShieldCheck /><span><strong>Evidence-gated</strong><small>Claims stop when data fails</small></span></div>
        <div><Cloud /><span><strong>Google-native</strong><small>Vertex AI + Cloud Run</small></span></div>
      </section>
    </main>
  );
}

function GoogleRail({ config, provider }: { config: AppConfig | null; provider: Provider }) {
  const services = [
    [Sparkles, "Vertex AI", provider === "gemini" ? "Live" : "Ready"],
    [Cloud, "Cloud Run", "Target runtime"],
    [Database, "Firestore", "Audit records"],
    [PackageCheck, "Cloud Storage", "Evidence objects"],
    [LockKeyhole, "Secret Manager", "Credential boundary"]
  ];
  return <section className="google-rail"><span className="google-wordmark">Built for <strong>Google Cloud</strong></span>{services.map(([Icon, name, state]) => { const ServiceIcon = Icon as typeof Cloud; return <div key={String(name)}><ServiceIcon size={15} /><span>{String(name)}<small>{String(state)}</small></span></div>; })}<span className="service-count">{config?.googleServices.length || 6} services mapped</span></section>;
}

function Analyzing({ stepIndex, provider }: { stepIndex: number; provider: Provider }) {
  return <main className="analysis-screen page-enter"><div className="scanner"><div className="scanner-orbit orbit-one" /><div className="scanner-orbit orbit-two" /><div className="scanner-core"><Sparkles size={40} /></div></div><span className="eyebrow">{provider === "gemini" ? "Gemini on Vertex AI" : "Deterministic demo provider"}</span><h1>Building the evidence graph</h1><p>Every claim keeps its source, confidence and verification state.</p><div className="analysis-list">{analysisSteps.map((step, index) => <div className={index < stepIndex ? "done" : index === stepIndex ? "active" : ""} key={step}><span>{index < stepIndex ? <Check size={15} /> : index === stepIndex ? <LoaderCircle size={15} /> : index + 1}</span>{step}</div>)}</div></main>;
}

function Results({ result, onRestart }: { result: AnalysisResult; onRestart: () => void }) {
  const blocked = result.decisionStatus !== "ready";
  return (
    <main className="results page-enter">
      <section className="result-hero">
        <div><span className="eyebrow">Analysis complete · {result.provider === "gemini" ? result.model : "Safe demo"}</span><h1>{blocked ? "Evidence stopped the decision." : "A verified pathway is ready for review."}</h1><p>Run {result.runId.slice(0, 8)} · No external outreach has been sent.</p></div>
        <div className="result-actions"><StatusChip status={result.decisionStatus} /><button className="secondary-action" onClick={onRestart}>New analysis</button></div>
      </section>

      {blocked ? <BlockedResult result={result} /> : <ReadyResult result={result} />}

      <section className="audit-footer">
        <div><ShieldCheck size={20} /><span><strong>Human-in-the-loop control</strong><small>Buyer notification remains approval-required.</small></span></div>
        <div><Cloud size={20} /><span><strong>Google Cloud execution map</strong><small>Vertex AI · Cloud Run · Storage · Firestore · Logging</small></span></div>
        <span className="demo-label">Synthetic demo — not engineering advice</span>
      </section>
    </main>
  );
}

function ReadyResult({ result }: { result: AnalysisResult }) {
  return <>
    <section className="metric-grid">
      <article className="metric-card featured"><span>Net second-life value</span><strong>{formatTwd(result.valuation.secondLifeNetTwd)}</strong><small>{result.valuation.upliftPercent}% above traditional recovery</small></article>
      <article className="metric-card"><span>Avoided emissions</span><strong>{result.impact.avoidedCo2eKg?.toLocaleString()} kg</strong><small>CO₂e · factor {result.impact.factorVersion}</small></article>
      <article className="metric-card"><span>Buyer match</span><strong>{result.match.score}/100</strong><small>{result.match.buyerName}</small></article>
      <article className="metric-card"><span>Material passport</span><strong className="passport-id">{result.materialPassportId}</strong><small>Evidence-linked and auditable</small></article>
    </section>
    <section className="result-grid">
      <article className="panel passport-panel"><div className="panel-title"><div><Fingerprint size={20} /><h2>Material passport</h2></div><span className="status-chip positive">Evidence supported</span></div><div className="passport-fields">{Object.entries(result.fields).map(([key, field]) => <div key={key}><span>{humanize(key)}</span><strong>{field.value ?? "Verification required"}</strong><SourceBadge field={field} /></div>)}</div></article>
      <article className="panel value-panel"><div className="panel-title"><div><BarChart3 size={20} /><h2>Auditable value model</h2></div><span className="dataset-pill">{result.valuation.datasetVersion}</span></div><div className="waterfall"><div><span>Traditional recovery</span><strong>{formatTwd(result.valuation.traditionalRecoveryTwd)}</strong></div><div><span>Second-life gross</span><strong>{formatTwd(result.valuation.secondLifeGrossTwd)}</strong></div><div className="cost"><span>Processing + verification + logistics</span><strong>−{formatTwd((result.valuation.processingCostTwd || 0) + (result.valuation.verificationCostTwd || 0) + (result.valuation.logisticsCostTwd || 0))}</strong></div><div className="total"><span>Net second-life value</span><strong>{formatTwd(result.valuation.secondLifeNetTwd)}</strong></div></div><p className="range-note">Decision range: {formatTwd(result.valuation.lowTwd)} — {formatTwd(result.valuation.highTwd)}</p></article>
    </section>
    <section className="panel opportunity-panel"><div className="panel-title"><div><Network size={20} /><h2>Conditional reuse pathways</h2></div><span className="demo-label">Ranked, not guaranteed</span></div><div className="opportunity-table">{result.opportunities.slice(0, 4).map((item, index) => <div className="opportunity-row" key={item.id}><span className="rank">0{index + 1}</span><span className="opportunity-title"><strong>{item.title}</strong><small>{item.target} · {item.requiredProcessing}</small></span><span className="compatibility"><strong>{item.compatibility}%</strong><small>Compatibility</small></span><span className={`potential ${item.economicPotential.toLowerCase()}`}>{item.economicPotential}</span><span className="condition"><AlertTriangle size={14} />{item.status.replace("_", " ")}</span></div>)}</div></section>
  </>;
}

function BlockedResult({ result }: { result: AnalysisResult }) {
  return <section className="blocked-layout"><article className="block-banner"><span className="block-icon"><AlertTriangle size={30} /></span><div><span className="eyebrow">Evidence gate activated</span><h2>{result.decisionStatus === "evidence_conflict" ? "Resolve conflicting evidence before calculating value." : "Add the missing evidence before making a definitive claim."}</h2><p>MaterialLoop intentionally withheld valuation, environmental impact and buyer matching. This is a safety feature, not an analysis failure.</p></div></article><div className="result-grid"><article className="panel"><div className="panel-title"><div><FileCheck2 size={20} /><h2>{result.conflicts.length ? "Conflicts to resolve" : "Evidence still required"}</h2></div></div>{result.conflicts.length ? <div className="conflict-list">{result.conflicts.map((conflict) => <div key={conflict.field}><strong>{humanize(conflict.field)}</strong><p>{conflict.evidenceA}</p><p>{conflict.evidenceB}</p><span>{conflict.resolution}</span></div>)}</div> : <div className="missing-list">{result.missingFields.map((item) => <div key={item}><span><FileText size={17} />{humanize(item)}</span><strong>Required</strong></div>)}</div>}</article><article className="panel blocked-metrics"><div className="panel-title"><div><LockKeyhole size={20} /><h2>Claims withheld</h2></div></div>{["Financial valuation", "Avoided CO₂e", "Buyer match score", "External notification"].map((claim) => <div key={claim}><span>{claim}</span><strong>BLOCKED</strong></div>)}</article></div><article className="panel field-review"><div className="panel-title"><div><ScanLine size={20} /><h2>What the system could observe</h2></div><span className="demo-label">No unsupported upgrade</span></div><div className="passport-fields">{Object.entries(result.fields).map(([key, field]) => <div key={key}><span>{humanize(key)}</span><strong>{field.value ?? "Not available"}</strong><SourceBadge field={field} /></div>)}</div></article></section>;
}

export default App;
