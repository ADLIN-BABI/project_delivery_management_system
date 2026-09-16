import React from 'react';
import { ArrowRight, Folder, Rocket, Hourglass, CheckCircle2 } from 'lucide-react';

export type StatType = 'total' | 'active' | 'pending' | 'completed';

interface StatCardProps {
  type: StatType;
  title: string;
  count: number;
  linkText: string;
  onClick: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  type,
  title,
  count,
  linkText,
  onClick,
}) => {
  const getTheme = () => {
    switch (type) {
      case 'total':
        return {
          icon: Folder,
          iconBg: 'bg-blue-50 text-blue-600',
          hoverBorder: 'hover:border-blue-300',
          linkColor: 'text-blue-600 hover:text-blue-700',
        };
      case 'active':
        return {
          icon: Rocket,
          iconBg: 'bg-emerald-50 text-emerald-600',
          hoverBorder: 'hover:border-emerald-300',
          linkColor: 'text-emerald-600 hover:text-emerald-700',
        };
      case 'pending':
        return {
          icon: Hourglass,
          iconBg: 'bg-orange-50 text-orange-600',
          hoverBorder: 'hover:border-orange-300',
          linkColor: 'text-orange-600 hover:text-orange-700',
        };
      case 'completed':
      default:
        return {
          icon: CheckCircle2,
          iconBg: 'bg-purple-50 text-purple-600',
          hoverBorder: 'hover:border-purple-300',
          linkColor: 'text-purple-600 hover:text-purple-700',
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md ${theme.hoverBorder}`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${theme.iconBg}`}>
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-600">{title}</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
            {count}
          </p>
        </div>
      </div>

      <div className="mt-6 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold">
        <span className={theme.linkColor}>{linkText}</span>
        <ArrowRight className={`w-3.5 h-3.5 ${theme.linkColor}`} />
      </div>
    </div>
  );
};
