// src/pages/Ai/components/CommandAutocomplete.tsx
import React from 'react';
import {
  TrendingUp,
  Receipt,
  PiggyBank,
  DollarSign,
  AlertCircle,
  Wallet,
  Package,
  ShoppingCart,
  Users,
  Building,
  HelpCircle,
  FileText,
} from 'lucide-react';

export interface CommandItem {
  name: string;
  label: string;
  labelBn: string;
  description: string;
  icon: React.ElementType;
}

const COMMAND_LIST: CommandItem[] = [
  { name: '/report', label: 'Business Overview', labelBn: 'সার্বিক বিবরণ', description: 'Complete financial overview & profit', icon: FileText },
  { name: '/sales', label: 'Sales Analytics', labelBn: 'বিক্রয় বিশ্লেষণ', description: 'Total sales revenue, dues & trend', icon: TrendingUp },
  { name: '/expense', label: 'Expenses', labelBn: 'খরচের হিসাব', description: 'Categorized business & cashbook expenses', icon: Receipt },
  { name: '/profit', label: 'Profit & Loss', labelBn: 'লাভ ও লোকসান', description: 'Gross profit, COGS & net margins', icon: PiggyBank },
  { name: '/income', label: 'Income & Cash In', labelBn: 'আয় ও ক্যাশ ইন', description: 'Direct revenue & receipts', icon: DollarSign },
  { name: '/due', label: 'Outstanding Dues', labelBn: 'বকেয়া হিসাব', description: 'Customer receivables & supplier payables', icon: AlertCircle },
  { name: '/balance', label: 'Cash & Bank', labelBn: 'ক্যাশ ও ব্যাংক', description: 'Liquid cash in hand & bank balance', icon: Wallet },
  { name: '/inventory', label: 'Stock Valuation', labelBn: 'মজুদ পণ্য ও স্টক', description: 'Stock levels & low stock alerts', icon: Package },
  { name: '/purchase', label: 'Purchases', labelBn: 'ক্রয় হিসাব', description: 'Supplier orders & procurement', icon: ShoppingCart },
  { name: '/customer', label: 'Top Customers', labelBn: 'শীর্ষ ক্রেতা', description: 'Customer sales volume & receivables', icon: Users },
  { name: '/supplier', label: 'Top Suppliers', labelBn: 'শীর্ষ সাপ্লায়ার', description: 'Procurement volume & payables', icon: Building },
  { name: '/help', label: 'Commands Guide', labelBn: 'সহায়িকা', description: 'List of all commands & tips', icon: HelpCircle },
];

interface CommandAutocompleteProps {
  query: string;
  onSelect: (commandName: string) => void;
  visible: boolean;
}

export const CommandAutocomplete: React.FC<CommandAutocompleteProps> = ({
  query,
  onSelect,
  visible,
}) => {
  if (!visible) return null;

  const normalized = query.toLowerCase().trim();
  const filtered = COMMAND_LIST.filter(
    (c) =>
      c.name.toLowerCase().startsWith(normalized) ||
      c.label.toLowerCase().includes(normalized.replace('/', '')) ||
      c.labelBn.includes(normalized.replace('/', '')),
  );

  if (filtered.length === 0) return null;

  return (
    <div
      className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl overflow-hidden shadow-2xl z-50 border"
      style={{
        background: 'var(--bg-elevated, #0f172a)',
        borderColor: 'var(--border-strong, #334155)',
        maxHeight: '220px',
      }}
    >
      <div className="px-3.5 py-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-faint, #64748b)', background: 'var(--surface-2, rgba(255,255,255,0.03))' }}>
        Business Analytics Commands
      </div>
      <div className="overflow-y-auto max-h-48 divide-y" style={{ borderColor: 'var(--border, rgba(255,255,255,0.05))' }}>
        {filtered.map((cmd) => {
          const Icon = cmd.icon;
          return (
            <button
              key={cmd.name}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(cmd.name)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-emerald-500/10 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs" style={{ color: '#10b981' }}>
                    {cmd.name}
                  </span>
                  <span className="text-xs truncate font-medium" style={{ color: 'var(--text-primary, #f8fafc)' }}>
                    {cmd.label}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-faint, #64748b)' }}>
                    ({cmd.labelBn})
                  </span>
                </div>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-faint, #94a3b8)' }}>
                  {cmd.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
