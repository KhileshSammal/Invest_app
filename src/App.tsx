import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon, 
  BarChart3, 
  ShieldAlert, 
  Search, 
  ChevronRight,
  Info,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { allAssets as initialAssets, getStats, USD_INR } from './data';
import { Asset, Segment, Verdict } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Sync Component ---
const SyncButton = ({ onSync, isSyncing }: { onSync: () => void, isSyncing: boolean }) => (
  <button
    onClick={onSync}
    disabled={isSyncing}
    className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider",
      isSyncing 
        ? "bg-white/5 border-white/10 text-dim cursor-not-allowed" 
        : "bg-accent/10 border-accent/20 text-accent hover:bg-accent/20"
    )}
  >
    <motion.div
      animate={isSyncing ? { rotate: 360 } : {}}
      transition={isSyncing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
    >
      <Search className="w-3 h-3" />
    </motion.div>
    {isSyncing ? 'Syncing...' : 'Sync Real-time Data'}
  </button>
);

// --- Helper Functions ---
const fmtINR = (n: number) => '₹' + (n / 1000).toFixed(0) + 'K';
const fmtLakh = (n: number) => '₹' + (n / 100000).toFixed(2) + 'L';
const getScoreColor = (v: number) => v >= 8 ? 'text-green-custom' : v >= 6 ? 'text-amber-custom' : 'text-red-custom';
const getScoreBg = (v: number) => v >= 8 ? 'bg-green-custom' : v >= 6 ? 'bg-amber-custom' : 'bg-red-custom';
const getRiskColor = (v: number) => v >= 7 ? 'text-red-custom' : v >= 5 ? 'text-amber-custom' : 'text-green-custom';
const getRiskBg = (v: number) => v >= 7 ? 'bg-red-custom' : v >= 5 ? 'bg-amber-custom' : 'bg-green-custom';
const getTotalScore = (s: Asset['scores']) => {
  const v = Object.values(s);
  return (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1);
};

// --- Components ---

const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider", className)}>
    {children}
  </span>
);

const VerdictBadge = ({ verdict, vclass }: { verdict: string; vclass: string }) => {
  const styles: Record<string, string> = {
    'v-strong': 'bg-green-500/15 text-green-400',
    'v-buy': 'bg-blue-500/15 text-blue-400',
    'v-hold': 'bg-amber-500/15 text-amber-400',
    'v-reduce': 'bg-red-500/15 text-red-400',
    'v-exit': 'bg-red-500/25 text-red-400',
    'v-spec': 'bg-accent/15 text-accent',
  };
  return (
    <span className={cn("text-[10px] font-bold px-2 py-1 rounded tracking-tight uppercase", styles[vclass] || 'bg-white/5 text-muted')}>
      {verdict}
    </span>
  );
};

