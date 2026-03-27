'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchChartData } from '@/lib/client_actions';
import { ChartDataResponse, ChartDef, FilterCondition } from '@/lib/definitions';
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
    interactiveFilters?: Record<string, any>;
}

// Extended color palette
const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D',
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFE194', '#B4A5FF',
    '#E6B0AA', '#A8E6CF', '#FFD3B6', '#D4A5A5', '#9B7EDE', '#F7C978'
];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const total = payload[0].payload.total;
        const percent = ((data.value / total) * 100).toFixed(1);
        return (
            <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-900">{data.name}</p>
                <p className="text-sm text-gray-600">
                    Value: <span className="font-medium text-purple-600">{data.value}</span>
                </p>
                <p className="text-xs text-gray-500">
                    Percentage: <span className="font-medium">{percent}%</span>
                </p>
            </div>
        );
    }
    return null;
};

// Custom legend that wraps and scrolls if needed
const CustomLegend = ({ data }: { data: Array<{ name: string; value: number; color: string }> }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return (
        <div className="mt-4 max-h-48 overflow-y-auto border-t border-gray-100 pt-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {data.map((entry, index) => {
                    const percent = ((entry.value / total) * 100).toFixed(1);
                    return (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-gray-700 truncate" title={entry.name}>
                                {entry.name}
                            </span>
                            <span className="text-gray-500 ml-auto text-xs">
                                {percent}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Hook to convert interactive filters to FilterCondition[]
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
                    conditions.push({ column, operator: '>=', value: Number(val) });
                    processedColumns.add(column);
                }
            } else if (key.endsWith('_max')) {
                const column = key.slice(0, -4);
                if (!processedColumns.has(column)) {
                    conditions.push({ column, operator: '<=', value: Number(val) });
                    processedColumns.add(column);
                }
            } else {
                if (Array.isArray(val) && val.length > 0) {
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
            }
        }

        return conditions;
    }, [interactiveFilters]);
};

export default function PieChart({ chart, dashboardId, interactiveFilters }: Props) {
    const [data, setData] = useState<ChartDataResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const filterConditions = useFilterConditions(interactiveFilters);

    useEffect(() => {
        fetchChartData(dashboardId, chart, filterConditions)
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [dashboardId, chart, filterConditions]);

    if (loading) return <div className="h-80 bg-gray-200 animate-pulse rounded" />;
    if (error) return <div className="text-red-500">Error: {error}</div>;
    if (!data) return null;

    const chartData = data.labels
        .map((label, i) => ({
            name: label,
            value: data.data[i]
        }))
        .filter(item => item.value > 0);

    if (chartData.length === 0) {
        return (
            <div className="bg-white p-4 rounded shadow">
                <h3 className="text-lg font-semibold mb-2">{chart.title}</h3>
                <div className="h-80 flex items-center justify-center text-gray-500">
                    No data available
                </div>
            </div>
        );
    }

    // Prepare legend data with colors
    const legendData = chartData.map((item, idx) => ({
        ...item,
        color: COLORS[idx % COLORS.length]
    }));

    return (
        <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">{chart.title}</h3>
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Chart container */}
                <div className="w-full lg:w-2/3 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                            <Pie
                                data={chartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius="70%"
                                fill="#8884d8"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                                paddingAngle={2}
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
                        </RePieChart>
                    </ResponsiveContainer>
                </div>
                {/* Legend container */}
                <div className="w-full lg:w-1/3">
                    <CustomLegend data={legendData} />
                </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
                Total: {chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString()} records
            </div>
        </div>
    );
}
