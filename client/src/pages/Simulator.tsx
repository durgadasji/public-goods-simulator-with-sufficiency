import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  Tooltip as RechartsTooltip, ScatterChart, Scatter,
} from "recharts";
import {
  runSimulation, SimConfig, SCENARIO_PRESETS, ROUND_TEMPLATES,
  type SimResult, type RoundOutcome, type ProjectStatus, type FundingRound,
  type PresetKey,
} from "@/lib/allocationEngine";
import {
  Info, AlertTriangle, CheckCircle2, ChevronRight,
  Layers, TrendingUp, TrendingDown, Minus,
} from "lucide-react";

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  nash:       "hsl(217 80% 62%)",
  coord:      "hsl(270 65% 65%)",
  funded:     "hsl(142 55% 48%)",
  leverage:   "hsl(42 92% 60%)",
  stranded:   "hsl(355 70% 58%)",
  starved:    "hsl(355 55% 42%)",
  surface:    "hsl(160 16% 10%)",
  surface2:   "hsl(160 14% 13%)",
  border:     "hsl(160 12% 17%)",
  text:       "hsl(155 10% 87%)",
  muted:      "hsl(155 6% 44%)",
  octant:     "hsl(160 55% 50%)",
};

const STATUS_COLOR: Record<string, string> = {
  thriving: C.funded,
  sufficient: "hsl(142 45% 40%)",
  'leverage-zone': C.leverage,
  underfunded: "hsl(28 80% 55%)",
  starved: C.stranded,
};

const STATUS_LABEL: Record<string, string> = {
  thriving: "Thriving",
  sufficient: "Sufficient",
  'leverage-zone': "Leverage Zone",
  underfunded: "Underfunded",
  starved: "Stranded",
};

// ─── Formatters ───────────────────────────────────────────────────────────────
const usd = (v: number) => v >= 1000000
  ? `$${(v/1000000).toFixed(1)}M`
  : v >= 1000 ? `$${Math.round(v/1000)}k` : `$${Math.round(v)}`;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

// ─── Insight icon/colour ──────────────────────────────────────────────────────
function insightColor(t: string) {
  if (t === "critical") return C.stranded;
  if (t === "warning")  return C.leverage;
  if (t === "success")  return C.funded;
  return "hsl(217 60% 62%)";
}
function InsightIcon({ type }: { type: string }) {
  const col = insightColor(type);
  if (type === "critical" || type === "warning") return <AlertTriangle size={12} style={{ color: col }} />;
  if (type === "success") return <CheckCircle2 size={12} style={{ color: col }} />;
  return <Info size={12} style={{ color: col }} />;
}

// ─── Slider row ───────────────────────────────────────────────────────────────
function SliderRow({ label, tooltip, value, min, max, step, display, accent, onChange }: {
  label: string; tooltip: string; value: number; min: number; max: number;
  step: number; display: string; accent: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium" style={{ color: "hsl(155 8% 72%)" }}>{label}</span>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild><Info size={10} className="cursor-help" style={{ color: C.muted }} /></TooltipTrigger>
              <TooltipContent side="right" className="max-w-[200px] text-xs">{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-xs font-mono font-semibold" style={{ color: accent }}>{display}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step}
        onValueChange={([v]) => onChange(v)} className="w-full" />
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color, testId }: {
  label: string; value: string; sub?: string; color: string; testId?: string;
}) {
  return (
    <div data-testid={testId} className="rounded-lg p-3 space-y-0.5"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="text-[10px] uppercase tracking-wide" style={{ color: C.muted }}>{label}</div>
      <div className="text-lg font-bold font-mono-data leading-none" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px]" style={{ color: C.muted }}>{sub}</div>}
    </div>
  );
}