const MiniTrend = ({ data, color }: { data: number[], color: string }) => {
  const chartData = data.map((v, i) => ({ value: v, index: i }));
  return (
    <div className="w-16 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const SectionHeader = ({ title, count }: { title: string; count?: string | number }) => (
  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 my-6 sm:my-8">
    <h2 className="font-serif text-xl sm:text-2xl text-text">{title}</h2>
    <div className="hidden sm:block flex-1 h-px bg-border" />
    {count !== undefined && <span className="font-mono text-[10px] sm:text-xs text-dim">{count}</span>}
  </div>
);

const DonutChart = ({ 
  data, 
  title, 
  centerLabel, 
  centerValue, 
  colors, 
  formatter 
}: { 
  data: any[]; 
  title: string; 
  centerLabel: string; 
  centerValue: string; 
  colors: string[]; 
  formatter: (v: number) => string;
}) => (
  <div className="bg-bg2 border border-border rounded-xl p-4 flex flex-col">
    <div className="text-[10px] font-bold text-dim uppercase tracking-widest mb-4">{title}</div>
    <div className="h-[220px] relative">
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-[10px] text-muted uppercase tracking-tighter">{centerLabel}</div>
        <div className="text-sm font-mono font-bold text-text">{centerValue}</div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie 
            data={data} 
            innerRadius={65} 
            outerRadius={85} 
            paddingAngle={4} 
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
            itemStyle={{ color: '#e8e6f0', fontSize: '11px' }}
            formatter={(value: number) => [formatter(value), 'Value']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
      {data.slice(0, 6).map((entry, index) => (
        <div key={entry.name} className="flex items-center gap-1.5 overflow-hidden">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.color || colors[index % colors.length] }} />
          <div className="text-[9px] text-muted truncate">{entry.name}</div>
          <div className="text-[9px] font-mono text-dim ml-auto">
            {((entry.value / data.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(0)}%
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- Pages ---

const Overview = ({ assets }: { assets: Asset[] }) => {
  const stats = useMemo(() => {
    const inInv = assets.filter(a => a.seg === 'IN').reduce((s, a) => s + a.inv, 0);
    const inCurr = assets.filter(a => a.seg === 'IN').reduce((s, a) => s + a.curr, 0);
    const usInv = assets.filter(a => a.seg === 'US').reduce((s, a) => s + a.inv, 0);
    const usCurr = assets.filter(a => a.seg === 'US').reduce((s, a) => s + a.curr, 0);
    const mfInv = assets.filter(a => a.seg === 'MF').reduce((s, a) => s + a.inv, 0);
    const mfCurr = assets.filter(a => a.seg === 'MF').reduce((s, a) => s + a.curr, 0);

    const usInvINR = usInv * USD_INR;
    const usCurrINR = usCurr * USD_INR;

    const totalInv = inInv + usInvINR + mfInv;
    const totalCurr = inCurr + usCurrINR + mfCurr;
    const totalPL = totalCurr - totalInv;
    const totalRet = totalInv > 0 ? (totalPL / totalInv) * 100 : 0;

    return {
      inInv, inCurr,
      usInv, usCurr,
      mfInv, mfCurr,
      totalInv, totalCurr, totalPL, totalRet
    };
  }, [assets]);

  const [sortBy, setSortBy] = useState<'value' | 'pl' | 'ret' | 'none'>('none');

  const sortedAssets = useMemo(() => {
    if (sortBy === 'none') return assets;
    return [...assets].sort((a, b) => {
      if (sortBy === 'value') return b.curr - a.curr;
      if (sortBy === 'pl') return (b.curr - b.inv) - (a.curr - a.inv);
      if (sortBy === 'ret') return b.ret - a.ret;
      return 0;
    });
  }, [sortBy, assets]);
  
  const allocationData = [
    { name: 'Indian Stocks', value: stats.inCurr, color: '#63b3ed' },
    { name: 'US Portfolio', value: stats.usCurr * USD_INR, color: '#b794f4' },
    { name: 'Mutual Funds', value: stats.mfCurr, color: '#f6ad55' },
  ];

  const inSectors = useMemo(() => {
    const sectors: Record<string, number> = {};
    assets.filter(a => a.seg === 'IN').forEach(a => {
      sectors[a.cat] = (sectors[a.cat] || 0) + a.curr;
    });
    return Object.entries(sectors).map(([name, value]) => ({ name, value }));
  }, [assets]);

  const usSectors = useMemo(() => {
    const sectors: Record<string, number> = {};
    assets.filter(a => a.seg === 'US').forEach(a => {
      sectors[a.cat] = (sectors[a.cat] || 0) + a.curr;
    });
    return Object.entries(sectors).map(([name, value]) => ({ name, value }));
  }, [assets]);

  const COLORS = ['#63b3ed', '#48bb78', '#f6ad55', '#f56565', '#b794f4', '#5ee7b0', '#fc8181', '#fbd38d', '#90cdf4'];

  return (
    <div className="space-y-8">
      {/* Macro Banner */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-accent/10 to-accent2/5 border border-accent/20">
        <div className="border-l-2 border-accent/30 pl-3">
          <div className="text-[9px] sm:text-[10px] text-dim uppercase tracking-wider mb-1">Nifty 50</div>
          <div className="text-base sm:text-lg font-mono font-medium text-red-custom">23,151 ▼</div>
          <div className="text-[9px] sm:text-[10px] text-muted line-clamp-1 sm:line-clamp-none">Bearish — 11-month low. RSI oversold.</div>
        </div>
        <div className="border-l-2 border-accent/30 pl-3">
          <div className="text-[9px] sm:text-[10px] text-dim uppercase tracking-wider mb-1">Crude Oil</div>
          <div className="text-base sm:text-lg font-mono font-medium text-red-custom">$102.77</div>
          <div className="text-[9px] sm:text-[10px] text-muted line-clamp-1 sm:line-clamp-none">Above $100 — West Asia tensions</div>
        </div>
        <div className="border-l-2 border-accent/30 pl-3">
          <div className="text-[9px] sm:text-[10px] text-dim uppercase tracking-wider mb-1">USD/INR</div>
          <div className="text-base sm:text-lg font-mono font-medium text-amber-custom">₹92.56</div>
          <div className="text-[9px] sm:text-[10px] text-muted line-clamp-1 sm:line-clamp-none">Dollar strength — FII outflow pressure</div>
        </div>
        <div className="border-l-2 border-accent/30 pl-3">
          <div className="text-[9px] sm:text-[10px] text-dim uppercase tracking-wider mb-1">Market Outlook</div>
          <div className="text-base sm:text-lg font-mono font-medium text-amber-custom">H2 2026 rally</div>
          <div className="text-[9px] sm:text-[10px] text-muted line-clamp-1 sm:line-clamp-none">J.P. Morgan: Sensex 90K–1.07L by Dec</div>
        </div>
      </div>

      {/* Hero Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-border border border-border rounded-xl overflow-hidden">
        <div className="bg-bg2 p-4 sm:p-5 col-span-2 sm:col-span-1">
          <div className="text-[10px] sm:text-[11px] text-muted uppercase tracking-widest mb-1.5">Total Portfolio</div>
          <div className="text-xl sm:text-2xl font-mono font-semibold">{fmtLakh(stats.totalCurr)}</div>
          <div className="text-[10px] sm:text-[11px] text-muted mt-1">Estimated current value</div>
        </div>
        <div className="bg-bg2 p-4 sm:p-5">
          <div className="text-[10px] sm:text-[11px] text-muted uppercase tracking-widest mb-1.5">Overall P&L</div>
          <div className={cn("text-xl sm:text-2xl font-mono font-semibold", stats.totalRet >= 0 ? "text-green-custom" : "text-red-custom")}>
            {stats.totalPL >= 0 ? '+' : '-'}{fmtLakh(Math.abs(stats.totalPL))}
          </div>
          <div className="text-[10px] sm:text-[11px] text-muted mt-1">{stats.totalRet >= 0 ? '+' : ''}{stats.totalRet.toFixed(2)}% overall return</div>
        </div>
        <div className="bg-bg2 p-4 sm:p-5">
          <div className="text-[10px] sm:text-[11px] text-muted uppercase tracking-widest mb-1.5">Indian Stocks</div>
          <div className="text-xl sm:text-2xl font-mono font-semibold">{fmtINR(stats.inCurr)}</div>
          <div className="text-[10px] sm:text-[11px] text-muted mt-1">{stats.inInv > 0 ? ((stats.inCurr - stats.inInv) / stats.inInv * 100).toFixed(1) : '0'}% return · {assets.filter(a => a.seg === 'IN').length} stocks</div>
        </div>
        <div className="bg-bg2 p-4 sm:p-5">
          <div className="text-[10px] sm:text-[11px] text-muted uppercase tracking-widest mb-1.5">US Portfolio</div>
          <div className="text-xl sm:text-2xl font-mono font-semibold">${stats.usCurr.toFixed(0)}</div>
          <div className="text-[10px] sm:text-[11px] text-muted mt-1">{stats.usInv > 0 ? ((stats.usCurr - stats.usInv) / stats.usInv * 100).toFixed(1) : '0'}% return · {assets.filter(a => a.seg === 'US').length} holdings</div>
        </div>
        <div className="bg-bg2 p-4 sm:p-5">
          <div className="text-[10px] sm:text-[11px] text-muted uppercase tracking-widest mb-1.5">Mutual Funds</div>
          <div className="text-xl sm:text-2xl font-mono font-semibold">{fmtINR(stats.mfCurr)}</div>
          <div className="text-[10px] sm:text-[11px] text-muted mt-1">{stats.mfInv > 0 ? ((stats.mfCurr - stats.mfInv) / stats.mfInv * 100).toFixed(1) : '0'}% return · {assets.filter(a => a.seg === 'MF').length} funds</div>
        </div>
      </div>

      <SectionHeader title="Portfolio Composition" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DonutChart 
          title="Allocation by Segment"
          data={allocationData}
          centerLabel="Total Value"
          centerValue={fmtLakh(stats.totalCurr)}
          colors={['#63b3ed', '#b794f4', '#f6ad55']}
          formatter={fmtINR}
        />
        <DonutChart 
          title="Indian Stocks — Sector Mix"
          data={inSectors.sort((a, b) => b.value - a.value)}
          centerLabel="Indian Equity"
          centerValue={fmtINR(stats.inCurr)}
          colors={COLORS}
          formatter={fmtINR}
        />
        <DonutChart 
          title="US Portfolio — Sector Mix"
          data={usSectors.sort((a, b) => b.value - a.value)}
          centerLabel="US Equity"
          centerValue={`$${stats.usCurr.toFixed(0)}`}
          colors={COLORS}
          formatter={(v) => `$${v.toFixed(0)}`}
        />
      </div>

      <SectionHeader title="All Holdings at a Glance" count={`${assets.length} total holdings`} />
      <div className="overflow-x-auto border border-border rounded-xl bg-bg2">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-bg3">
              <th className="p-2 sm:p-3 font-semibold uppercase tracking-wider text-muted border-bottom border-border">Name</th>
              <th className="hidden sm:table-cell p-3 font-semibold uppercase tracking-wider text-muted border-bottom border-border">Segment</th>
              <th className="hidden md:table-cell p-3 font-semibold uppercase tracking-wider text-muted border-bottom border-border text-right">Invested</th>
              <th 
                className={cn("p-2 sm:p-3 font-semibold uppercase tracking-wider text-muted border-bottom border-border text-right cursor-pointer hover:text-text transition-colors", sortBy === 'value' && "text-accent")}
                onClick={() => setSortBy(sortBy === 'value' ? 'none' : 'value')}
              >
                Value {sortBy === 'value' && '▼'}
              </th>
              <th 
                className={cn("p-2 sm:p-3 font-semibold uppercase tracking-wider text-muted border-bottom border-border text-right cursor-pointer hover:text-text transition-colors", sortBy === 'pl' && "text-accent")}
                onClick={() => setSortBy(sortBy === 'pl' ? 'none' : 'pl')}
              >
                P&L {sortBy === 'pl' && '▼'}
              </th>
              <th className={cn("p-2 sm:p-3 font-semibold uppercase tracking-wider text-muted border-bottom border-border text-right cursor-pointer hover:text-text transition-colors", sortBy === 'ret' && "text-accent")}
                onClick={() => setSortBy(sortBy === 'ret' ? 'none' : 'ret')}
              >
                Return {sortBy === 'ret' && '▼'}
              </th>
              <th className="hidden sm:table-cell p-3 font-semibold uppercase tracking-wider text-muted border-bottom border-border text-center">Trend</th>
              <th className="p-2 sm:p-3 font-semibold uppercase tracking-wider text-muted border-bottom border-border">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {sortedAssets.map((a, i) => {
              const plAmt = a.curr - a.inv;
              const isPositive = a.ret >= 0;
              return (
                <tr key={a.ticker} className="hover:bg-white/[0.02] border-b border-border last:border-0">
                  <td className="p-2 sm:p-3">
                    <div className="font-bold text-text text-[11px] sm:text-xs">{a.ticker}</div>
                    <div className="text-[9px] sm:text-[10px] text-muted line-clamp-1">{a.name}</div>
                  </td>
                  <td className="hidden sm:table-cell p-3">
                    <Badge className={cn(
                      a.seg === 'IN' ? 'bg-blue-500/10 text-blue-400' :
                      a.seg === 'US' ? 'bg-accent/10 text-accent' :
                      'bg-amber-500/10 text-amber-400'
                    )}>{a.seg}</Badge>
                    <div className="text-[10px] text-dim mt-1">{a.cat}</div>
                  </td>
                  <td className="hidden md:table-cell p-3 text-right font-mono">
                    {a.seg === 'US' ? `$${a.inv.toFixed(0)}` : fmtINR(a.inv)}
                  </td>
                  <td className="p-2 sm:p-3 text-right font-mono text-[11px] sm:text-xs">
                    {a.seg === 'US' ? `$${a.curr.toFixed(0)}` : fmtINR(a.curr)}
                  </td>
                  <td className={cn("p-2 sm:p-3 text-right font-mono text-[11px] sm:text-xs", isPositive ? "text-green-custom" : "text-red-custom")}>
                    {plAmt >= 0 ? '+' : '-'}{a.seg === 'US' ? '$' : '₹'}{Math.abs(a.seg === 'US' ? plAmt : plAmt / 1000).toFixed(a.seg === 'US' ? 0 : 1)}{a.seg !== 'US' ? 'K' : ''}
                  </td>
                  <td className={cn("p-2 sm:p-3 text-right font-mono text-[11px] sm:text-xs", isPositive ? "text-green-custom" : "text-red-custom")}>
                    {isPositive ? '+' : ''}{a.ret.toFixed(1)}%
                  </td>
                  <td className="hidden sm:table-cell p-3">
                    <div className="flex justify-center">
                      <MiniTrend data={a.trend} color={isPositive ? '#5ee7b0' : '#fc8181'} />
                    </div>
                  </td>
                  <td className="p-2 sm:p-3">
                    <VerdictBadge verdict={a.verdict} vclass={a.vclass} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Scores = ({ assets }: { assets: Asset[] }) => {
  const [filter, setFilter] = useState<Segment | 'all'>('all');
  const filtered = useMemo(() => filter === 'all' ? assets : assets.filter(a => a.seg === filter), [filter, assets]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Long-term Scores" count="5–7 year horizon · scored 1–10 across 6 dimensions" />
      
      <div className="flex gap-2 flex-wrap mb-4">
        {['all', 'IN', 'US', 'MF'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={cn(
              "px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all",
              filter === f 
                ? "bg-accent/20 border-accent text-accent" 
                : "bg-transparent border-border text-muted hover:text-text hover:border-border2"
            )}
          >
            {f === 'all' ? 'All' : f === 'IN' ? 'Indian Stocks' : f === 'US' ? 'US Stocks' : 'Mutual Funds'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((a) => {
          const tot = getTotalScore(a.scores);
          const totColor = parseFloat(tot) >= 7.5 ? 'text-green-custom' : parseFloat(tot) >= 6 ? 'text-amber-custom' : 'text-red-custom';
          
          return (
            <motion.div 
              layout
              key={a.ticker} 
              className="bg-bg2 border border-border rounded-xl p-4 hover:border-border2 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-mono text-sm font-medium text-text flex items-center gap-2">
                    {a.ticker}
                    <Badge className={cn(
                      a.seg === 'IN' ? 'bg-blue-500/10 text-blue-400' :
                      a.seg === 'US' ? 'bg-accent/10 text-accent' :
                      'bg-amber-500/10 text-amber-400'
                    )}>{a.seg}</Badge>
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">{a.name}</div>
                </div>
                <div className={cn("font-mono text-lg font-medium", totColor)}>{tot}</div>
              </div>

              <div className="space-y-1.5">
                {Object.entries(a.scores).map(([k, v]) => {
                  const val = v as number;
                  return (
                    <div key={k} className="flex items-center gap-2">
                      <div className="text-[10px] text-muted w-16 shrink-0 capitalize">{k}</div>
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-500", getScoreBg(val))} 
                          style={{ width: `${val * 10}%` }} 
                        />
                      </div>
                      <div className={cn("text-[10px] font-mono w-4 text-right", getScoreColor(val))}>{val}</div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className={cn("font-mono text-xs", a.ret >= 0 ? "text-green-custom" : "text-red-custom")}>
                  {a.ret >= 0 ? '+' : ''}{a.ret.toFixed(2)}% return
                </span>
                <VerdictBadge verdict={a.verdict} vclass={a.vclass} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const Fundamentals = ({ assets }: { assets: Asset[] }) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Asset | null, direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'desc'
  });

  const parseValue = (val: any, key: string) => {
    if (key === 'mktCap') {
      if (!val || val === 'N/A') return -1;
      const cleanVal = val.replace(/[₹$,]/g, '').replace(/,/g, '');
      let num = parseFloat(cleanVal);
      if (val.includes('L Cr')) return num * 1e12;
      if (val.includes('Cr')) return num * 1e7;
      if (val.includes('T')) return num * 1e12;
      if (val.includes('B')) return num * 1e9;
      if (val.includes('M')) return num * 1e6;
      return num;
    }
    if (key === 'promoter') {
      if (!val || val === 'N/A') return -1;
      return parseFloat(val.replace('%', '')) || 0;
    }
    if (key === 'debt') {
      const debtMap: Record<string, number> = { 'Zero': 0, 'Low': 1, 'Medium': 2, 'High': 3 };
      return debtMap[val] ?? 0;
    }
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? -1 : parsed;
    }
    return -1;
  };

  const sortedAssets = useMemo(() => {
    if (!sortConfig.key) return assets;

    return [...assets].sort((a, b) => {
      const aVal = parseValue(a[sortConfig.key as keyof Asset], sortConfig.key as string);
      const bVal = parseValue(b[sortConfig.key as keyof Asset], sortConfig.key as string);

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [assets, sortConfig]);

  const requestSort = (key: keyof Asset) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: keyof Asset }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline" /> : <ArrowDown className="w-3 h-3 ml-1 inline" />;
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Key Fundamentals" />
      <div className="overflow-x-auto border border-border rounded-xl bg-bg2">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-bg3">
              <th className="p-2 sm:p-3 font-semibold uppercase tracking-wider text-muted border-b border-border">Name</th>
              <th className="hidden sm:table-cell p-3 font-semibold uppercase tracking-wider text-muted border-b border-border">Seg</th>
              <th 
                className="p-2 sm:p-3 font-semibold uppercase tracking-wider text-muted border-b border-border text-right cursor-pointer hover:text-text transition-colors"
                onClick={() => requestSort('mktCap')}
              >
                Mkt Cap <SortIcon column="mktCap" />
              </th>
              <th 
                className="p-2 sm:p-3 font-semibold uppercase tracking-wider text-muted border-b border-border text-right cursor-pointer hover:text-text transition-colors"
                onClick={() => requestSort('pe')}
              >
                P/E <SortIcon column="pe" />
              </th>
              <th 
                className="p-2 sm:p-3 font-semibold uppercase tracking-wider text-muted border-b border-border text-right cursor-pointer hover:text-text transition-colors"
                onClick={() => requestSort('roe')}
              >
                ROE <SortIcon column="roe" />
              </th>
              <th 
                className="hidden md:table-cell p-3 font-semibold uppercase tracking-wider text-muted border-b border-border text-right cursor-pointer hover:text-text transition-colors"
                onClick={() => requestSort('cagr5')}
              >
                CAGR 5Y <SortIcon column="cagr5" />
              </th>
              <th 
                className="hidden lg:table-cell p-3 font-semibold uppercase tracking-wider text-muted border-b border-border text-right cursor-pointer hover:text-text transition-colors"
                onClick={() => requestSort('debt')}
              >
                Debt <SortIcon column="debt" />
              </th>
              <th 
                className="hidden lg:table-cell p-3 font-semibold uppercase tracking-wider text-muted border-b border-border text-right cursor-pointer hover:text-text transition-colors"
                onClick={() => requestSort('promoter')}
              >
                Promoter <SortIcon column="promoter" />
              </th>
              <th className="hidden sm:table-cell p-3 font-semibold uppercase tracking-wider text-muted border-b border-border">Notes</th>
            </tr>
          </thead>
          <tbody>
            {sortedAssets.map((a) => {
              const roeVal = typeof a.roe === 'number' ? a.roe : null;
              const roeCls = roeVal === null ? '' : (roeVal >= 25 ? 'text-green-custom' : roeVal >= 12 ? 'text-amber-custom' : 'text-red-custom');
              const cagrVal = typeof a.cagr5 === 'number' ? a.cagr5 : null;
              const cagrCls = cagrVal === null ? '' : (cagrVal >= 18 ? 'text-green-custom' : cagrVal >= 10 ? 'text-amber-custom' : 'text-red-custom');
              const peVal = typeof a.pe === 'number' ? a.pe : null;
              const peCls = peVal === null ? '' : (peVal <= 25 ? 'text-green-custom' : peVal <= 50 ? 'text-amber-custom' : 'text-red-custom');
              
              return (
                <tr key={a.ticker} className="hover:bg-white/[0.02] border-b border-border last:border-0">
                  <td className="p-2 sm:p-3">
                    <div className="font-bold text-text text-[11px] sm:text-xs">{a.ticker}</div>
                    <div className="text-[9px] sm:text-[10px] text-muted line-clamp-1">{a.name}</div>
                  </td>
                  <td className="hidden sm:table-cell p-3">
                    <Badge className={cn(
                      a.seg === 'IN' ? 'bg-blue-500/10 text-blue-400' :
                      a.seg === 'US' ? 'bg-accent/10 text-accent' :
                      'bg-amber-500/10 text-amber-400'
                    )}>{a.seg}</Badge>
                  </td>
                  <td className="p-2 sm:p-3 text-right font-mono text-[10px] sm:text-[11px]">{a.mktCap}</td>
                  <td className={cn("p-2 sm:p-3 text-right font-mono text-[10px] sm:text-[11px]", peCls)}>{a.pe === 'N/A' ? '—' : a.pe + 'x'}</td>
                  <td className={cn("p-2 sm:p-3 text-right font-mono text-[10px] sm:text-[11px]", roeCls)}>{a.roe === 'N/A' ? '—' : typeof a.roe === 'number' ? a.roe + '%' : a.roe}</td>
                  <td className={cn("hidden md:table-cell p-3 text-right font-mono text-[11px]", cagrCls)}>{typeof a.cagr5 === 'number' ? a.cagr5 + '%' : a.cagr5}</td>
                  <td className="hidden lg:table-cell p-3 text-right text-[11px]">{a.debt}</td>
                  <td className="hidden lg:table-cell p-3 text-right text-[11px]">{a.promoter}</td>
                  <td className="hidden sm:table-cell p-3 text-[10px] sm:text-[11px] text-muted max-w-[200px] leading-relaxed line-clamp-2">
                    {a.news.split('.')[0]}.
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Verdicts = ({ assets }: { assets: Asset[] }) => {
  const groups = [
    { label: 'STRONG BUY', cls: 'border-green-500/20 text-green-400 bg-green-500/5', icon: '▲▲', keys: ['v-strong'] },
    { label: 'BUY', cls: 'border-blue-500/20 text-blue-400 bg-blue-500/5', icon: '▲', keys: ['v-buy'] },
    { label: 'HOLD / CORE', cls: 'border-amber-500/20 text-amber-400 bg-amber-500/5', icon: '●', keys: ['v-hold'] },
    { label: 'REDUCE / EXIT / REVIEW', cls: 'border-red-500/20 text-red-400 bg-red-500/5', icon: '▼', keys: ['v-exit', 'v-reduce'] },
    { label: 'SPECULATIVE', cls: 'border-accent/20 text-accent bg-accent/5', icon: '◆', keys: ['v-spec'] },
  ];

  return (
    <div className="space-y-10">
      <SectionHeader title="Buy / Hold / Exit + News Catalyst" />
      {groups.map((g) => {
        const groupAssets = assets.filter(a => g.keys.includes(a.vclass));
        if (!groupAssets.length) return null;
        
        return (
          <div key={g.label} className="space-y-4">
            <div className={cn("inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-lg border", g.cls)}>
              <span>{g.icon}</span>
              <span>{g.label}</span>
              <span className="opacity-60">({groupAssets.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupAssets.map((a) => (
                <div key={a.ticker} className="bg-bg2 border border-border rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm flex items-center gap-2">
                        {a.ticker}
                        <Badge className={cn(
                          a.seg === 'IN' ? 'bg-blue-500/10 text-blue-400' :
                          a.seg === 'US' ? 'bg-accent/10 text-accent' :
                          'bg-amber-500/10 text-amber-400'
                        )}>{a.seg}</Badge>
                      </div>
                      <div className="text-[10px] text-muted mt-0.5">{a.name} · {a.cat}</div>
                    </div>
                    <VerdictBadge verdict={a.verdict} vclass={a.vclass} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-[11px] leading-relaxed">
                      <span className="text-accent2 font-bold uppercase tracking-tighter mr-1">News:</span>
                      <span className="text-muted">{a.news}</span>
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      <span className="text-green-custom font-bold uppercase tracking-tighter mr-1">Bull:</span>
                      <span className="text-muted">{a.bull}</span>
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      <span className="text-red-custom font-bold uppercase tracking-tighter mr-1">Bear:</span>
                      <span className="text-muted">{a.bear}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-auto pt-2">
                    {a.tags.map(t => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-border text-dim">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const RiskRadar = ({ assets }: { assets: Asset[] }) => {
  const dims = ['geopolitical', 'regulatory', 'competition', 'valuation', 'execution'] as const;
  const dimColors: Record<string, string> = {
    geopolitical: 'bg-red-custom',
    regulatory: 'bg-amber-custom',
    competition: 'bg-accent',
    valuation: 'bg-blue-custom',
    execution: 'bg-green-custom'
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Risk Radar" count="5 risk dimensions · score out of 10 = highest risk" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {assets.map((a) => {
          const total = dims.reduce((s, d) => s + (a.risks[d] || 0), 0);
          const totalCls = total >= 30 ? 'text-red-custom' : total >= 20 ? 'text-amber-custom' : 'text-green-custom';
          
          return (
            <div key={a.ticker} className="bg-bg2 border border-border rounded-xl p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-mono text-xs font-medium text-text flex items-center gap-2">
                    {a.ticker}
                    <Badge className={cn(
                      a.seg === 'IN' ? 'bg-blue-500/10 text-blue-400' :
                      a.seg === 'US' ? 'bg-accent/10 text-accent' :
                      'bg-amber-500/10 text-amber-400'
                    )}>{a.seg}</Badge>
                  </div>
                  <div className="text-[10px] text-muted mt-0.5">{a.cat}</div>
                </div>
                <div className={cn("font-mono text-sm", totalCls)}>{total}/50</div>
              </div>

              <div className="space-y-1.5">
                {dims.map(d => (
                  <div key={d} className="flex items-center gap-2">
                    <div className="text-[10px] text-muted w-20 shrink-0 capitalize">{d}</div>
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full", dimColors[d])} 
                        style={{ width: `${(a.risks[d] || 0) * 10}%` }} 
                      />
                    </div>
                    <div className="text-[10px] font-mono w-4 text-right text-muted">{a.risks[d] || 0}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DeepDive = ({ assets }: { assets: Asset[] }) => {
  const [filter, setFilter] = useState<Segment | 'all'>('all');
  const filtered = useMemo(() => filter === 'all' ? assets : assets.filter(a => a.seg === filter), [filter, assets]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Deep Dive" />
      
      <div className="flex gap-2 flex-wrap mb-4">
        {['all', 'IN', 'US', 'MF'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={cn(
              "px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all",
              filter === f 
                ? "bg-accent/20 border-accent text-accent" 
                : "bg-transparent border-border text-muted hover:text-text hover:border-border2"
            )}
          >
            {f === 'all' ? 'All' : f === 'IN' ? 'Indian Stocks' : f === 'US' ? 'US Stocks' : 'Mutual Funds'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((a) => {
          const tot = getTotalScore(a.scores);
          const totColor = parseFloat(tot) >= 7.5 ? 'text-green-custom' : parseFloat(tot) >= 6 ? 'text-amber-custom' : 'text-red-custom';
          const invStr = a.seg === 'US' ? `$${a.inv.toFixed(0)}` : fmtINR(a.inv);
          const currStr = a.seg === 'US' ? `$${a.curr.toFixed(0)}` : fmtINR(a.curr);

          return (
            <div key={a.ticker} className="bg-bg2 border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-start p-4 md:p-5 border-b border-border gap-4">
                <div>
                  <div className="font-mono text-lg font-medium text-text flex items-center gap-2">
                    {a.ticker}
                    <Badge className={cn(
                      a.seg === 'IN' ? 'bg-blue-500/10 text-blue-400' :
                      a.seg === 'US' ? 'bg-accent/10 text-accent' :
                      'bg-amber-500/10 text-amber-400'
                    )}>{a.seg}</Badge>
                  </div>
                  <div className="text-sm text-muted mt-0.5">{a.name}</div>
                  <div className="text-[10px] text-dim mt-0.5 uppercase tracking-wider">{a.cat}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <VerdictBadge verdict={a.verdict} vclass={a.vclass} />
                  <div className={cn("font-mono text-2xl font-medium mt-1", totColor)}>{tot}/10</div>
                  <div className={cn("text-[11px] font-mono", a.ret >= 0 ? "text-green-custom" : "text-red-custom")}>
                    {a.ret >= 0 ? '+' : ''}{a.ret.toFixed(2)}% return
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border-b border-border">
                <div className="bg-bg2 p-3">
                  <div className="text-[9px] sm:text-[10px] text-muted uppercase tracking-wider mb-1">Market Cap / AUM</div>
                  <div className="text-xs sm:text-sm font-mono font-medium">{a.mktCap}</div>
                </div>
                <div className="bg-bg2 p-3">
                  <div className="text-[9px] sm:text-[10px] text-muted uppercase tracking-wider mb-1">P/E Ratio</div>
                  <div className={cn("text-xs sm:text-sm font-mono font-medium", typeof a.pe === 'number' ? (a.pe <= 25 ? 'text-green-custom' : a.pe <= 50 ? 'text-amber-custom' : 'text-red-custom') : '')}>
                    {a.pe === 'N/A' ? 'N/A' : typeof a.pe === 'number' ? a.pe + 'x' : a.pe}
                  </div>
                </div>
                <div className="bg-bg2 p-3">
                  <div className="text-[9px] sm:text-[10px] text-muted uppercase tracking-wider mb-1">ROE</div>
                  <div className="text-xs sm:text-sm font-mono font-medium">{typeof a.roe === 'number' ? a.roe + '%' : a.roe}</div>
                </div>
                <div className="bg-bg2 p-3">
                  <div className="text-[9px] sm:text-[10px] text-muted uppercase tracking-wider mb-1">5Y Sales CAGR</div>
                  <div className="text-xs sm:text-sm font-mono font-medium">{typeof a.cagr5 === 'number' ? a.cagr5 + '%' : a.cagr5}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5">
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-dim mb-2">Latest News Catalyst</div>
                    <div className="text-xs text-muted leading-relaxed">{a.news}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-dim mb-2">Bull Case</div>
                      <div className="text-xs text-green-400/80 leading-relaxed">{a.bull}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-dim mb-2">Bear Case</div>
                      <div className="text-xs text-red-400/80 leading-relaxed">{a.bear}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {a.tags.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-border text-dim">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-dim mb-3">Long-term Scores (5–7Y)</div>
                    <div className="space-y-2">
                      {Object.entries(a.scores).map(([k, v]) => {
                        const val = v as number;
                        return (
                          <div key={k} className="flex items-center gap-2">
                            <div className="text-[11px] text-muted w-20 shrink-0 capitalize">{k}</div>
                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", getScoreBg(val))} style={{ width: `${val * 10}%` }} />
                            </div>
                            <div className={cn("text-[11px] font-mono w-4 text-right", getScoreColor(val))}>{val}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-dim mb-3">Risk Radar</div>
                    <div className="space-y-1.5">
                      {Object.entries(a.risks).map(([k, v]) => {
                        const val = v as number;
                        return (
                          <div key={k} className="flex items-center gap-2">
                            <div className="text-[10px] text-muted w-20 shrink-0 capitalize">{k}</div>
                            <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", getRiskBg(val))} style={{ width: `${val * 10}%` }} />
                            </div>
                            <div className="text-[10px] font-mono w-4 text-right text-muted">{val}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-dim mb-3">Position Details</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-bg3/50 p-2 rounded-lg border border-border">
                        <div className="text-[9px] text-muted uppercase mb-1">Invested</div>
                        <div className="text-xs font-mono font-medium">{invStr}</div>
                      </div>
                      <div className="bg-bg3/50 p-2 rounded-lg border border-border">
                        <div className="text-[9px] text-muted uppercase mb-1">Current</div>
                        <div className="text-xs font-mono font-medium">{currStr}</div>
                      </div>
                      <div className="bg-bg3/50 p-2 rounded-lg border border-border">
                        <div className="text-[9px] text-muted uppercase mb-1">Debt</div>
                        <div className="text-[10px] font-medium truncate">{a.debt}</div>
                      </div>
                      <div className="bg-bg3/50 p-2 rounded-lg border border-border">
                        <div className="text-[9px] text-muted uppercase mb-1">Promoter/Cost</div>
                        <div className="text-[10px] font-medium truncate">{a.promoter}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Charts = ({ assets }: { assets: Asset[] }) => {
  const sortedRet = useMemo(() => [...assets].sort((a, b) => b.ret - a.ret), [assets]);
  const sortedScores = useMemo(() => [...assets].sort((a, b) => parseFloat(getTotalScore(b.scores)) - parseFloat(getTotalScore(a.scores))).slice(0, 20), [assets]);
  const cagrAssets = useMemo(() => assets.filter(a => typeof a.cagr5 === 'number' && a.cagr5 > 0).sort((a, b) => (b.cagr5 as number) - (a.cagr5 as number)).slice(0, 18), [assets]);
  const riskTotals = useMemo(() => assets.map(a => ({
    name: a.ticker,
    total: Object.values(a.risks).reduce((s, v) => s + v, 0),
    seg: a.seg
  })).sort((a, b) => b.total - a.total).slice(0, 15), [assets]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionHeader title="Charts" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-bg2 border border-border rounded-xl p-4 sm:p-5">
          <div className="text-[10px] sm:text-xs font-medium text-muted uppercase tracking-widest mb-4 sm:mb-6">Return % — All Holdings</div>
          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedRet} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="ticker" type="category" width={60} tick={{ fontSize: 9, fill: '#8b8a9e' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '11px' }}
                  formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Return']}
                />
                <Bar dataKey="ret" radius={[0, 4, 4, 0]}>
                  {sortedRet.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.ret >= 0 ? 'rgba(94,231,176,0.7)' : 'rgba(245,101,101,0.7)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg2 border border-border rounded-xl p-4 sm:p-5">
          <div className="text-[10px] sm:text-xs font-medium text-muted uppercase tracking-widest mb-4 sm:mb-6">Long-term Score — Top 20 Assets</div>
          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedScores} margin={{ bottom: 30 }}>
                <XAxis dataKey="ticker" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 8, fill: '#8b8a9e' }} axisLine={false} tickLine={false} />
                <YAxis domain={[5, 10]} tick={{ fontSize: 9, fill: '#8b8a9e' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#e8e6f0', fontSize: '11px' }}
                />
                <Bar dataKey={(a) => parseFloat(getTotalScore(a.scores))} name="Score" fill="#7c6af7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg2 border border-border rounded-xl p-4 sm:p-5">
          <div className="text-[10px] sm:text-xs font-medium text-muted uppercase tracking-widest mb-4 sm:mb-6">5Y CAGR — Top Growth Assets</div>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cagrAssets} margin={{ bottom: 30 }}>
                <XAxis dataKey="ticker" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 8, fill: '#8b8a9e' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#8b8a9e' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#e8e6f0', fontSize: '11px' }}
                />
                <Bar dataKey="cagr5" name="CAGR" radius={[4, 4, 0, 0]}>
                  {cagrAssets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Number(entry.cagr5) >= 20 ? 'rgba(94,231,176,0.75)' : Number(entry.cagr5) >= 12 ? 'rgba(246,173,85,0.75)' : 'rgba(245,101,101,0.75)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg2 border border-border rounded-xl p-4 sm:p-5">
          <div className="text-[10px] sm:text-xs font-medium text-muted uppercase tracking-widest mb-4 sm:mb-6">Risk Score Comparison (Top 15)</div>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskTotals} margin={{ bottom: 30 }}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 8, fill: '#8b8a9e' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 50]} tick={{ fontSize: 9, fill: '#8b8a9e' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#e8e6f0', fontSize: '11px' }}
                />
                <Bar dataKey="total" name="Risk Score" radius={[4, 4, 0, 0]}>
                  {riskTotals.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.total >= 30 ? 'rgba(245,101,101,0.75)' : entry.total >= 20 ? 'rgba(246,173,85,0.75)' : 'rgba(94,231,176,0.75)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activePage, setActivePage] = useState('overview');
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const stats = useMemo(() => {
    const inInv = assets.filter(a => a.seg === 'IN').reduce((s, a) => s + a.inv, 0);
    const inCurr = assets.filter(a => a.seg === 'IN').reduce((s, a) => s + a.curr, 0);
    const usInv = assets.filter(a => a.seg === 'US').reduce((s, a) => s + a.inv, 0);
    const usCurr = assets.filter(a => a.seg === 'US').reduce((s, a) => s + a.curr, 0);
    const mfInv = assets.filter(a => a.seg === 'MF').reduce((s, a) => s + a.inv, 0);
    const mfCurr = assets.filter(a => a.seg === 'MF').reduce((s, a) => s + a.curr, 0);

    const usInvINR = usInv * USD_INR;
    const usCurrINR = usCurr * USD_INR;

    const totalInv = inInv + usInvINR + mfInv;
    const totalCurr = inCurr + usCurrINR + mfCurr;
    const totalPL = totalCurr - totalInv;
    const totalRet = (totalPL / totalInv) * 100;

    return {
      inInv, inCurr,
      usInv, usCurr,
      mfInv, mfCurr,
      totalInv, totalCurr, totalPL, totalRet
    };
  }, [assets]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets: assets.map(a => ({ ticker: a.ticker, seg: a.seg })) })
      });
      
      if (!response.ok) throw new Error('Sync failed');
      
      const { results } = await response.json();
      
      const updatedAssets = assets.map(asset => {
        const update = results.find((r: any) => r.ticker === asset.ticker);
        if (update && !update.error) {
          return {
            ...asset,
            curr: update.curr || asset.curr,
            pe: update.pe || asset.pe,
            mktCap: update.mktCap || asset.mktCap,
            ret: (( (update.curr || asset.curr) - asset.inv) / asset.inv) * 100
          };
        }
        return asset;
      });
      
      setAssets(updatedAssets);
      setLastSynced(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const pages = [
    { id: 'overview', label: 'Overview' },
    { id: 'scores', label: 'Long-term Scores' },
    { id: 'fundamentals', label: 'Fundamentals' },
    { id: 'verdicts', label: 'Buy / Hold / Exit' },
    { id: 'risk', label: 'Risk Radar' },
    { id: 'deepdive', label: 'Deep Dive' },
    { id: 'charts', label: 'Charts' },
  ];

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-accent/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-bg/95 backdrop-blur-xl border-b border-border px-3 md:px-8">
        <div className="max-w-[1400px] mx-auto flex items-center h-14 md:h-16">
          <div className="font-serif text-lg md:text-xl text-text pr-4 md:pr-8 border-r border-border mr-4 md:mr-6 whitespace-nowrap">
            P<span className="hidden sm:inline">ortfolio</span> <span className="text-accent">A<span className="hidden sm:inline">nalytica</span></span>
          </div>
          <div className="hidden lg:flex items-center gap-4 mr-6">
            <SyncButton onSync={handleSync} isSyncing={isSyncing} />
            {lastSynced && (
              <span className="text-[9px] font-mono text-dim uppercase">Last: {lastSynced}</span>
            )}
          </div>
          <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1 -mb-px">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setActivePage(page.id)}
                className={cn(
                  "px-3 md:px-4 py-4 md:py-5 text-[10px] md:text-xs font-medium whitespace-nowrap border-b-2 transition-all tracking-wider uppercase",
                  activePage === page.id 
                    ? "text-accent border-accent" 
                    : "text-muted border-transparent hover:text-text"
                )}
              >
                {page.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto p-3 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activePage === 'overview' && <Overview assets={assets} />}
            {activePage === 'scores' && <Scores assets={assets} />}
            {activePage === 'fundamentals' && <Fundamentals assets={assets} />}
            {activePage === 'verdicts' && <Verdicts assets={assets} />}
            {activePage === 'risk' && <RiskRadar assets={assets} />}
            {activePage === 'deepdive' && <DeepDive assets={assets} />}
            {activePage === 'charts' && <Charts assets={assets} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-[1400px] mx-auto p-8 border-t border-border mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-dim text-xs font-mono">
            Master Portfolio Analysis — March 2026
          </div>
          <div className="flex gap-6 text-dim text-xs">
            <a href="#" className="hover:text-muted transition-colors">Documentation</a>
            <a href="#" className="hover:text-muted transition-colors">Risk Disclosure</a>
            <a href="#" className="hover:text-muted transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
