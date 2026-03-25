"use client";

import { fetchChartData } from "@/app/lib/client_actions";
import { ChartDataResponse, ChartDef, FilterCondition } from "@/app/lib/definitions";
import { useEffect, useState } from "react";
import {
        BarChart as ReBarChart,
        Bar,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        ResponsiveContainer,
        Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
        "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe",
        "#00c49f", "#ffbb28", "#ff6b6b", "#a05e8a", "#d0bb57",
        "#8dd1e1", "#b0e57c", "#fe938c", "#7b6c8c", "#6b5b7c",
];

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
                                if (val === "" || val === undefined || (Array.isArray(val) && val.length === 0)) return;
                                if (Array.isArray(val)) {
                                        extraFilters.push({ column: col, operator: "in", value: val });
                                } else if (typeof val === "object" && val.min !== undefined && val.max !== undefined) {
                                        extraFilters.push({ column: col, operator: ">=", value: val.min });
                                        extraFilters.push({ column: col, operator: "<=", value: val.max });
                                } else {
                                        extraFilters.push({ column: col, operator: "=", value: val });
                                }
                        });
                }
                fetchChartData(dashboardId, chart, extraFilters)
                        .then(setData)
                        .catch((err) => setError(err.message))
                        .finally(() => setLoading(false));
        }, [dashboardId, chart, interactiveFilters]);

        if (loading) return <Card className="h-64 bg-gray-200 animate-pulse" />;
        if (error) return <Card className="text-red-500 p-4">Error: {error}</Card>;
        if (!data) return null;

        const chartData = data.labels.map((label, i) => ({ name: label, value: data.data[i] }));

        return (
                <Card>
                        <CardHeader>
                                <CardTitle>{chart.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                        <ReBarChart data={chartData} margin={{ bottom: 60 }}>
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
                                                <Tooltip />
                                                <Bar dataKey="value">
                                                        {chartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                </Bar>
                                        </ReBarChart>
                                </ResponsiveContainer>
                        </CardContent>
                </Card>
        );
}
