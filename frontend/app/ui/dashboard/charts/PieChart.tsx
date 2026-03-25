'use client';

import { useEffect, useState } from 'react';
import { fetchChartData } from '@/app/lib/client_actions';
import { ChartDataResponse, ChartDef, FilterCondition } from '@/app/lib/definitions';
import {
        PieChart as RePieChart,
        Pie,
        Tooltip,
        ResponsiveContainer,
        Cell,
        Legend,
} from 'recharts';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';

interface Props {
        chart: ChartDef;
        dashboardId: string;
        interactiveFilters?: Record<string, any>;
}

// Extended color palette
const COLORS = [
        '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D',
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFE194', '#B4A5FF',
        '#E6B0AA', '#A8E6CF', '#FFD3B6', '#D4A5A5', '#9B7EDE', '#F7C978',
];

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
                const data = payload[0].payload;
                const total = payload[0].payload.total || 0;
                return (
                        <Box sx={{ bgcolor: 'background.paper', p: 1.5, boxShadow: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle2">{data.name}</Typography>
                                <Typography variant="body2">
                                        Value: <strong>{data.value}</strong>
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                        Percentage: {((data.value / total) * 100).toFixed(1)}%
                                </Typography>
                        </Box>
                );
        }
        return null;
};

// Custom legend that shows percentages
const renderLegend = (props: any) => {
        const { payload } = props;
        const total = payload.reduce((sum: number, entry: any) => sum + entry.payload.value, 0);
        return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, mt: 2 }}>
                        {payload.map((entry: any, index: number) => (
                                <Box key={`legend-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: entry.color }} />
                                        <Typography variant="caption">
                                                {entry.value}: {entry.payload.value}
                                                <Typography component="span" variant="caption" color="textSecondary">
                                                        ({((entry.payload.value / total) * 100).toFixed(1)}%)
                                                </Typography>
                                        </Typography>
                                </Box>
                        ))}
                </Box>
        );
};

export default function PieChart({ chart, dashboardId, interactiveFilters }: Props) {
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

        const chartData = data.labels.map((label, i) => ({
                name: label,
                value: data.data[i],
        })).filter(item => item.value > 0);

        const total = chartData.reduce((sum, item) => sum + item.value, 0);

        // Add total to each data point for tooltip
        const enrichedData = chartData.map(item => ({ ...item, total }));

        if (chartData.length === 0) {
                return (
                        <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>{chart.title}</Typography>
                                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography color="textSecondary">No data available</Typography>
                                </Box>
                        </Paper>
                );
        }

        return (
                <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>{chart.title}</Typography>
                        <Box sx={{ width: '100%', height: 400 }}>
                                <ResponsiveContainer>
                                        <RePieChart>
                                                <Pie
                                                        data={enrichedData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={120}
                                                        innerRadius={60}
                                                        fill="#8884d8"
                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                        labelLine={false}
                                                        paddingAngle={2}
                                                >
                                                        {enrichedData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                                                        ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend content={renderLegend} verticalAlign="bottom" height={80} />
                                        </RePieChart>
                                </ResponsiveContainer>
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 1, borderColor: 'divider' }}>
                                <Typography variant="caption">Total: <strong>{total}</strong></Typography>
                                <Typography variant="caption">Categories: <strong>{chartData.length}</strong></Typography>
                        </Box>
                </Paper>
        );
}
