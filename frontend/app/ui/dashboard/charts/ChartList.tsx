'use client';

import { ChartDef } from "@/app/lib/definitions";
import BarChart from "./BarChart";
import LineChart from "./LineChart";
import PieChart from "./PieChart";
import StackedBarChart from "./StackedBarChart";
import { Grid } from '@mui/material';

interface Props {
        charts: ChartDef[];
        dashboardId: string;
        interactiveFilters?: Record<string, any>;
}

export default function ChartList({ charts, dashboardId, interactiveFilters }: Props) {
        return (
                <Grid container spacing={2}>
                        {charts.map((chart, idx) => {
                                switch (chart.type) {
                                        case 'bar': return <Grid item xs={12} md={6} key={idx}><BarChart chart={chart} dashboardId={dashboardId} interactiveFilters={interactiveFilters} /></Grid>;
                                        case 'line': return <Grid item xs={12} md={6} key={idx}><LineChart chart={chart} dashboardId={dashboardId} interactiveFilters={interactiveFilters} /></Grid>;
                                        case 'pie': return <Grid item xs={12} md={6} key={idx}><PieChart chart={chart} dashboardId={dashboardId} interactiveFilters={interactiveFilters} /></Grid>;
                                        case 'stackedbar': return <Grid item xs={12} md={6} key={idx}><StackedBarChart chart={chart} dashboardId={dashboardId} interactiveFilters={interactiveFilters} /></Grid>;
                                        default: return null;
                                }
                        })}
                </Grid>
        );
}
