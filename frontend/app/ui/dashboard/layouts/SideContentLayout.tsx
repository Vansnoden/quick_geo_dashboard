"use client";

import { useState, useEffect } from "react";
import { DashboardConfig } from "@/app/lib/definitions";
import MenuSection from "../MenuSection";
import ChartList from "../charts/ChartList";
import dynamic from "next/dynamic";
import InteractiveFilters from "../InteractiveFilters";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";

const MapView = dynamic(() => import("../MapView"), {
        ssr: false,
        loading: () => (
                <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center rounded border">
                        <span className="text-gray-400 text-sm">Loading Spatial Data ...</span>
                </div>
        ),
});

interface Props {
        config: DashboardConfig;
        dashboardId: string;
}

export default function SideContentLayout({ config, dashboardId }: Props) {
        const [isMobile, setIsMobile] = useState(false);
        const [showBackToTop, setShowBackToTop] = useState(false);
        const [interactiveFilterValues, setInteractiveFilterValues] = useState<Record<string, any>>({});

        const handleInteractiveFilterChange = (values: Record<string, any>) => {
                setInteractiveFilterValues(values);
        };

        useEffect(() => {
                const checkMobile = () => setIsMobile(window.innerWidth < 768);
                checkMobile();
                window.addEventListener("resize", checkMobile);
                const handleScroll = () => setShowBackToTop(window.scrollY > 300);
                window.addEventListener("scroll", handleScroll);
                return () => {
                        window.removeEventListener("resize", checkMobile);
                        window.removeEventListener("scroll", handleScroll);
                };
        }, []);

        const handleMenuItemClick = (sectionId: string) => {
                const element = document.getElementById(sectionId);
                if (element) element.scrollIntoView({ behavior: "smooth" });
        };

        const SidebarContent = () => (
                <div className="p-6">
                        {/* Menu navigation items */}
                        <nav className="mb-6 pb-4 border-b border-gray-200">
                                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Jump to</h2>
                                <div className="space-y-2">
                                        <Button
                                                variant="ghost"
                                                className="w-full justify-start text-sm font-normal"
                                                onClick={() => handleMenuItemClick("about-section")}
                                        >
                                                About
                                        </Button>
                                        <Button
                                                variant="ghost"
                                                className="w-full justify-start text-sm font-normal"
                                                onClick={() => handleMenuItemClick("statistics-section")}
                                        >
                                                Statistics
                                        </Button>
                                        <Button
                                                variant="ghost"
                                                className="w-full justify-start text-sm font-normal"
                                                onClick={() => handleMenuItemClick("map-section")}
                                        >
                                                Map
                                        </Button>
                                </div>
                        </nav>

                        {config.interactiveFilters && config.interactiveFilters.length > 0 && (
                                <InteractiveFilters
                                        dashboardId={dashboardId}
                                        filters={config.interactiveFilters}
                                        onFilterChange={handleInteractiveFilterChange}
                                />
                        )}
                </div>
        );

        return (
                <div className="flex h-screen bg-white relative">
                        {/* Mobile Sidebar */}
                        {isMobile ? (
                                <Sheet>
                                        <SheetTrigger asChild>
                                                <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50">
                                                        <Menu className="h-5 w-5" />
                                                </Button>
                                        </SheetTrigger>
                                        <SheetContent side="left" className="w-80 p-0">
                                                <SidebarContent />
                                        </SheetContent>
                                </Sheet>
                        ) : (
                                <aside className="w-80 bg-gray-50 border-r border-gray-200 h-full overflow-y-auto">
                                        <SidebarContent />
                                </aside>
                        )}

                        {/* Main content */}
                        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                                <header className="p-4 md:p-6 border-b border-gray-100 flex items-center gap-4">
                                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex-1">
                                                {config.name}
                                        </h1>
                                </header>

                                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
                                        {/* About section */}
                                        <div id="about-section">
                                                <MenuSection title="About" content={config.menus.about} />
                                        </div>

                                        {/* Stats Section */}
                                        <section id="statistics-section" className="scroll-mt-4">
                                                <MenuSection title="Statistics" content={config.menus.stats} />
                                                <ChartList
                                                        charts={config.stats}
                                                        dashboardId={dashboardId}
                                                        interactiveFilters={interactiveFilterValues}
                                                />
                                        </section>

                                        {/* Map Section */}
                                        <section id="map-section" className="space-y-3 scroll-mt-4">
                                                <MenuSection title="Map Layers" content={config.menus.map} />
                                                <h2 className="text-lg font-semibold text-gray-700">Geospatial Distribution</h2>
                                                <div className="w-full h-100 md:h-125 border border-gray-200 rounded-xl overflow-hidden shadow-sm relative">
                                                        <MapView dashboardId={dashboardId} interactiveFilters={interactiveFilterValues} />
                                                </div>
                                        </section>
                                </div>

                                {showBackToTop && (
                                        <Button
                                                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                                className="fixed bottom-6 right-6 rounded-full p-3"
                                                size="icon"
                                        >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                </svg>
                                        </Button>
                                )}
                        </main>
                </div>
        );
}
