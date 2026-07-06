import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type Bias = 'BUY' | 'SELL' | 'WATCH';
type Signal = {
  coin: { id:string; symbol:string; name:string; image:string; current_price:number; market_cap:number; market_cap_rank:number; total_volume:number; price_change_percentage_1h_in_currency:number; price_change_percentage_24h_in_currency:number; price_change_percentage_7d_in_currency:number; ath_change_percentage:number };
  bias: Bias; signal:string; score:number; stage:string; confidence:string; volMcap:number; reasons:string[]; warnings:string[]; updatedAt:string;
  evidence?: { source:string; label:string; value:string; txHash?:string; url?:string }[];
  futures?: { symbol:string; fundingRate:number; openInterestUsd:number; source:string };
  marketStructure?: { cvdUsd15m:number; buyUsd15m:number; sellUsd15m:number; bidUsd1Pct:number; askUsd1Pct:number; depthImbalance1Pct:number; liquidationUsd15m?:number; updatedAt:string; source:string };
};
type SourceHealth = { name:string; status:'LIVE'|'DELAYED'|'MISSING'; lastOk?:string; lastError?:string; note?:string };
type TimelinePoint = { savedAt:string; buy:number; sell:number; watch:number; avgScore:number; top:{symbol:string; bias:Bias; score:number; price:number; signal:string}[] };
type SeriesPoint = { t:string; price:number; score:number; volMcap:number; cvd:number; depth:number; oi:number; funding:number; bias:Bias };

function App() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [sources, setSources] = useState<SourceHealth[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [sort, setSort] = useState('score');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [series, setSeries] = useState<SeriesPoint[]>([]);

  async function load() {
    const [signalsRes, timelineRes] = await Promise.all([fetch('/api/signals'), fetch('/api/timeline?limit=40')]);
    const data = await signalsRes.json();
    const history = await timelineRes.json();
    setSignals(data.signals ?? []);
    setSources(data.status?.sources ?? []);
    setTimeline(history.timeline ?? []);
    if (!selectedId && data.signals?.[0]) setSelectedId(data.signals[0].coin.id);
  }

  useEffect(() => { load(); const id = setInterval(load, 10000); return () => clearInterval(id); }, []);
  useEffect(() => { if (!selectedId) return; fetch(`/api/series/${selectedId}?limit=180`).then((res) => res.json()).then((data) => setSeries(data.points ?? [])).catch(() => setSeries([])); }, [selectedId, signals.length]);
  const selected = signals.find((signal) => signal.coin.id === selectedId) ?? signals[0];
  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return signals
      .filter((s) => filter === 'ALL' || s.bias === filter || s.stage === filter || s.signal.toUpperCase().includes(filter))
      .filter((s) => !q || s.coin.symbol.toLowerCase().includes(q) || s.coin.name.toLowerCase().includes(q))
      .sort((a, b) => sortValue(b, sort) - sortValue(a, sort));
  }, [signals, filter, sort, query]);
  const counts = useMemo(() => ({ buy: signals.filter(s=>s.bias==='BUY').length, sell: signals.filter(s=>s.bias==='SELL').length, watch: signals.filter(s=>s.bias==='WATCH').length, avg: Math.round(signals.reduce((sum,s)=>sum+s.score,0)/Math.max(signals.length,1)) }), [signals]);
  const earlyBuys = useMemo(() => signals.filter((s) => s.bias === 'BUY' && s.stage === 'EARLY').slice(0, 6), [signals]);

  return <main className="terminal">
    <header className="termHeader">
      <div><p className="eyebrow">satyaXBT whale intelligence terminal v0.2</p><h1>Market Intelligence</h1><p className="sub">Real-data scanner: market, futures, CVD snapshot, depth imbalance, evidence-gated alerts.</p></div>
      <div className="commandBar"><input placeholder="Search BTC, SOL, ETH..." value={query} onChange={(e)=>setQuery(e.target.value)} /><select value={sort} onChange={(e)=>setSort(e.target.value)}><option value="score">Score</option><option value="cvd">CVD 15m</option><option value="depth">Depth imbalance</option><option value="vol">Vol/MCap</option><option value="oi">Open Interest</option><option value="funding">Funding Heat</option></select><button onClick={load}>Refresh</button></div>
    </header>

    <section className="metricRail"><Kpi title="Assets" value={signals.length} tone="blue"/><Kpi title="Avg Score" value={counts.avg} tone="amber"/><Kpi title="BUY" value={counts.buy} tone="green"/><Kpi title="SELL" value={counts.sell} tone="red"/><Kpi title="WATCH" value={counts.watch} tone="amber"/></section>
    <section className="sourceStrip">{sources.map((source) => <div className={`source ${source.status.toLowerCase()}`} key={source.name}><b>{source.status}</b><span>{source.name}</span><small>{source.note}</small></div>)}</section>
    <nav className="filters">{['ALL','BUY','SELL','WATCH','EARLY','MID','LATE','RISK','AKUMULASI','DISTRIBUSI'].map(f => <button className={filter===f?'active':''} onClick={() => setFilter(f)} key={f}>{f}</button>)}</nav>

    <section className="terminalGrid">
      <ScannerTable signals={visible} selectedId={selected?.coin.id} onSelect={setSelectedId} />
      {selected && <DetailPanel signal={selected} series={series} />}
    </section>

    <section className="bottomDeck">
      <EarlyBuys signals={earlyBuys} onSelect={setSelectedId} />
      <Timeline timeline={timeline} />
      <Playbook />
    </section>
  </main>
}

