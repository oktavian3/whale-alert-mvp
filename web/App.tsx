import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type Bias = 'BUY' | 'SELL' | 'WATCH';
type Signal = {
  coin: { id:string; symbol:string; name:string; image:string; current_price:number; market_cap:number; market_cap_rank:number; total_volume:number; price_change_percentage_1h_in_currency:number; price_change_percentage_24h_in_currency:number; price_change_percentage_7d_in_currency:number; ath_change_percentage:number };
  bias: Bias; signal:string; score:number; stage:string; confidence:string; volMcap:number; reasons:string[]; warnings:string[]; updatedAt:string;
  futures?: { symbol:string; fundingRate:number; openInterestUsd:number; source:string };
};

function App() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [sort, setSort] = useState('score');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Signal | null>(null);

  async function load() {
    const res = await fetch('/api/signals');
    const data = await res.json();
    setSignals(data.signals ?? []);
  }

  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id); }, []);

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return signals
      .filter((s) => filter === 'ALL' || s.bias === filter || s.stage === filter || s.signal.toUpperCase().includes(filter))
      .filter((s) => !q || s.coin.symbol.toLowerCase().includes(q) || s.coin.name.toLowerCase().includes(q))
      .sort((a, b) => sortValue(b, sort) - sortValue(a, sort));
  }, [signals, filter, sort, query]);

  const counts = useMemo(() => ({
    buy: signals.filter(s => s.bias === 'BUY').length,
    sell: signals.filter(s => s.bias === 'SELL').length,
    watch: signals.filter(s => s.bias === 'WATCH').length,
    avg: Math.round(signals.reduce((sum, s) => sum + s.score, 0) / Math.max(signals.length, 1)),
  }), [signals]);

  return <main>
    <header className="hero">
      <div><p className="eyebrow">satyaXBT whale intelligence terminal</p><h1>Whale Alert Signals</h1><p className="sub">Top 50 CMC-style universe · CoinGecko market feed · Binance futures context · rule-based early MVP.</p></div>
      <div className="heroCard"><strong>{signals.length}</strong><span>tracked assets</span><strong>{counts.avg}</strong><span>avg score</span></div>
    </header>

    <section className="toolbar">
      <input placeholder="Search BTC, SOL, ETH..." value={query} onChange={(e) => setQuery(e.target.value)} />
      <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="score">Highest Score</option><option value="vol">Vol/MCap</option><option value="h1">1H Move</option><option value="h24">24H Move</option><option value="oi">Open Interest</option><option value="funding">Funding Heat</option></select>
      <button onClick={load}>Refresh</button>
    </section>

    <section className="kpis"><Kpi title="BUY" value={counts.buy} tone="green"/><Kpi title="SELL" value={counts.sell} tone="red"/><Kpi title="WATCH" value={counts.watch} tone="amber"/><Kpi title="High Vol/MCap" value={signals.filter(s=>s.volMcap>.2).length} tone="blue"/></section>

    <nav className="filters">{['ALL','BUY','SELL','WATCH','EARLY','MID','LATE','RISK','AKUMULASI','DISTRIBUSI'].map(f => <button className={filter===f?'active':''} onClick={() => setFilter(f)}>{f}</button>)}</nav>

    <section className="layout">
      <div className="grid">{visible.map((s) => <SignalCard signal={s} onClick={() => setSelected(s)} key={s.coin.id} />)}</div>
      <aside className="sidePanel"><h2>Live Playbook</h2><Playbook title="Accumulation" items={['Vol/MCap abnormal', '24H positive + 1H not dumping', 'Funding neutral', '7D not extended']} /><Playbook title="Distribution" items={['High volume into red 1H', '7D extended', 'Funding hot', 'OI high but price fades']} /><Playbook title="Next modules" items={['CVD websocket', 'Order book depth', 'Liquidation clusters', 'Wallet tracker']} /></aside>
    </section>

    {selected && <Detail signal={selected} onClose={() => setSelected(null)} />}
  </main>
}

