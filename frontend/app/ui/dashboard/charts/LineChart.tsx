'use client';

import { useEffect, useState } from 'react';
import { fetchChartData } from '@/app/lib/client_actions';
import { ChartDataResponse, ChartDef, FilterCondition } from '@/app/lib/definitions';
import {
        LineChart as ReLineChart,
        Line,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        ResponsiveContainer,
} from 'recharts';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';

interface Props {
        chart: ChartDef;
        dashboardId: string;
        interactiveFilters?: Record<string, any>;
}

export default function LineChart({ chart, dashboardId, interactiveFilters }: Props) {
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

        if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />;
        if (error) return <Typography color="error">Error: {error}</Typography>;
        if (!data) return null;

        const chartData = data.labels.map((label, i) => ({ name: label, value: data.data[i] }));

        return (
                <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>{chart.title}</Typography>
                        <Box sx={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                        <ReLineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="value" stroke="#8884d8" />
                                        </ReLineChart>
                                </ResponsiveContainer>
                        </Box>
                </Paper>
        );
}