function ScannerTable({ signals, selectedId, onSelect }:{signals:Signal[]; selectedId?:string; onSelect:(id:string)=>void}) {
  return <section className="scanner"><div className="tableHead"><span>Asset</span><span>Bias</span><span>Score</span><span>1H</span><span>24H</span><span>Vol/MCap</span><span>CVD 15m</span><span>Depth</span><span>OI</span><span>Funding</span></div>{signals.map((s)=><button className={`row ${s.bias.toLowerCase()} ${selectedId===s.coin.id?'selected':''}`} onClick={()=>onSelect(s.coin.id)} key={s.coin.id}><span className="asset"><img src={s.coin.image}/><b>{s.coin.symbol.toUpperCase()}</b><small>#{s.coin.market_cap_rank}</small></span><span>{s.bias}</span><span><Meter value={s.score}/></span><span className={tone(s.coin.price_change_percentage_1h_in_currency)}>{pct(s.coin.price_change_percentage_1h_in_currency)}</span><span className={tone(s.coin.price_change_percentage_24h_in_currency)}>{pct(s.coin.price_change_percentage_24h_in_currency)}</span><span>{(s.volMcap*100).toFixed(1)}%</span><span className={tone(s.marketStructure?.cvdUsd15m ?? 0)}>${compact(s.marketStructure?.cvdUsd15m ?? 0)}</span><span>{s.marketStructure ? `${s.marketStructure.depthImbalance1Pct.toFixed(2)}x` : '-'}</span><span>${compact(s.futures?.openInterestUsd ?? 0)}</span><span>{s.futures ? `${(s.futures.fundingRate*100).toFixed(4)}%` : '-'}</span></button>)}</section>
}

function DetailPanel({ signal:s, series }:{signal:Signal; series:SeriesPoint[]}) {
  return <aside className="proPanel"><div className="detailHero"><img src={s.coin.image}/><div><p>{s.coin.name} / {s.coin.symbol.toUpperCase()}</p><h2>{s.bias} · {s.signal}</h2><span>Score {s.score}/100 · {s.confidence} · {s.stage}</span></div></div><MiniCharts points={series} /><div className="detailGrid"><Box k="Price" v={`$${num(s.coin.current_price)}`}/><Box k="Market Cap" v={`$${compact(s.coin.market_cap)}`}/><Box k="Volume" v={`$${compact(s.coin.total_volume)}`}/><Box k="ATH Gap" v={pct(s.coin.ath_change_percentage)}/><Box k="CVD 15m" v={`$${compact(s.marketStructure?.cvdUsd15m ?? 0)}`}/><Box k="Buy/Sell 15m" v={`${compact(s.marketStructure?.buyUsd15m ?? 0)} / ${compact(s.marketStructure?.sellUsd15m ?? 0)}`}/><Box k="Depth 1%" v={s.marketStructure ? `${s.marketStructure.depthImbalance1Pct.toFixed(2)}x` : '-'}/><Box k="Liq 15m" v={`$${compact(s.marketStructure?.liquidationUsd15m ?? 0)}`}/></div><h3>Why This Fired</h3><ul>{s.reasons.map((r)=><li key={r}>{r}</li>)}</ul><h3>Risk / Invalidation</h3><ul>{s.warnings.length ? s.warnings.map((r)=><li key={r}>{r}</li>) : <li>No major warning from current rule engine.</li>}<li>Invalid if CVD flips negative and bid depth disappears.</li></ul><h3>Evidence</h3><div className="evidenceBox">{(s.evidence ?? []).map((e)=><p key={`${e.source}-${e.label}`}><b>{e.source}</b> · {e.label}: <em>{e.value}</em>{e.txHash ? <code>{e.txHash}</code> : null}</p>)}{!(s.evidence ?? []).some(e=>e.txHash) && <p className="muted">TxHash: N/A — market/futures signal only, no verified on-chain whale transaction yet.</p>}</div></aside>
}

function MiniCharts({ points }:{points:SeriesPoint[]}) {
  return <div className="chartDeck"><Spark title="Price" points={points.map(p=>p.price)} tone="blue"/><Spark title="Score" points={points.map(p=>p.score)} tone="green"/><Spark title="CVD" points={points.map(p=>p.cvd)} tone="amber"/></div>
}

function Spark({ title, points, tone }:{title:string; points:number[]; tone:string}) {
  const clean = points.slice(-60);
  const min = Math.min(...clean, 0);
  const max = Math.max(...clean, 1);
  const range = max - min || 1;
  const d = clean.map((value, index) => `${index === 0 ? 'M' : 'L'} ${(index / Math.max(clean.length - 1, 1)) * 100} ${38 - ((value - min) / range) * 34}`).join(' ');
  return <div className={`spark ${tone}`}><span>{title}</span><svg viewBox="0 0 100 42" preserveAspectRatio="none"><path d={d}/></svg><b>{clean.length ? compact(clean[clean.length-1]) : '-'}</b></div>
}

function EarlyBuys({ signals, onSelect }:{signals:Signal[]; onSelect:(id:string)=>void}) {
  return <section className="early"><h2>Early Buy Radar</h2>{signals.map((s)=><button key={s.coin.id} onClick={()=>onSelect(s.coin.id)}><b>{s.coin.symbol.toUpperCase()}</b><span>{s.score}/100 · {s.signal}</span><small>CVD ${compact(s.marketStructure?.cvdUsd15m ?? 0)} · Depth {s.marketStructure ? `${s.marketStructure.depthImbalance1Pct.toFixed(2)}x` : '-'}</small></button>)}</section>
}

function Timeline({ timeline }:{timeline:TimelinePoint[]}) {
  const recent = timeline.slice(-12).reverse();
  return <section className="timeline"><h2>Signal Timeline</h2>{recent.map((point)=><div className="tick" key={point.savedAt}><time>{new Date(point.savedAt).toLocaleTimeString()}</time><b>Avg {point.avgScore}</b><span>{point.buy} BUY · {point.sell} SELL · {point.watch} WATCH</span><small>{point.top.slice(0,3).map(t=>`${t.symbol} ${t.score}`).join(' / ')}</small></div>)}</section>
}

function Playbook(){return <aside className="playbook"><h2>Pro Playbook</h2><p><b>Accumulation:</b> positive CVD, rising bid depth, neutral funding, price not extended.</p><p><b>Distribution:</b> red 1H with high volume, negative CVD, ask depth dominates.</p><p><b>No-halu rule:</b> on-chain whale claims require tx hash and explorer evidence.</p></aside>}
function Kpi({ title, value, tone }:{title:string; value:number; tone:string}){return <div className={`kpi ${tone}`}><span>{title}</span><b>{value}</b></div>}
function Box({ k, v }:{k:string; v:string}){return <span><small>{k}</small><em>{v}</em></span>}
function Meter({ value }:{value:number}){return <i className="meter"><b style={{width:`${value}%`}}/><em>{value}</em></i>}
function sortValue(s:Signal, sort:string){ if(sort==='cvd') return s.marketStructure?.cvdUsd15m ?? 0; if(sort==='depth') return s.marketStructure?.depthImbalance1Pct ?? 0; if(sort==='vol') return s.volMcap; if(sort==='oi') return s.futures?.openInterestUsd ?? 0; if(sort==='funding') return Math.abs(s.futures?.fundingRate ?? 0); return s.score; }
function pct(v:number | null | undefined){return `${Number(v??0).toFixed(2)}%`}
function num(v:number){return Number(v ?? 0).toLocaleString('en-US')}
function compact(v:number){ const n = Number(v ?? 0); const sign = n < 0 ? '-' : ''; const a = Math.abs(n); if (a > 1e12) return `${sign}${(a/1e12).toFixed(2)}T`; if (a > 1e9) return `${sign}${(a/1e9).toFixed(2)}B`; if (a > 1e6) return `${sign}${(a/1e6).toFixed(1)}M`; if (a > 1e3) return `${sign}${(a/1e3).toFixed(1)}K`; return `${sign}${a.toFixed(0)}`; }
function tone(v:number | null | undefined){ return Number(v ?? 0) >= 0 ? 'pos' : 'neg'; }

createRoot(document.getElementById('root')!).render(<App />);
