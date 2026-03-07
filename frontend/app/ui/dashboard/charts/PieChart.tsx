'use client';

import { fetchChartData } from '@/app/lib/client_actions';
import { ChartDataResponse, ChartDef } from '@/app/lib/definitions';
import { useEffect, useState } from 'react';
import {
  PieChart as RePieChart,
  Pie,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip, TooltipIndex,
  ResponsiveContainer
} from 'recharts';
import { RechartsDevtools } from '@recharts/devtools';

interface Props {
  chart: ChartDef;
  dashboardId: string;
}

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

  const chartData = data.labels.map((label, i) => ({ name: label, value: data.data[i] }));

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-semibold mb-2">{chart.title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RePieChart 
            style={{ width: '100%', height: '100%', maxWidth: '500px', maxHeight: '80vh', aspectRatio: 1 }}
            responsive>
             <Pie
                data={chartData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius="50%"
                fill="#8884d8"
                isAnimationActive={true}
            />
            {/* <Tooltip defaultIndex={defaultIndex} /> */}
            <RechartsDevtools />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}