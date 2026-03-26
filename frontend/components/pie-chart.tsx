'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchChartData } from '@/lib/client_actions';
import { ChartDataResponse, ChartDef, FilterCondition } from '@/lib/definitions';
import {
    PieChart as RePieChart,
    Pie,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from 'recharts';

interface Props {
    chart: ChartDef;
    dashboardId: string;
    interactiveFilters?: Record<string, any>;
}

const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D',
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFE194', '#B4A5FF',
    '#E6B0AA', '#A8E6CF', '#FFD3B6', '#D4A5A5', '#9B7EDE', '#F7C978'
];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-900">{data.name}</p>
                <p className="text-sm text-gray-600">
                    Value: 
                    <span className="font-medium text-purple-600">{data.value}</span>
                </p>
                <p className="text-xs text-gray-500">
                    Percentage: 
                    <span className="font-medium">{((data.value / payload[0].total) * 100).toFixed(1)}%</span>
                </p>
            </div>
        );
    }
    return null;
};

const renderLegend = (props: any) => {
    const { payload } = props;
    const total = payload.reduce((sum: number, entry: any) => sum + entry.payload.value, 0);
    return (
        <ul className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
            {payload.map((entry: any, index: number) => (
                <li key={`legend-${index}`} className="flex items-center gap-2">
                    <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-gray-700">
                        {entry.value}: <span className="font-medium">{entry.payload.value}</span>
                        <span className="text-gray-500 ml-1">
                            ({((entry.payload.value / total) * 100).toFixed(1)}%)
                        </span>
                    </span>
                </li>
            ))}
        </ul>
    );
};

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

    const chartData = data.labels.map((label, i) => ({
        name: label,
        value: data.data[i]
    })).filter(item => item.value > 0);

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">{chart.title}</h3>
            {chartData.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-gray-500">
                    No data available for this chart
                </div>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={400}>
                        <RePieChart>
                            <Pie
                                data={chartData}
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
                            <Legend 
                                content={renderLegend}
                                verticalAlign="bottom"
                                height={80}
                            />
                        </RePieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 flex justify-between">
                        <span>Total: <span className="font-semibold text-purple-600">{total}</span></span>
                        <span>Categories: <span className="font-semibold text-purple-600">{chartData.length}</span></span>
                    </div>
                </>
            )}
        </div>
    );
}
