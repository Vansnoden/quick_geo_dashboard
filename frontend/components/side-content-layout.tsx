'use client';

import { useState, useEffect } from 'react';
import { DashboardConfig } from "@/lib/definitions";
import MenuSection from "@/components/menu-section";
import ChartList from "@/components/chart-list";
import dynamic from 'next/dynamic';
import InteractiveFilters from '@/components/interactive-filters';

// Dynamic import with a consistent height loader to prevent layout shift
const MapView = dynamic(() => import('@/components/map-view'), { 
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [interactiveFilterValues, setInteractiveFilterValues] = useState<Record<string, any>>({});

    const handleInteractiveFilterChange = (values: Record<string, any>) => {
        setInteractiveFilterValues(values);
    };

    // Check if mobile on mount and when window resizes
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
    
        checkMobile();
        window.addEventListener('resize', checkMobile);

        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
    
        return () => {
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('scroll', handleScroll);
        };
     }, []);

    // Close sidebar when clicking a menu item on mobile
    const handleMenuItemClick = (sectionId: string) => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    
        // Scroll to section
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="flex h-screen bg-white relative">
            {/* Overlay for mobile when sidebar is open */}
            {isMobile && isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-20"
                onClick={() => setIsSidebarOpen(false)}
            />
            )}

            {/* Sidebar - Collapsible drawer */}
            <aside 
                className={`
                fixed md:static top-0 left-0 z-30
                w-80 bg-gray-50 border-r border-gray-200 
                transition-transform duration-300 ease-in-out
                h-full overflow-y-auto p-6
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                {/* Close button for mobile */}
                {isMobile && (
                <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-200"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                )}

                {/* Menu navigation items */}
                <nav className="mb-6 pb-4 border-b border-gray-200">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Jump to</h2>
                    <div className="space-y-2">
                        <button
                            onClick={() => handleMenuItemClick('about-section')}
                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            About
                        </button>
                        <button
                            onClick={() => handleMenuItemClick('statistics-section')}
                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Statistics
                        </button>
                        <button
                            onClick={() => handleMenuItemClick('map-section')}
                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Map
                        </button>
                    </div>
                </nav>

                {config.interactiveFilters && config.interactiveFilters.length > 0 && (
                <InteractiveFilters
                    dashboardId={dashboardId}
                    filters={config.interactiveFilters}
                    onFilterChange={handleInteractiveFilterChange}
                />
                )}
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header with menu toggle */}
                <header className="p-4 md:p-6 border-b border-gray-100 flex items-center gap-4">
                    {/* Hamburger menu button - visible on mobile and when sidebar is closed on desktop? optional */}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                        aria-label="Open menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
          
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex-1">
                        {config.name}
                    </h1>
                </header>


                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
                    {/* About section */}
                    <div className="space-y-8">
                        <div id="about-section">
                            <MenuSection title="About" content={config.menus.about} />
                        </div>
                    </div>

                    {/* Stats Section */}
                    <section id="statistics-section" className="scroll-mt-4">
                        <MenuSection title="Statistics" content={config.menus.stats} />
                        <ChartList charts={config.stats} dashboardId={dashboardId} interactiveFilters={interactiveFilterValues}/>
                    </section>

                    {/* Map Section */}
                    <section id="map-section" className="space-y-3 scroll-mt-4">
                        <MenuSection title="Map Layers" content={config.menus.map} />
                        <h2 className="text-lg font-semibold text-gray-700">Geospatial Distribution</h2>
                        <div className="w-full h-100 md:h-125 border border-gray-200 rounded-xl overflow-hidden shadow-sm relative">
                            <MapView dashboardId={dashboardId} interactiveFilters={interactiveFilterValues}/>
                        </div>
                    </section>
                </div>
                {showBackToTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-6 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-40"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                </button>
                )}
            </main>
        </div>
    );
}
