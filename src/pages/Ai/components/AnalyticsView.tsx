// src/pages/Ai/components/AnalyticsView.tsx
import React, { useState } from 'react';
import {
  LayoutGrid,
  BarChart2,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Table as TableIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { AnalyticsResult, AnalyticsVisualization } from '../types';

interface AnalyticsViewProps {
  analytics: AnalyticsResult;
  onFormatChange?: (format: AnalyticsVisualization) => void;
}

const PIE_COLORS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#6366f1',
];

const TAB_CONFIG: {
  key: AnalyticsVisualization;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: 'summary', label: 'Summary', icon: LayoutGrid },
  { key: 'bar', label: 'Bar', icon: BarChart2 },
  { key: 'line', label: 'Trend', icon: LineChartIcon },
  { key: 'pie', label: 'Pie', icon: PieChartIcon },
  { key: 'table', label: 'Table', icon: TableIcon },
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  analytics,
  onFormatChange,
}) => {
  const [format, setFormat] = useState<AnalyticsVisualization>(() => {
    return analytics.selectedVisualization || 'summary';
  });

  const handleSelectFormat = (f: AnalyticsVisualization) => {
    setFormat(f);
    if (onFormatChange) onFormatChange(f);
  };

  const candidates = analytics.visualizationCandidates || ['summary'];
  const hasSeries = !!(analytics.series && analytics.series.length > 0);
  const hasCategories = !!(analytics.categories && analytics.categories.length > 0);
  const hasRows = !!(analytics.rows && analytics.rows.length > 0);

  // Custom Recharts Dark Tooltip
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div
          className="px-2.5 py-1.5 rounded-lg text-xs shadow-lg"
          style={{
            background: 'var(--bg-elevated, #1e293b)',
            border: '1px solid var(--border-strong, #334155)',
            color: 'var(--text-primary, #f8fafc)',
          }}
        >
          <p className="font-semibold">{label || data.name}</p>
          <p style={{ color: '#10b981' }}>
            {typeof data.value === 'number' ? data.value.toLocaleString('en-IN') : data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full mt-2 space-y-3">
      {/* Title & Metadata Strip */}
      <div className="flex items-center justify-between text-xs pb-1" style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))' }}>
        <span className="font-medium" style={{ color: '#10b981' }}>
          {analytics.command || '/analytics'}
        </span>
        {analytics.dateRange?.preset && (
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            {analytics.dateRange.preset}
          </span>
        )}
      </div>

      {/* KPI Summary Cards Grid */}
      {analytics.summary && analytics.summary.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {analytics.summary.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl flex flex-col justify-between"
              style={{
                background: 'var(--surface-3, rgba(255,255,255,0.04))',
                border: '1px solid var(--border, rgba(255,255,255,0.08))',
              }}
            >
              <span className="text-[11px]" style={{ color: 'var(--text-faint, #94a3b8)' }}>
                {item.label}
              </span>
              <div className="font-bold text-sm mt-1" style={{ color: 'var(--text-primary, #f8fafc)' }}>
                {item.currency ? item.currency + ' ' : ''}
                {typeof item.value === 'number' ? item.value.toLocaleString('en-IN') : item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Format Switcher Tabs */}
      {candidates.length > 1 && (
        <div
          className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: 'var(--surface-2, rgba(255,255,255,0.03))' }}
        >
          {TAB_CONFIG.filter((t) => candidates.includes(t.key)).map((tab) => {
            const Icon = tab.icon;
            const isSelected = format === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleSelectFormat(tab.key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: isSelected ? 'var(--surface-4, #10b981)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                }}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* View Content based on Selected Format */}
      <div className="w-full">
        {format === 'bar' && hasSeries && (
          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.series} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="label"
                  stroke="var(--text-faint, #64748b)"
                  fontSize={10}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="var(--text-faint, #64748b)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)}
                />
                <Tooltip content={renderCustomTooltip} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {format === 'line' && hasSeries && (
          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.series} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="label"
                  stroke="var(--text-faint, #64748b)"
                  fontSize={10}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="var(--text-faint, #64748b)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)}
                />
                <Tooltip content={renderCustomTooltip} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {format === 'pie' && hasCategories && (
          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.categories}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={68}
                  innerRadius={36}
                  paddingAngle={2}
                >
                  {analytics.categories?.map((_, index) => (
                    <Cell key={'cell-' + index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={renderCustomTooltip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {analytics.categories?.slice(0, 5).map((cat, i) => (
                <div key={i} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted, #94a3b8)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span>{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {format === 'table' && hasRows && analytics.columns && (
          <div className="w-full max-h-56 overflow-y-auto rounded-xl border mt-2" style={{ borderColor: 'var(--border, rgba(255,255,255,0.08))' }}>
            <table className="w-full text-[11px] text-left">
              <thead style={{ background: 'var(--surface-3, rgba(255,255,255,0.06))', color: 'var(--text-faint, #94a3b8)' }}>
                <tr>
                  {analytics.columns.map((col, idx) => (
                    <th key={idx} className="py-2 px-2.5 font-medium whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border, rgba(255,255,255,0.04))' }}>
                {(analytics.rows || []).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-1.5 px-2.5 whitespace-nowrap" style={{ color: 'var(--text-primary, #f8fafc)' }}>
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
