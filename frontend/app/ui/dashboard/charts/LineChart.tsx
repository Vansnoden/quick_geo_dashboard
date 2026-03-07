'use client';

import { fetchChartData } from '@/app/lib/client_actions';
import { ChartDataResponse, ChartDef } from '@/app/lib/definitions';
import { useEffect, useState } from 'react';

import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface Props {
  chart: ChartDef;
  dashboardId: string;
}

export default function LineChart({ chart, dashboardId }: Props) {
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
        <ReLineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8884d8" />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}