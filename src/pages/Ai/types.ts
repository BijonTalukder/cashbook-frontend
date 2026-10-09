// src/pages/Ai/types.ts
export type AnalyticsVisualization =
  | 'summary'
  | 'bar'
  | 'line'
  | 'pie'
  | 'table'
  | 'number';

export interface AnalyticsSummaryItem {
  label: string;
  value: number | string;
  currency?: string;
}

export interface AnalyticsSeriesItem {
  label: string;
  value: number;
  [key: string]: unknown;
}

export interface AnalyticsCategoryItem {
  name: string;
  value: number;
}

export interface AnalyticsResult {
  type: 'analytics_result';
  command: string;
  title: string;
  businessId: string;
  dateRange?: {
    start: string;
    endExclusive: string;
    timezone: string;
    preset?: string;
  };
  summary: AnalyticsSummaryItem[];
  columns?: string[];
  rows?: (string | number)[][];
  series?: AnalyticsSeriesItem[];
  categories?: AnalyticsCategoryItem[];
  selectedVisualization: AnalyticsVisualization;
  visualizationCandidates: AnalyticsVisualization[];
  metadata?: {
    generatedAt: string;
    executionTimeMs: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
  error?: boolean;
  analytics?: AnalyticsResult;
  formatPreference?: AnalyticsVisualization;
}

export interface CommandSuggestion {
  name: string;
  label: string;
  labelBn: string;
  description: string;
  descriptionBn: string;
  defaultVisualization: AnalyticsVisualization;
  examples: { en: string; bn: string }[];
}
