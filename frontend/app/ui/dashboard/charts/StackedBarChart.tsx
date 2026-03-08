'use client';

import { fetchChartData } from '@/app/lib/client_actions';
import { DASHBOARD_CHART_DISTINCT_VALS } from '@/app/lib/constants';
import { ChartDef, FilterCondition } from '@/app/lib/definitions';
import { useEffect, useState } from 'react';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Props {
  chart: ChartDef;  // Now includes stackBy
  dashboardId: string;
}

// Color palette for stacked categories
const STACK_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue  
  '#10b981', // Green
  '#f59e0b', // Orange
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316'  // Bright Orange
];

interface StackedDataPoint {
  name: string;
  [key: string]: string | number;
}

export default function StackedBarChart({ chart, dashboardId }: Props) {
  const [data, setData] = useState<StackedDataPoint[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStackedData = async () => {
      if (!chart.stackBy) {
        setError('stackBy is required for stacked bar charts');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // 1. Get unique categories to stack
        const catResponse = await fetch(DASHBOARD_CHART_DISTINCT_VALS(Number(dashboardId)), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            column: chart.stackBy,
            filters: chart.filters || []
          })
        });
        
        if (!catResponse.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const uniqueCategories = await catResponse.json();
        setCategories(uniqueCategories);

        // 2. Fetch data for each category
        const allData: { [key: string]: any } = {};
        
        await Promise.all(uniqueCategories.map(async (category: string) => {
          // Create a safe filter for the current category
          const categoryFilter: FilterCondition = {
            column: chart.stackBy!, // We know it's defined here because we checked above
            operator: '=',
            value: category
          };
          
          const response = await fetchChartData(dashboardId, {
            ...chart,
            filters: [
              ...(chart.filters || []),
              categoryFilter
            ]
          });
          
          response.labels.forEach((label: string, idx: number) => {
            if (!allData[label]) {
              allData[label] = { name: label };
            }
            allData[label][category] = response.data[idx];
          });
        }));

        setData(Object.values(allData));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStackedData();
  }, [dashboardId, chart]);

  if (loading) return <div className="h-64 bg-gray-200 animate-pulse rounded" />;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (data.length === 0) return <div className="text-gray-500">No data available</div>;

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-semibold mb-2">{chart.title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ReBarChart 
          data={data} 
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
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
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}
          />
          <Legend 
            verticalAlign="top" 
            height={36}
            wrapperStyle={{ paddingBottom: '20px' }}
          />
          {categories.map((category, index) => (
            <Bar
              key={category}
              dataKey={category}
              stackId="stack"
              fill={STACK_COLORS[index % STACK_COLORS.length]}
              name={category}
            />
          ))}
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}