// ─── Project dot grid ─────────────────────────────────────────────────────────
function ProjectDotGrid({ statuses, title, color }: {
  statuses: ProjectStatus[]; title: string; color: string;
}) {
  const counts = {
    thriving: statuses.filter(s => s.status === 'thriving').length,
    sufficient: statuses.filter(s => s.status === 'sufficient').length,
    'leverage-zone': statuses.filter(s => s.status === 'leverage-zone').length,
    underfunded: statuses.filter(s => s.status === 'underfunded').length,
    starved: statuses.filter(s => s.status === 'starved').length,
  };

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>{title}</div>
      <div className="flex flex-wrap gap-1">
        {statuses.map((s, i) => (
          <TooltipProvider key={i} delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  data-testid={`dot-${title.replace(/\s/g,'-').toLowerCase()}-${i}`}
                  className="w-3 h-3 rounded-sm cursor-pointer transition-transform hover:scale-125"
                  style={{ background: STATUS_COLOR[s.status] || C.muted }}
                />
              </TooltipTrigger>
              <TooltipContent className="text-xs space-y-0.5">
                <div className="font-semibold">{s.slot.label} · {s.slot.roundId}</div>
                <div>Received: {usd(s.received)}</div>
                <div>Min viable: {usd(s.slot.minViable)}</div>
                <div>Ideal ask: {usd(s.slot.idealAsk)}</div>
                <div style={{ color: STATUS_COLOR[s.status] }}>{STATUS_LABEL[s.status]}</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-[10px]">
        {Object.entries(counts).filter(([,v]) => v > 0).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: STATUS_COLOR[k] }} />
            <span style={{ color: C.muted }}>{STATUS_LABEL[k]}: {v}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Round comparison bar ─────────────────────────────────────────────────────
function RoundComparisonChart({ result, rounds }: { result: SimResult; rounds: FundingRound[] }) {
  const data = rounds.map((r, ri) => {
    const nm = result.nashOutcomes[ri];
    const cm = result.coordOutcomes[ri];
    return {
      name: r.name.replace('Octant', 'Oct').replace('Gitcoin Grants', 'Gitcoin').replace('Optimism RPGF', 'RPGF').replace('Community Round', 'Community'),
      nashTotal: Math.round(nm.totalFunding / 1000),
      coordTotal: Math.round(cm.totalFunding / 1000),
      nashSuff: Math.round(nm.sufficiencyRate * 100),
      coordSuff: Math.round(cm.sufficiencyRate * 100),
    };
  });

  return (
    <div className="h-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="25%" margin={{ top: 4, right: 4, left: -18, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 9 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: C.muted, fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}k`} />
          <RechartsTooltip
            contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11 }}
            formatter={(v: number, name: string) => [`$${v}k`, name === 'nashTotal' ? 'Nash total' : 'Coord total']}
          />
          <Bar dataKey="nashTotal" name="nashTotal" fill={C.nash} radius={[2,2,0,0]} opacity={0.85} />
          <Bar dataKey="coordTotal" name="coordTotal" fill={C.coord} radius={[2,2,0,0]} opacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Sufficiency scatter ──────────────────────────────────────────────────────
function SufficiencyScatter({ statuses }: { statuses: ProjectStatus[] }) {
  const pts = statuses.map(s => ({
    x: Math.min(300, s.received / 1000),
    y: s.slot.minViable / 1000,
    fill: STATUS_COLOR[s.status],
    label: s.slot.label,
    status: s.status,
  }));

  return (
    <div className="h-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          <XAxis dataKey="x" type="number" domain={[0, 'auto']}
            tick={{ fill: C.muted, fontSize: 9 }} tickLine={false} axisLine={false}
            label={{ value: 'Received ($k)', fill: C.muted, fontSize: 9, position: 'insideBottomRight', offset: -4 }} />
          <YAxis dataKey="y" type="number"
            tick={{ fill: C.muted, fontSize: 9 }} tickLine={false} axisLine={false}
            label={{ value: 'Min viable ($k)', fill: C.muted, fontSize: 9, angle: -90, position: 'insideLeft', offset: 14 }} />
          <RechartsTooltip
            contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11 }}
            formatter={(v: number, _, p) => [`$${v}k`, p?.dataKey === 'x' ? 'Received' : 'Min viable']}
          />
          {pts.map((p, i) => (
            <Scatter key={i} data={[p]} fill={p.fill} opacity={0.8} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Radar (governance health) ────────────────────────────────────────────────
function GovernanceRadar({ result, config }: { result: SimResult; config: SimConfig }) {
  const avgLev = config.rounds.reduce((s, r) => s + r.leverage, 0) / config.rounds.length;
  const avgFric = 1 - config.rounds.reduce((s, r) => s + r.entryFriction, 0) / config.rounds.length;
  const coordWilling = config.funders.reduce((s, f) => s + f.coordinationWillingness, 0) / config.funders.length;
  const data = [
    { metric: 'Nash Sufficiency', value: result.nashSufficiencyRate * 100 },
    { metric: 'Coord Sufficiency', value: result.coordSufficiencyRate * 100 },
    { metric: 'Leverage', value: Math.min(100, (avgLev / 65) * 100) },
    { metric: 'Low Friction', value: avgFric * 100 },
    { metric: 'Coord Willingness', value: coordWilling * 100 },
    { metric: 'Capital Density', value: Math.min(100, (config.totalFunderCapital / 1000000) * 60) },
  ];
  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke={C.border} />
          <PolarAngleAxis dataKey="metric" tick={{ fill: C.muted, fontSize: 9 }} />
          <Radar name="Nash" dataKey="value" stroke={C.nash} fill={C.nash} fillOpacity={0.15} strokeWidth={1.5} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Simulator ───────────────────────────────────────────────────────────
export default function Simulator() {
  const [config, setConfig] = useState<SimConfig>(SCENARIO_PRESETS.octantRealistic.config);
  const [activePreset, setActivePreset] = useState<string>('octantRealistic');
  const [activeTab, setActiveTab] = useState<'nash' | 'coordinated'>('nash');

  const result = useMemo(() => runSimulation(config), [config]);

  function applyPreset(key: string) {
    setConfig(SCENARIO_PRESETS[key as PresetKey].config);
    setActivePreset(key);
  }

  function setGlobalParam(key: keyof SimConfig, value: number) {
    setConfig(prev => ({ ...prev, [key]: value }));
    setActivePreset('');
  }

  function setFunderParam(fi: number, key: 'totalBudget' | 'coordinationWillingness', value: number) {
    setConfig(prev => {
      const funders = prev.funders.map((f, i) => i === fi ? { ...f, [key]: value } : f);
      const totalFunderCapital = funders.reduce((s, f) => s + f.totalBudget, 0);
      return { ...prev, funders, totalFunderCapital };
    });
    setActivePreset('');
  }

  const activeStatuses = activeTab === 'nash' ? result.nashProjectStatuses : result.coordProjectStatuses;
  const activeOutcomes = activeTab === 'nash' ? result.nashOutcomes : result.coordOutcomes;
  const activeRate = activeTab === 'nash' ? result.nashSufficiencyRate : result.coordSufficiencyRate;

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ background: "hsl(160 18% 7%)" }}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-[256px] flex-shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ borderColor: C.border }}>

        {/* Logo */}
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: C.border }}>
          <svg aria-label="PubGoods Logo" viewBox="0 0 32 32" width="28" height="28" fill="none">
            {/* Concentric circles = commons / public goods */}
            <circle cx="16" cy="16" r="13" stroke="hsl(160 55% 50%)" strokeWidth="1.2" fill="none" />
            <circle cx="16" cy="16" r="8"  stroke="hsl(42 92% 60%)" strokeWidth="1.2" fill="none" />
            <circle cx="16" cy="16" r="3.5" fill="hsl(42 92% 60%)" opacity="0.9" />
            {/* Spokes */}
            {[0,60,120,180,240,300].map(a => (
              <line key={a}
                x1={16 + 4.5 * Math.cos(a*Math.PI/180)}
                y1={16 + 4.5 * Math.sin(a*Math.PI/180)}
                x2={16 + 8.5 * Math.cos(a*Math.PI/180)}
                y2={16 + 8.5 * Math.sin(a*Math.PI/180)}
                stroke="hsl(160 55% 50%)" strokeWidth="1" opacity="0.6"
              />
            ))}
          </svg>
          <div>
            <div className="text-sm font-bold tracking-tight leading-none" style={{ color: C.text }}>Public Goods</div>
            <div className="text-[10px] mt-0.5" style={{ color: C.muted }}>Capital Allocation Simulator</div>
          </div>
        </div>

        {/* Data badge */}
        <div className="px-3 py-2 border-b" style={{ borderColor: C.border }}>
          <div className="text-[10px] rounded px-2 py-1 flex items-center gap-1.5"
            style={{ background: "hsl(160 30% 10%)", border: `1px solid hsl(160 40% 20%)`, color: C.octant }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block pulse-glow" style={{ background: C.octant }} />
            Calibrated from Octant Epochs 1–10
          </div>
        </div>

        {/* Presets */}
        <div className="p-3 border-b" style={{ borderColor: C.border }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Scenarios</div>
          <div className="space-y-1">
            {Object.entries(SCENARIO_PRESETS).map(([key, preset]) => (
              <button key={key} data-testid={`preset-${key}`}
                onClick={() => applyPreset(key)}
                className="w-full text-left px-2 py-1.5 rounded text-xs transition-all flex items-center justify-between group"
                style={{
                  background: activePreset === key ? "hsl(42 40% 12%)" : "transparent",
                  color: activePreset === key ? "hsl(42 92% 72%)" : C.muted,
                  border: `1px solid ${activePreset === key ? "hsl(42 60% 30%)" : "transparent"}`,
                }}>
                <span>{preset.label}</span>
                <ChevronRight size={10} className="opacity-0 group-hover:opacity-50 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 p-3 space-y-4 overflow-y-auto">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.octant }}>
              Mechanism Parameters
            </div>
            <div className="space-y-4">
              <SliderRow label="Sufficiency Weight" tooltip="How strongly funders prioritize pushing projects over minimum viable threshold vs. raw volume"
                value={config.sufficiencyWeight} min={0} max={1} step={0.01}
                display={pct(config.sufficiencyWeight)} accent={C.leverage}
                onChange={v => setGlobalParam('sufficiencyWeight', v)} />
              <SliderRow label="Coordination Cost" tooltip="Overhead of coordination mechanisms (0=free, 1=prohibitive)"
                value={config.coordinationCost} min={0} max={0.5} step={0.01}
                display={pct(config.coordinationCost)} accent={C.coord}
                onChange={v => setGlobalParam('coordinationCost', v)} />
              <SliderRow label="ETH Price (USD)" tooltip="Affects absolute USD value of matching pools"
                value={config.ethPriceUSD} min={500} max={8000} step={100}
                display={`$${config.ethPriceUSD.toLocaleString()}`} accent="hsl(155 10% 70%)"
                onChange={v => setGlobalParam('ethPriceUSD', v)} />
            </div>
          </div>

          {config.funders.map((funder, fi) => (
            <div key={funder.id}>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.nash }}>
                {funder.name}
              </div>
              <div className="space-y-4">
                <SliderRow label="Budget" tooltip="Total capital this funder can deploy across all rounds"
                  value={funder.totalBudget} min={10000} max={2000000} step={10000}
                  display={usd(funder.totalBudget)} accent={C.nash}
                  onChange={v => setFunderParam(fi, 'totalBudget', v)} />
                <SliderRow label="Coordination Willingness" tooltip="Willingness to follow a collective allocation signal vs. going alone"
                  value={funder.coordinationWillingness} min={0} max={1} step={0.01}
                  display={pct(funder.coordinationWillingness)} accent={C.coord}
                  onChange={v => setFunderParam(fi, 'coordinationWillingness', v)} />
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-10 flex items-center gap-4 px-4 border-b flex-shrink-0"
          style={{ borderColor: C.border }}>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: C.muted }}>Sufficiency gap:</span>
            <span className="text-sm font-bold font-mono-data"
              style={{ color: result.sufficiencyGap > 0 ? C.stranded : C.funded }}>
              {result.sufficiencyGap > 0 ? `${result.sufficiencyGap} projects stranded` : "All projects sufficient"}
            </span>
            {result.leverageZoneGapUSD > 0 && (
              <>
                <span className="text-xs" style={{ color: C.muted }}>·</span>
                <span className="text-xs" style={{ color: C.leverage }}>
                  {usd(result.leverageZoneGapUSD)} would push leverage-zone projects to viability
                </span>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs" style={{ color: C.muted }}>Coordination premium:</span>
            <span className="text-xs font-mono font-semibold"
              style={{ color: result.coordinationPremium > 0.1 ? C.coord : C.muted }}>
              +{(result.coordinationPremium * 100).toFixed(1)}pp
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ── Row 1: KPIs ────────────────────────────────────── */}
          <div className="grid grid-cols-6 gap-3">
            <KPI testId="kpi-total-capital" label="Total Funder Capital"
              value={usd(config.totalFunderCapital)} sub="deployed across rounds"
              color={C.text} />
            <KPI testId="kpi-nash-sufficiency" label="Nash Sufficiency Rate"
              value={pct(result.nashSufficiencyRate)}
              sub={`${Math.round(result.nashSufficiencyRate * result.totalProjects)}/${result.totalProjects} projects`}
              color={result.nashSufficiencyRate > 0.6 ? C.funded : result.nashSufficiencyRate > 0.35 ? C.leverage : C.stranded} />
            <KPI testId="kpi-coord-sufficiency" label="Coordinated Sufficiency"
              value={pct(result.coordSufficiencyRate)}
              sub={`${Math.round(result.coordSufficiencyRate * result.totalProjects)}/${result.totalProjects} projects`}
              color={C.coord} />
            <KPI testId="kpi-gap" label="Sufficiency Gap"
              value={String(result.sufficiencyGap)}
              sub="projects coordination saves"
              color={result.sufficiencyGap > 0 ? C.stranded : C.funded} />
            <KPI testId="kpi-leverage-gap" label="Leverage Zone Gap"
              value={usd(result.leverageZoneGapUSD)}
              sub="to push near-threshold projects"
              color={C.leverage} />
            <KPI testId="kpi-coord-premium" label="Coordination Premium"
              value={`+${(result.coordinationPremium * 100).toFixed(1)}pp`}
              sub="sufficiency improvement"
              color={result.coordinationPremium > 0.1 ? C.coord : C.muted} />
          </div>

          {/* ── Row 2: 3 panels ────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">

            {/* Project status grid */}
            <div className="rounded-lg p-4 space-y-4"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
                  Project Viability
                </div>
                <div className="flex rounded overflow-hidden ml-auto">
                  {(['nash', 'coordinated'] as const).map(tab => (
                    <button key={tab} data-testid={`tab-${tab}`}
                      onClick={() => setActiveTab(tab)}
                      className="text-[10px] px-2 py-1 font-medium transition-colors"
                      style={{
                        background: activeTab === tab ? (tab === 'nash' ? C.nash : C.coord) : "hsl(160 12% 15%)",
                        color: activeTab === tab ? "hsl(160 18% 7%)" : C.muted,
                      }}>
                      {tab === 'nash' ? 'Nash' : 'Coordinated'}
                    </button>
                  ))}
                </div>
              </div>

              <ProjectDotGrid
                statuses={activeStatuses}
                title={activeTab === 'nash' ? 'Nash Equilibrium' : 'Coordinated Optimum'}
                color={activeTab === 'nash' ? C.nash : C.coord}
              />

              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
                  Received vs. Min Viable (Nash)
                </div>
                <SufficiencyScatter statuses={result.nashProjectStatuses} />
                <div className="text-[10px] text-center" style={{ color: C.muted }}>
                  Points above diagonal = insufficient; below = surplus. Real data: median ask $100k, median received $24k.
                </div>
              </div>
            </div>

            {/* Round outcomes comparison */}
            <div className="rounded-lg p-4 space-y-3"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
                Round Outcomes: Nash vs. Coordinated
              </div>

              <RoundComparisonChart result={result} rounds={config.rounds} />

              <div className="space-y-2">
                {config.rounds.map((round, ri) => {
                  const nm = result.nashOutcomes[ri];
                  const cm = result.coordOutcomes[ri];
                  const mis = result.roundMisallocation[ri];
                  return (
                    <div key={round.id} data-testid={`round-row-${ri}`}
                      className="rounded p-2.5 space-y-1.5"
                      style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: C.text }}>{round.name}</span>
                        <div className="flex gap-1">
                          {mis.overcrowded && (
                            <Badge className="text-[9px] h-4 px-1" style={{ background: "hsl(28 60% 15%)", color: C.leverage, border: "none" }}>
                              Crowded
                            </Badge>
                          )}
                          {mis.neglected && (
                            <Badge className="text-[9px] h-4 px-1" style={{ background: "hsl(217 40% 15%)", color: C.nash, border: "none" }}>
                              Neglected
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span style={{ color: C.muted }}>Nash total: </span>
                          <span className="font-mono-data font-semibold" style={{ color: C.nash }}>{usd(nm.totalFunding)}</span>
                        </div>
                        <div>
                          <span style={{ color: C.muted }}>Coord total: </span>
                          <span className="font-mono-data font-semibold" style={{ color: C.coord }}>{usd(cm.totalFunding)}</span>
                        </div>
                        <div>
                          <span style={{ color: C.muted }}>Nash suff: </span>
                          <span className="font-mono-data" style={{ color: nm.sufficiencyRate > 0.6 ? C.funded : C.stranded }}>
                            {pct(nm.sufficiencyRate)}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: C.muted }}>Avg received: </span>
                          <span className="font-mono-data" style={{ color: C.text }}>{usd(nm.perProjectAvg)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]" style={{ color: C.muted }}>
                        <span>Min viable: {usd(round.avgMinViable)}</span>
                        <span>·</span>
                        <span>Ideal ask: {usd(round.avgIdealAsk)}</span>
                        <span>·</span>
                        <span>Match leverage: {mis.matchingEfficiency.toFixed(1)}x</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Radar + insights */}
            <div className="rounded-lg p-4 space-y-3 overflow-y-auto"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
                Ecosystem Health
              </div>
              <GovernanceRadar result={result} config={config} />

              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
                Analysis
              </div>
              <div className="space-y-2">
                {result.insights.map((ins, i) => (
                  <div key={i} data-testid={`insight-${i}`}
                    className="rounded p-2.5 space-y-1"
                    style={{
                      background: `${insightColor(ins.type)}0c`,
                      border: `1px solid ${insightColor(ins.type)}28`,
                    }}>
                    <div className="flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: insightColor(ins.type) }}>
                      <InsightIcon type={ins.type} />
                      {ins.title}
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: "hsl(155 5% 55%)" }}>
                      {ins.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Row 3: Per-round sufficiency bars ──────────────── */}
          <div className="rounded-lg p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
              Sufficiency Breakdown Per Round — Nash vs Coordinated
            </div>
            <div className="grid grid-cols-4 gap-3">
              {config.rounds.map((round, ri) => {
                const nm = result.nashOutcomes[ri];
                const cm = result.coordOutcomes[ri];
                const nashAbove = nm.projectsAboveMinViable;
                const coordAbove = cm.projectsAboveMinViable;
                const total = round.fundedProjects;
                const realGap = round.avgReceived / round.avgMinViable;

                return (
                  <div key={round.id} data-testid={`round-detail-${ri}`}
                    className="rounded p-3 space-y-2"
                    style={{ background: "hsl(160 18% 7%)", border: `1px solid ${C.border}` }}>
                    <div className="text-xs font-semibold" style={{ color: C.text }}>{round.name}</div>
                    <div className="text-[10px]" style={{ color: C.muted }}>{round.theme}</div>

                    {/* Nash bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span style={{ color: C.nash }}>Nash</span>
                        <span className="font-mono-data" style={{ color: C.nash }}>{nashAbove}/{total}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(160 12% 17%)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${(nashAbove/total)*100}%`, background: C.nash }} />
                      </div>
                    </div>

                    {/* Coordinated bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span style={{ color: C.coord }}>Coordinated</span>
                        <span className="font-mono-data" style={{ color: C.coord }}>{coordAbove}/{total}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(160 12% 17%)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${(coordAbove/total)*100}%`, background: C.coord }} />
                      </div>
                    </div>

                    {/* Real data reference */}
                    <div className="text-[10px] pt-1 border-t" style={{ borderColor: C.border, color: C.muted }}>
                      <div className="flex justify-between">
                        <span>Ideal ask:</span>
                        <span>{usd(round.avgIdealAsk)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Min viable:</span>
                        <span>{usd(round.avgMinViable)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hist. received:</span>
                        <span style={{ color: realGap >= 1 ? C.funded : realGap >= 0.7 ? C.leverage : C.stranded }}>
                          {usd(round.avgReceived)} ({(realGap*100).toFixed(0)}% of min)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
