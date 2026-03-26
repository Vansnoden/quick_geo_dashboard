'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchChartData } from '@/lib/client_actions';
import { DASHBOARD_CHART_DISTINCT_VALS } from '@/lib/constants';
import { ChartDef, FilterCondition } from '@/lib/definitions';
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
    chart: ChartDef;
    dashboardId: string;
    interactiveFilters?: Record<string, any>;
}

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

const useFilterConditions = (interactiveFilters?: Record<string, any>) => {
    return useMemo(() => {
        const conditions: FilterCondition[] = [];
        if (!interactiveFilters) return conditions;

        const processedColumns = new Set<string>();

        for (const [key, val] of Object.entries(interactiveFilters)) {
            if (val === '' || val === undefined || val === null) continue;

            if (key.endsWith('_min')) {
                const column = key.slice(0, -4);
                const maxKey = `${column}_max`;
                const maxVal = interactiveFilters[maxKey];
                if (maxVal !== undefined && maxVal !== '' && maxVal !== null) {
                    conditions.push({
                        column,
                        operator: 'between',
                        value: [Number(val), Number(maxVal)]
                    });
                    processedColumns.add(column);
                } else {
                    conditions.push({
                        column,
                        operator: '>=',
                        value: Number(val)
                    });
                    processedColumns.add(column);
                }
            } 
            else if (key.endsWith('_max')) {
                const column = key.slice(0, -4);
                if (!processedColumns.has(column)) {
                    conditions.push({
                        column,
                        operator: '<=',
                        value: Number(val)
                    });
                    processedColumns.add(column);
                }
            }
            else {
                if (Array.isArray(val) && val.length > 0) {
                    conditions.push({ column: key, operator: 'in', value: val });
                } 
                else if (typeof val === 'object' && val !== null) {
                    if ('min' in val && val.min !== undefined) {
                        conditions.push({ column: key, operator: '>=', value: Number(val.min) });
                    }
                    if ('max' in val && val.max !== undefined) {
                        conditions.push({ column: key, operator: '<=', value: Number(val.max) });
                    }
                } 
                else if (val !== '') {
                    conditions.push({ column: key, operator: '=', value: String(val) });
                }
            }
        }

        return conditions;
    }, [interactiveFilters]);
};

export default function StackedBarChart({ chart, dashboardId, interactiveFilters }: Props) {
    const [data, setData] = useState<StackedDataPoint[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    const filterConditions = useFilterConditions(interactiveFilters);

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
                // Merge chart filters with interactive filters
                const allBaseFilters = [
                    ...(chart.filters || []),
                    ...filterConditions
                ];

                // 1. Get unique categories to stack (with filters applied)
                const catResponse = await fetch(DASHBOARD_CHART_DISTINCT_VALS(Number(dashboardId)), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        column: chart.stackBy,
                        filters: allBaseFilters
                    })
                });
        
                if (!catResponse.ok) {
                    throw new Error('Failed to fetch categories');
                }
        
                const uniqueCategories = await catResponse.json();
                const validCategories = uniqueCategories.filter((cat: any) => cat != null);
                setCategories(validCategories);

                if (validCategories.length === 0) {
                    setData([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch data for each category (with filters + category filter)
                const allData: { [key: string]: any } = {};
        
                await Promise.all(validCategories.map(async (category: string) => {
                    const categoryFilter: FilterCondition = {
                        column: chart.stackBy!,
                        operator: '=',
                        value: category
                    };
          
                    const allFilters = [
                        ...(chart.filters || []),
                        ...filterConditions,
                        categoryFilter
                    ];
          
                    const response = await fetchChartData(dashboardId, {
                        ...chart,
                        filters: allFilters
                    });
          
                    response.labels.forEach((label: string, idx: number) => {
                        if (!allData[label]) {
                            allData[label] = { name: label };
                        }
                        allData[label][category] = response.data[idx];
                    });
                }));

                const dataArray = Object.values(allData);
                setData(dataArray);
        
            } catch (err: any) {
                console.error('Stacked bar chart error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStackedData();
    }, [dashboardId, chart, filterConditions]);

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
