'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchChartData } from '@/lib/client_actions';
import { ChartDataResponse, ChartDef, FilterCondition } from '@/lib/definitions';
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
    interactiveFilters?: Record<string, any>;
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

export default function LineChart({ chart, dashboardId, interactiveFilters }: Props) {
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
