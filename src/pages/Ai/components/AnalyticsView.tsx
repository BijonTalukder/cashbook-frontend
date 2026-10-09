// src/pages/Ai/components/AnalyticsView.tsx
import React, { useState } from 'react';
import {
  LayoutGrid,
  BarChart2,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Table as TableIcon,
  Sparkles,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { useTranslation } from '../../../i18n/useTranslation';
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
  desc: string;
  icon: React.ElementType;
}[] = [
  { key: 'bar', label: 'Bar Chart', desc: 'Side-by-side comparison', icon: BarChart2 },
  { key: 'line', label: 'Trend Line', desc: 'Changes over time', icon: LineChartIcon },
  { key: 'pie', label: 'Pie Chart', desc: 'Category breakdown', icon: PieChartIcon },
  { key: 'table', label: 'Data Table', desc: 'Detailed row-by-row', icon: TableIcon },
  { key: 'summary', label: 'Summary', desc: 'Key metric cards', icon: LayoutGrid },
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  analytics,
  onFormatChange,
}) => {
  const { t } = useTranslation();
  const candidates = analytics.visualizationCandidates || ['summary'];

  // When data comes, if there are multiple visualization options,
  // prompt the user to choose their preferred option first!
  const [format, setFormat] = useState<AnalyticsVisualization | null>(() => {
    if (candidates.length <= 1) {
      return candidates[0] || 'summary';
    }
    return null;
  });

  const handleSelectFormat = (f: AnalyticsVisualization) => {
    setFormat(f);
    if (onFormatChange) onFormatChange(f);
  };

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
      <div
        className="flex items-center justify-between text-xs pb-1"
        style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))' }}
      >
        <span className="font-medium" style={{ color: '#10b981' }}>
          {analytics.command || '/analytics'}
        </span>
        {analytics.dateRange?.preset && (
          <span
            className="text-[11px] px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}
          >
            {analytics.dateRange.preset}
          </span>
        )}
      </div>

      {/* KPI Summary Cards Grid (Always visible for quick numbers) */}
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

      {/* ── STEP 1: Interactive Choice Prompt (When user hasn't chosen format yet) ── */}
      {format === null && candidates.length > 1 && (
        <div
          className="p-3 rounded-2xl border space-y-2.5"
          style={{
            background: 'var(--surface-3, rgba(255,255,255,0.04))',
            borderColor: 'var(--border, rgba(255,255,255,0.08))',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}
            >
              <Sparkles size={14} />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary, #f8fafc)' }}>
                {t('ai.chooseVisualization')}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-faint, #94a3b8)' }}>
                {t('ai.chooseVisualizationSub')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {TAB_CONFIG.filter((t) => candidates.includes(t.key)).map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.key}
                  onClick={() => handleSelectFormat(opt.key)}
                  className="flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5 active:scale-[0.98] press"
                  style={{
                    background: 'var(--surface-2, rgba(255,255,255,0.02))',
                    borderColor: 'var(--border, rgba(255,255,255,0.06))',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: 'rgba(16,185,129,0.12)',
                      color: '#10b981',
                    }}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold leading-tight truncate" style={{ color: 'var(--text-primary, #f8fafc)' }}>
                      {t(`ai.viewFormat.${opt.key}`)}
                    </div>
                    <div className="text-[10px] mt-0.5 leading-tight line-clamp-1" style={{ color: 'var(--text-faint, #94a3b8)' }}>
                      {t(`ai.viewFormat.${opt.key}Desc`)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 2: Selected Format View & Quick Format Switcher Bar ── */}
      {format !== null && candidates.length > 1 && (
        <div className="flex items-center justify-between gap-1">
          <div
            className="flex-1 flex items-center gap-1 p-1 rounded-xl overflow-x-auto no-scrollbar"
            style={{ background: 'var(--surface-2, rgba(255,255,255,0.03))' }}
          >
            {TAB_CONFIG.filter((t) => candidates.includes(t.key)).map((tab) => {
              const Icon = tab.icon;
              const isSelected = format === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleSelectFormat(tab.key)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                  style={{
                    background: isSelected ? '#10b981' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                  }}
                >
                  <Icon size={13} />
                  <span>{t(`ai.viewFormat.${tab.key}`)}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setFormat(null)}
            title={t('ai.changeVisualization')}
            className="p-2 rounded-xl border flex items-center justify-center text-[11px] press flex-shrink-0"
            style={{
              background: 'var(--surface-2, rgba(255,255,255,0.03))',
              borderColor: 'var(--border, rgba(255,255,255,0.06))',
              color: 'var(--text-faint, #94a3b8)',
            }}
          >
            <RotateCcw size={12} />
          </button>
        </div>
      )}

      {/* ── Render Content for Selected Format ── */}
      {format !== null && (
        <div className="w-full">
          {format === 'bar' && (
            hasSeries ? (
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
            ) : (
              <div
                className="p-4 rounded-xl text-center space-y-2 border"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-center text-amber-400 gap-1.5 text-xs">
                  <AlertCircle size={14} />
                  <span>{t('ai.noChartData')}</span>
                </div>
                {hasRows && (
                  <button
                    onClick={() => handleSelectFormat('table')}
                    className="px-3 py-1 rounded-lg text-xs font-medium"
                    style={{ background: '#10b981', color: '#022c22' }}
                  >
                    {t('ai.viewAsTable')}
                  </button>
                )}
              </div>
            )
          )}

          {format === 'line' && (
            hasSeries ? (
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
            ) : (
              <div
                className="p-4 rounded-xl text-center space-y-2 border"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-center text-amber-400 gap-1.5 text-xs">
                  <AlertCircle size={14} />
                  <span>{t('ai.noChartData')}</span>
                </div>
                {hasRows && (
                  <button
                    onClick={() => handleSelectFormat('table')}
                    className="px-3 py-1 rounded-lg text-xs font-medium"
                    style={{ background: '#10b981', color: '#022c22' }}
                  >
                    {t('ai.viewAsTable')}
                  </button>
                )}
              </div>
            )
          )}

          {format === 'pie' && (
            hasCategories ? (
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
            ) : (
              <div
                className="p-4 rounded-xl text-center space-y-2 border"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-center text-amber-400 gap-1.5 text-xs">
                  <AlertCircle size={14} />
                  <span>{t('ai.noChartData')}</span>
                </div>
                {hasRows && (
                  <button
                    onClick={() => handleSelectFormat('table')}
                    className="px-3 py-1 rounded-lg text-xs font-medium"
                    style={{ background: '#10b981', color: '#022c22' }}
                  >
                    {t('ai.viewAsTable')}
                  </button>
                )}
              </div>
            )
          )}

          {format === 'table' && hasRows && analytics.columns && (
            <div
              className="w-full max-h-56 overflow-y-auto rounded-xl border mt-2"
              style={{ borderColor: 'var(--border, rgba(255,255,255,0.08))' }}
            >
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
      )}
    </div>
  );
};
