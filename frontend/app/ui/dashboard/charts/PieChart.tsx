'use client';

import { fetchChartData } from '@/app/lib/client_actions';
import { ChartDataResponse, ChartDef } from '@/app/lib/definitions';
import { useEffect, useState } from 'react';
import {
  PieChart as RePieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';

interface Props {
  chart: ChartDef;
  dashboardId: string;
}

// Extended color palette for better variety
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D',
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFE194', '#B4A5FF',
  '#E6B0AA', '#A8E6CF', '#FFD3B6', '#D4A5A5', '#9B7EDE', '#F7C978'
];

// Custom tooltip formatter
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
        <p className="font-semibold text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">
          Value: <span className="font-medium text-purple-600">{data.value}</span>
        </p>
        <p className="text-xs text-gray-500">
          Percentage: <span className="font-medium">{((data.value / payload[0].total) * 100).toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

// Custom legend content to show percentages
const renderLegend = (props: any) => {
  const { payload } = props;
  const total = payload.reduce((sum: number, entry: any) => sum + entry.payload.value, 0);
  
  return (
    <ul className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
      {payload.map((entry: any, index: number) => (
        <li key={`legend-${index}`} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-700">
            {entry.value}: <span className="font-medium">{entry.payload.value}</span>
            <span className="text-gray-500 ml-1">
              ({((entry.payload.value / total) * 100).toFixed(1)}%)
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
};

export default function PieChart({ chart, dashboardId }: Props) {
  const [data, setData] = useState<ChartDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChartData(dashboardId, chart)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [dashboardId, chart]);

  if (loading) return <div className="h-80 bg-gray-200 animate-pulse rounded" />;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!data) return null;

  const chartData = data.labels.map((label, i) => ({
    name: label,
    value: data.data[i]
  })).filter(item => item.value > 0); // Filter out zero values

  // Calculate total for percentage display
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-semibold mb-2">{chart.title}</h3>
      {chartData.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-gray-500">
          No data available for this chart
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <RePieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={140}  // Increased from 80 to 140
                innerRadius={60}    // Added inner radius for donut effect (optional - remove if you want solid pie)
                fill="#8884d8"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                paddingAngle={2}    // Small gap between slices
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                content={renderLegend}
                verticalAlign="bottom"
                height={80}
              />
            </RePieChart>
          </ResponsiveContainer>
          
          {/* Summary stats below chart */}
          <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 flex justify-between">
            <span>Total: <span className="font-semibold text-purple-600">{total}</span></span>
            <span>Categories: <span className="font-semibold text-purple-600">{chartData.length}</span></span>
          </div>
        </>
      )}
    </div>
  );
}