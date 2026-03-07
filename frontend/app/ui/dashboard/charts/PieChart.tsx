'use client';

import { fetchChartData } from '@/app/lib/client_actions';
import { ChartDataResponse, ChartDef } from '@/app/lib/definitions';
import { useEffect, useState } from 'react';
import {
  PieChart as RePieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface Props {
  chart: ChartDef;
  dashboardId: string;
}

// Optional: define a color palette for the pie slices
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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

  if (loading) return <div className="h-64 bg-gray-200 animate-pulse rounded" />;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!data) return null;

  const chartData = data.labels.map((label, i) => ({
    name: label,
    value: data.data[i]
  }));

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-semibold mb-2">{chart.title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RePieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            label
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}