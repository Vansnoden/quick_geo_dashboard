'use client';

import { fetchChartData } from '@/app/lib/client_actions';
import { ChartDataResponse, ChartDef, FilterCondition } from '@/app/lib/definitions';
import { useEffect, useState } from 'react';

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface Props {
  chart: ChartDef;
  dashboardId: string;
  interactiveFilters?: Record<string, any>; 
}

// Color palette for bars (you can customize these colors)
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe',
  '#00c49f', '#ffbb28', '#ff6b6b', '#a05e8a', '#d0bb57',
  '#8dd1e1', '#b0e57c', '#fe938c', '#7b6c8c', '#6b5b7c'
];

export default function BarChart({ chart, dashboardId, interactiveFilters}: Props) {
  const [data, setData] = useState<ChartDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Convert interactive filter values to FilterCondition array
    const extraFilters: FilterCondition[] = [];
    if (interactiveFilters) {
      Object.entries(interactiveFilters).forEach(([col, val]) => {
        if (val === '' || val === undefined || (Array.isArray(val) && val.length === 0)) return;
        if (Array.isArray(val)) {
          extraFilters.push({ column: col, operator: 'in', value: val });
        } else if (typeof val === 'object' && val.min !== undefined && val.max !== undefined) {
          extraFilters.push({ column: col, operator: '>=', value: val.min });
          extraFilters.push({ column: col, operator: '<=', value: val.max });
        } else {
          extraFilters.push({ column: col, operator: '=', value: val });
        }
      });
    }

    fetchChartData(dashboardId, chart, extraFilters)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [dashboardId, chart, interactiveFilters]);

  if (loading) return <div className="h-64 bg-gray-200 animate-pulse rounded" />;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!data) return null;

  const chartData = data.labels.map((label, i) => ({ name: label, value: data.data[i] }));

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-semibold mb-2">{chart.title}</h3>
      <ResponsiveContainer width="100%" height={350}> {/* Increased height for rotated labels */}
        <ReBarChart data={chartData} margin={{ bottom: 60 }}> {/* Added bottom margin */}
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={45} 
            textAnchor="start" 
            height={80} 
            interval={0}
            tick={{ fontSize: 11 }}
          />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}