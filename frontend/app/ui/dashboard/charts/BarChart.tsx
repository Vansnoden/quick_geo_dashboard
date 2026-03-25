'use client';

import { useEffect, useState } from 'react';
import { fetchChartData } from '@/app/lib/client_actions';
import { ChartDataResponse, ChartDef, FilterCondition } from '@/app/lib/definitions';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28', '#ff6b6b'];

interface Props {
        chart: ChartDef;
        dashboardId: string;
        interactiveFilters?: Record<string, any>;
}

export default function BarChart({ chart, dashboardId, interactiveFilters }: Props) {
        const [data, setData] = useState<ChartDataResponse | null>(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
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

        if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />;
        if (error) return <Typography color="error">Error: {error}</Typography>;
        if (!data) return null;

        const chartData = data.labels.map((label, i) => ({ name: label, value: data.data[i] }));

        return (
                <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>{chart.title}</Typography>
                        <Box sx={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer>
                                        <ReBarChart data={chartData} margin={{ bottom: 60 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" angle={45} textAnchor="start" height={80} interval={0} tick={{ fontSize: 11 }} />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar dataKey="value">
                                                        {chartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                </Bar>
                                        </ReBarChart>
                                </ResponsiveContainer>
                        </Box>
                </Paper>
        );
}
