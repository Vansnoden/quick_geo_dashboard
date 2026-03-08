'use client';

import { ChartDef } from "@/app/lib/definitions";
import BarChart from "./BarChart";
import LineChart from "./LineChart";
import PieChart from "./PieChart";
import StackedBarChart from './StackedBarChart';



interface Props {
  charts: ChartDef[];
  dashboardId: string;
}

export default function ChartList({ charts, dashboardId }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {charts.map((chart, idx) => {
        switch (chart.type) {
          case 'bar': return <BarChart key={idx} chart={chart} dashboardId={dashboardId} />;
          case 'line': return <LineChart key={idx} chart={chart} dashboardId={dashboardId} />;
          case 'pie': return <PieChart key={idx} chart={chart} dashboardId={dashboardId} />;
          case 'stackedbar': return <StackedBarChart key={idx} chart={chart} dashboardId={dashboardId} />;;
          default: return null;
        }
      })}
    </div>
  );
}