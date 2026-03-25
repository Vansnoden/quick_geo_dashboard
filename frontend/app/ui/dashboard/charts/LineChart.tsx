"use client";

import { fetchChartData } from "@/app/lib/client_actions";
import { ChartDataResponse, ChartDef, FilterCondition } from "@/app/lib/definitions";
import { useEffect, useState } from "react";

import {
        LineChart as ReLineChart,
        Line,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
                                <ResponsiveContainer width="100%" height={300}>
                                        <ReLineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="value" stroke="#8884d8" />
                                        </ReLineChart>
                                </ResponsiveContainer>
                        </CardContent>
                </Card>
        );
}