function SignalCard({ signal:s, onClick }:{ signal:Signal; onClick:()=>void }) {
  return <article className={`card ${s.bias.toLowerCase()}`} onClick={onClick}>
    <div className="top"><img src={s.coin.image}/><div><h2>{s.coin.name}</h2><span>{s.coin.symbol.toUpperCase()} #{s.coin.market_cap_rank}</span></div><b>{s.bias}</b></div>
    <p className="signal">{s.signal}</p><div className="bar"><i style={{width:`${s.score}%`}} /></div><p>Score {s.score}/100 · {s.confidence} · {s.stage}</p>
    <div className="stats"><span>1H <em className={tone(s.coin.price_change_percentage_1h_in_currency)}>{pct(s.coin.price_change_percentage_1h_in_currency)}</em></span><span>24H <em className={tone(s.coin.price_change_percentage_24h_in_currency)}>{pct(s.coin.price_change_percentage_24h_in_currency)}</em></span><span>7D <em className={tone(s.coin.price_change_percentage_7d_in_currency)}>{pct(s.coin.price_change_percentage_7d_in_currency)}</em></span><span>VOL/MCAP <em>{(s.volMcap*100).toFixed(1)}%</em></span></div>
    <div className="tags">{[...s.reasons, ...s.warnings].slice(0,4).map((r) => <small>{r}</small>)}</div>
  </article>
}

function Detail({ signal:s, onClose }:{ signal:Signal; onClose:()=>void }) {
  return <aside className="drawer"><button onClick={onClose}>Close</button><h2>{s.coin.name} Detail</h2>
    <div className="detailHero"><img src={s.coin.image}/><div><b>{s.bias} · {s.signal}</b><p>Score {s.score}/100 · {s.confidence} · {s.stage}</p></div></div>
    <div className="detailGrid"><span>Price <em>${num(s.coin.current_price)}</em></span><span>Market Cap <em>${compact(s.coin.market_cap)}</em></span><span>Volume <em>${compact(s.coin.total_volume)}</em></span><span>ATH Gap <em>{pct(s.coin.ath_change_percentage)}</em></span><span>Funding <em>{s.futures ? `${(s.futures.fundingRate*100).toFixed(4)}%` : '-'}</em></span><span>Open Interest <em>${compact(s.futures?.openInterestUsd ?? 0)}</em></span></div>
    <h3>Signal Thesis</h3><ul>{s.reasons.map((r) => <li>{r}</li>)}</ul>
    <h3>Risk / Invalidation</h3><ul>{s.warnings.length ? s.warnings.map((r) => <li>{r}</li>) : <li>No major warning from current rule engine.</li>}<li>Invalid if CVD flips negative + bid depth disappears once order-flow module is active.</li></ul>
    <h3>Module Status</h3><div className="moduleGrid"><span className="on">Market data live</span><span className="on">Funding/OI partial</span><span>CVD next</span><span>Liquidation next</span><span>Wallet tracker next</span><span>Social ignition next</span></div>
  </aside>
}

function Kpi({ title, value, tone }:{title:string; value:number; tone:string}){return <div className={`kpi ${tone}`}><span>{title}</span><b>{value}</b></div>}
function Playbook({ title, items }:{title:string; items:string[]}){return <div className="play"><h3>{title}</h3>{items.map(i=><p>{i}</p>)}</div>}
function sortValue(s:Signal, sort:string){ if(sort==='vol') return s.volMcap; if(sort==='h1') return s.coin.price_change_percentage_1h_in_currency ?? 0; if(sort==='h24') return s.coin.price_change_percentage_24h_in_currency ?? 0; if(sort==='oi') return s.futures?.openInterestUsd ?? 0; if(sort==='funding') return Math.abs(s.futures?.fundingRate ?? 0); return s.score; }
function pct(v:number){return `${Number(v??0).toFixed(2)}%`}
function num(v:number){return Number(v ?? 0).toLocaleString('en-US')}
function compact(v:number){ const n = Number(v ?? 0); if (n > 1e12) return `${(n/1e12).toFixed(2)}T`; if (n > 1e9) return `${(n/1e9).toFixed(2)}B`; if (n > 1e6) return `${(n/1e6).toFixed(1)}M`; return n.toFixed(0); }
function tone(v:number){ return Number(v ?? 0) >= 0 ? 'pos' : 'neg'; }

createRoot(document.getElementById('root')!).render(<App />);
