'use client';

import { DashboardConfig } from "@/app/lib/definitions";
import MenuSection from "../MenuSection";
import ChartList from "../charts/ChartList";
import dynamic from 'next/dynamic';

// Dynamic import with a consistent height loader to prevent layout shift
const MapView = dynamic(() => import('../MapView'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center rounded border">
      <span className="text-gray-400 text-sm">Loading Spatial Data ...</span>
    </div>
  ) 
});

interface Props {
  config: DashboardConfig;
  dashboardId: string;
}

export default function SideContentLayout({ config, dashboardId }: Props) {
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - Fixed width with smooth scrolling */}
      <aside className="w-80 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto shrink-0">
        <div className="space-y-8">
          <MenuSection title="About" content={config.menus.about} />
          <MenuSection title="Statistics" content={config.menus.stats} />
          <MenuSection title="Map Layers" content={config.menus.map} />
        </div>
      </aside>

      {/* Main content - Flex-1 grows to fill remaining space */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="p-6 border-b border-gray-100">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {config.name}
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Stats Section */}
          <section>
            <ChartList charts={config.stats} dashboardId={dashboardId} />
          </section>

          {/* Map Section - Container must have relative positioning */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-700">Geospatial Distribution</h2>
            <div className="w-full h-125 border border-gray-200 rounded-xl overflow-hidden shadow-sm relative">
              {/* By wrapping it in a relative div with a hard height, Leaflet has a boundary to fill */}
              <MapView
                dashboardId={dashboardId}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}