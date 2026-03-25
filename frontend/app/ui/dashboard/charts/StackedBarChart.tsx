'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchChartData } from '@/app/lib/client_actions';
import { DASHBOARD_CHART_DISTINCT_VALS } from '@/app/lib/constants';
import { ChartDef, FilterCondition } from '@/app/lib/definitions';
import {
        BarChart as ReBarChart,
        Bar,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        Legend,
        ResponsiveContainer,
} from 'recharts';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';

interface Props {
        chart: ChartDef;
        dashboardId: string;
        interactiveFilters?: Record<string, any>;
}

// Color palette for stacked categories
const STACK_COLORS = [
        '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
        '#ec4899', '#06b6d4', '#f97316', '#6b7280', '#84cc16',
];

interface StackedDataPoint {
        name: string;
        [key: string]: string | number;
}

// Helper to convert interactive filters to FilterCondition array
const useFilterConditions = (interactiveFilters?: Record<string, any>) => {
        return useMemo(() => {
                const conditions: FilterCondition[] = [];
                if (!interactiveFilters) return conditions;

                Object.entries(interactiveFilters).forEach(([key, val]) => {
                        if (val === '' || val === undefined || val === null) return;

                        if (key.endsWith('_min')) {
                                const column = key.replace('_min', '');
                                const maxVal = interactiveFilters[`${column}_max`];
                                if (maxVal !== undefined && maxVal !== '' && maxVal !== null) {
                                        conditions.push({ column, operator: 'between', value: [Number(val), Number(maxVal)] });
                                } else {
                                        conditions.push({ column, operator: '>=', value: Number(val) });
                                }
                        } else if (key.endsWith('_max')) {
                                // skip, handled by _min
                                return;
                        } else if (Array.isArray(val) && val.length > 0) {
                                conditions.push({ column: key, operator: 'in', value: val });
                        } else if (typeof val === 'object' && val !== null) {
                                if ('min' in val && val.min !== undefined) {
                                        conditions.push({ column: key, operator: '>=', value: Number(val.min) });
                                }
                                if ('max' in val && val.max !== undefined) {
                                        conditions.push({ column: key, operator: '<=', value: Number(val.max) });
                                }
                        } else if (val !== '') {
                                conditions.push({ column: key, operator: '=', value: String(val) });
                        }
                });

                return conditions.filter((f, index, self) =>
                        index === self.findIndex(t =>
                                t.column === f.column &&
                                t.operator === f.operator &&
                                JSON.stringify(t.value) === JSON.stringify(f.value)
                        )
                );
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
                                        ...filterConditions,
                                ];

                                // 1. Get unique categories to stack
                                const catResponse = await fetch(DASHBOARD_CHART_DISTINCT_VALS(Number(dashboardId)), {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ column: chart.stackBy, filters: allBaseFilters }),
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

                                // 2. Fetch data for each category
                                const allData: { [key: string]: any } = {};

                                await Promise.all(validCategories.map(async (category: string) => {
                                        const categoryFilter: FilterCondition = {
                                                column: chart.stackBy!,
                                                operator: '=',
                                                value: category,
                                        };

                                        const allFilters = [
                                                ...(chart.filters || []),
                                                ...filterConditions,
                                                categoryFilter,
                                        ];

                                        const response = await fetchChartData(dashboardId, {
                                                ...chart,
                                                filters: allFilters,
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

        if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />;
        if (error) return <Typography color="error">Error: {error}</Typography>;
        if (data.length === 0) return <Typography color="textSecondary">No data available</Typography>;

        return (
                <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>{chart.title}</Typography>
                        <Box sx={{ width: '100%', height: 400 }}>
                                <ResponsiveContainer>
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
                                                                border: '1px solid #e2e8f0',
                                                        }}
                                                />
                                                <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '20px' }} />
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
                        </Box>
                </Paper>
        );
}
