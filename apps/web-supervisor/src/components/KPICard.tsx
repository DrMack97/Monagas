import React, { type ReactNode } from 'react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

interface KPICardProps {
  title?: string;        // Acepta title
  label?: string;        // Acepta label (fallback)
  value: string | number;
  unit?: string;
  change?: number;
  trend?: 'up' | 'down';
  trendPercentage?: number;
  icon?: ReactNode;
  color?: string;
}

export default function KPICard({ 
  title, 
  label, 
  value, 
  unit, 
  change, 
  trend, 
  trendPercentage, 
  icon, 
  color = 'blue' 
}: KPICardProps) {
  const displayTitle = title || label || 'KPI';
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div className={`bg-white p-4 rounded-lg shadow border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{displayTitle}</h3>
        {icon && <span className="text-2xl" aria-hidden="true">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-bold text-gray-900">{displayValue}</p>
        {unit && <span className="ml-1 text-sm text-gray-500">{unit}</span>}
      </div>
      {(change !== undefined || trendPercentage !== undefined) && (
        <div className="mt-2 flex items-center text-sm">
          {trend && (
            <span className="mr-1" aria-hidden="true">
              {trend === 'up' ? <FiArrowUp /> : <FiArrowDown />}
            </span>
          )}
          {trendPercentage !== undefined && (
            <span className={`flex items-center gap-1 font-medium ${trendPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trendPercentage >= 0 ? <FiArrowUp aria-hidden="true" /> : <FiArrowDown aria-hidden="true" />} {Math.abs(trendPercentage)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}