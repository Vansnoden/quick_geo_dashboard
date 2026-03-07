'use client';

import { DashboardConfig } from "@/app/lib/definitions";
import MenuSection from "../MenuSection";
import ChartList from "../charts/ChartList";
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('../MapView'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse" /> 
});



interface Props {
  config: DashboardConfig;
  dashboardId: string;
}

export default function SideContentLayout({ config, dashboardId }: Props) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
        <MenuSection title="About" content={config.menus.about} />
        <MenuSection title="Stats" content={config.menus.stats} />
        <MenuSection title="Map" content={config.menus.map} />
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">{config.name}</h1>
        <div className="mb-6">
          <ChartList charts={config.stats} dashboardId={dashboardId} />
        </div>
        <div className="h-96 border rounded">
          <MapView
            dashboardId={dashboardId}
            latCol={config.map.lat}
            lonCol={config.map.lon}
          />
        </div>
      </div>
    </div>
  );
}