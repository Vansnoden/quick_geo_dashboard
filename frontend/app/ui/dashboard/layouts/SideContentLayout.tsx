'use client';

import { useState, useEffect } from 'react';
import { DashboardConfig } from "@/app/lib/definitions";
import MenuSection from "../MenuSection";
import ChartList from "../charts/ChartList";
import dynamic from 'next/dynamic';
import InteractiveFilters from '../InteractiveFilters';
import {
        Box,
        Drawer,
        AppBar,
        Toolbar,
        Typography,
        IconButton,
        useMediaQuery,
        useTheme,
        Fab,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const MapView = dynamic(() => import('../MapView'), {
        ssr: false,
        loading: () => (
                <Box sx={{ height: '100%', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="textSecondary">Loading Spatial Data ...</Typography>
                </Box>
        ),
});

interface Props {
        config: DashboardConfig;
        dashboardId: string;
}

export default function SideContentLayout({ config, dashboardId }: Props) {
        const theme = useTheme();
        const isMobile = useMediaQuery(theme.breakpoints.down('md'));
        const [isSidebarOpen, setIsSidebarOpen] = useState(false);
        const [showBackToTop, setShowBackToTop] = useState(false);
        const [interactiveFilterValues, setInteractiveFilterValues] = useState<Record<string, any>>({});

        const handleInteractiveFilterChange = (values: Record<string, any>) => {
                setInteractiveFilterValues(values);
        };

        useEffect(() => {
                const handleScroll = () => {
                        setShowBackToTop(window.scrollY > 300);
                };
                window.addEventListener('scroll', handleScroll);
                return () => window.removeEventListener('scroll', handleScroll);
        }, []);

        const handleMenuItemClick = (sectionId: string) => {
                if (isMobile) setIsSidebarOpen(false);
                const element = document.getElementById(sectionId);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
        };

        const drawerWidth = 280;

        return (
                <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
                        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, display: { md: 'none' } }}>
                                <Toolbar>
                                        <IconButton
                                                color="inherit"
                                                edge="start"
                                                onClick={() => setIsSidebarOpen(true)}
                                        >
                                                <MenuIcon />
                                        </IconButton>
                                        <Typography variant="h6" noWrap component="div">
                                                {config.name}
                                        </Typography>
                                </Toolbar>
                        </AppBar>

                        <Drawer
                                variant={isMobile ? 'temporary' : 'permanent'}
                                open={isMobile ? isSidebarOpen : true}
                                onClose={() => setIsSidebarOpen(false)}
                                sx={{
                                        width: drawerWidth,
                                        flexShrink: 0,
                                        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                                }}
                        >
                                <Toolbar sx={{ justifyContent: 'space-between' }}>
                                        <Typography variant="h6">Jump to</Typography>
                                        {isMobile && (
                                                <IconButton onClick={() => setIsSidebarOpen(false)}>
                                                        <MenuIcon />
                                                </IconButton>
                                        )}
                                </Toolbar>
                                <Box sx={{ p: 2 }}>
                                        <Box component="nav" sx={{ mb: 2 }}>
                                                <Typography variant="overline" color="textSecondary">
                                                        Navigation
                                                </Typography>
                                                <Box component="ul" sx={{ listStyle: 'none', p: 0 }}>
                                                        {['about-section', 'statistics-section', 'map-section'].map((id, idx) => (
                                                                <Box component="li" key={idx} sx={{ mb: 1 }}>
                                                                        <Typography
                                                                                component="button"
                                                                                onClick={() => handleMenuItemClick(id)}
                                                                                sx={{ textAlign: 'left', width: '100%', p: 1, bgcolor: 'transparent', border: 'none', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                                                                        >
                                                                                {id.replace('-section', '').toUpperCase()}
                                                                        </Typography>
                                                                </Box>
                                                        ))}
                                                </Box>
                                        </Box>

                                        {config.interactiveFilters && config.interactiveFilters.length > 0 && (
                                                <InteractiveFilters
                                                        dashboardId={dashboardId}
                                                        filters={config.interactiveFilters}
                                                        onFilterChange={handleInteractiveFilterChange}
                                                />
                                        )}
                                </Box>
                        </Drawer>

                        <Box
                                component="main"
                                sx={{
                                        flexGrow: 1,
                                        p: 3,
                                        overflowY: 'auto',
                                        mt: { xs: 8, md: 0 },
                                }}
                        >
                                <Toolbar sx={{ display: { md: 'none' } }} />
                                <Typography variant="h3" component="h1" gutterBottom>
                                        {config.name}
                                </Typography>

                                <Box id="about-section" sx={{ mb: 4 }}>
                                        <MenuSection title="About" content={config.menus.about} />
                                </Box>

                                <Box id="statistics-section" sx={{ mb: 4 }}>
                                        <MenuSection title="Statistics" content={config.menus.stats} />
                                        <ChartList charts={config.stats} dashboardId={dashboardId} interactiveFilters={interactiveFilterValues} />
                                </Box>

                                <Box id="map-section">
                                        <MenuSection title="Map Layers" content={config.menus.map} />
                                        <Typography variant="h6" gutterBottom>Geospatial Distribution</Typography>
                                        <Box sx={{ height: { xs: 400, md: 500 }, width: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                                                <MapView dashboardId={dashboardId} interactiveFilters={interactiveFilterValues} />
                                        </Box>
                                </Box>

                                {showBackToTop && (
                                        <Fab
                                                color="primary"
                                                size="small"
                                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                                sx={{ position: 'fixed', bottom: 16, right: 16 }}
                                        >
                                                <KeyboardArrowUpIcon />
                                        </Fab>
                                )}
                        </Box>
                </Box>
        );
}
