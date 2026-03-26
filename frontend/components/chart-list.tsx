'use client';

import { ChartDef } from "@/lib/definitions";
import BarChart from "@/components/bar-chart";
import LineChart from "@/components/line-chart";
import PieChart from "@/components/pie-chart";
import StackedBarChart from '@/components/stacked-bar-chart';


interface Props {   
    charts: ChartDef[];
    dashboardId: string;
    interactiveFilters?: Record<string, any>; 
}

export default function ChartList({ charts, dashboardId, interactiveFilters }: Props) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {charts.map((chart, idx) => {
                switch (chart.type) {
                    case 'bar': 
                        return <BarChart key={idx} chart={chart} 
                                    dashboardId={dashboardId} interactiveFilters={interactiveFilters}/>;
                    case 'line': 
                        return <LineChart key={idx} chart={chart} 
                                    dashboardId={dashboardId} interactiveFilters={interactiveFilters}/>;
                    case 'pie': 
                        return <PieChart key={idx} chart={chart} 
                                    dashboardId={dashboardId} interactiveFilters={interactiveFilters}/>;
                    case 'stackedbar': 
                        return <StackedBarChart key={idx} chart={chart} 
                                    dashboardId={dashboardId} interactiveFilters={interactiveFilters}/>;
                    default: return null;
                }
            })}
        </div>
    );
}
