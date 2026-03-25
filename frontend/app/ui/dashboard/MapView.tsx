'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { fetchDashboardConfig } from '@/app/lib/client_actions';
import { DashboardConfig, FilterCondition, MapStyleRule } from '@/app/lib/definitions';
import { Feature, Point, GeoJsonProperties } from 'geojson';
import { DASHBOARD_MAP_POINTS_IN_VIEW_URL, DASHBOARD_MAP_POINTS_URL, DASHBOARD_FILTERED_MAP_POINTS_URL } from '@/app/lib/constants';
import { Box, Paper, Typography } from '@mui/material';

interface Props {
        dashboardId: string;
        interactiveFilters?: Record<string, any>;
}

// Helper function to apply style rules
const getColorFromRules = (properties: GeoJsonProperties, rules: MapStyleRule[], defaultColor: string): string => {
        if (!properties) return defaultColor;
        for (const rule of rules) {
                const fieldValue = properties[rule.field];
                if (fieldValue === undefined || fieldValue === null) continue;
                const operator = rule.operator || '=';
                switch (operator) {
                        case '=':
                                if (String(fieldValue) === String(rule.value)) return rule.color;
                                break;
                        case '!=':
                                if (String(fieldValue) !== String(rule.value)) return rule.color;
                                break;
                        case 'like':
                                if (typeof fieldValue === 'string' && typeof rule.value === 'string') {
                                        const pattern = rule.value.replace(/%/g, '.*');
                                        if (new RegExp(pattern, 'i').test(fieldValue)) return rule.color;
                                }
                                break;
                        case 'in':
                                if (Array.isArray(rule.value)) {
                                        const stringValues = rule.value.map(v => String(v));
                                        if (stringValues.includes(String(fieldValue))) return rule.color;
                                }
                                break;
                }
        }
        return defaultColor;
};

// Helper to get size based on field
const getSizeFromField = (properties: GeoJsonProperties, sizeBy: string | undefined, defaultSize: number, minSize: number, maxSize: number): number => {
        if (!sizeBy || !properties) return defaultSize;
        const value = properties[sizeBy];
        if (!value || isNaN(Number(value))) return defaultSize;
        const scaled = Math.log(Number(value) + 1) * 3;
        return Math.min(maxSize, Math.max(minSize, scaled));
};

// Type guard
const isPointFeature = (feature: Feature): feature is Feature<Point> => {
        return feature.geometry?.type === 'Point';
};

// Helper to convert interactive filters to FilterCondition array
const useFilterConditions = (interactiveFilters?: Record<string, any>) => {
        return useMemo(() => {
                const conditions: FilterCondition[] = [];
                if (!interactiveFilters) return conditions;

                Object.entries(interactiveFilters).forEach(([key, val]) => {
                        if (val === '' || val === undefined || val === null) return;
                        if (key.endsWith('_min')) {
                                const column = key.replace('_min', '');
                                const maxVal = interactiveFilters[`${column}_max`];
                                if (maxVal !== undefined && maxVal !== '' && maxVal !== null) {
                                        conditions.push({ column, operator: 'between', value: [Number(val), Number(maxVal)] });
                                } else {
                                        conditions.push({ column, operator: '>=', value: Number(val) });
                                }
                        } else if (key.endsWith('_max')) {
                                return;
                        } else if (Array.isArray(val) && val.length > 0) {
                                conditions.push({ column: key, operator: 'in', value: val });
                        } else if (typeof val === 'object' && val !== null) {
                                if ('min' in val && val.min !== undefined) {
                                        conditions.push({ column: key, operator: '>=', value: Number(val.min) });
                                }
                                if ('max' in val && val.max !== undefined) {
                                        conditions.push({ column: key, operator: '<=', value: Number(val.max) });
                                }
                        } else if (val !== '') {
                                conditions.push({ column: key, operator: '=', value: String(val) });
                        }
                });
                return conditions.filter((f, index, self) =>
                        index === self.findIndex(t =>
                                t.column === f.column &&
                                t.operator === f.operator &&
                                JSON.stringify(t.value) === JSON.stringify(f.value)
                        )
                );
        }, [interactiveFilters]);
};

// Legend component using MUI
const Legend = ({ style, position }: { style: any; position: string }) => {
        const positionMap: Record<string, any> = {
                topleft: { top: 16, left: 16 },
                topright: { top: 16, right: 16 },
                bottomleft: { bottom: 16, left: 16 },
                bottomright: { bottom: 16, right: 16 },
        };
        const pos = positionMap[position] || positionMap.bottomright;

        const legendItems = style.rules
                .filter((rule: MapStyleRule, index: number, self: MapStyleRule[]) =>
                        index === self.findIndex((r) => r.color === rule.color)
                )
                .map((rule: MapStyleRule) => ({
                        color: rule.color,
                        label: rule.label || `${rule.field}: ${rule.value}`,
                }));

        return (
                <Paper sx={{ position: 'absolute', ...pos, zIndex: 1000, p: 1.5, maxWidth: 200 }}>
                        <Typography variant="subtitle2" gutterBottom>{style.legend?.title || 'Legend'}</Typography>
                        {legendItems.map((item: any, idx: number) => (
                                <Box key={idx} display="flex" alignItems="center" gap={1} mb={0.5}>
                                        <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: item.color }} />
                                        <Typography variant="caption">{item.label}</Typography>
                                </Box>
                        ))}
                        {style.sizeBy && (
                                <Typography variant="caption" display="block" mt={1}>
                                        Size = {style.sizeBy}
                                </Typography>
                        )}
                </Paper>
        );
};

export default function MapView({ dashboardId, interactiveFilters }: Props) {
        const [map, setMap] = useState<L.Map | null>(null);
        const [config, setConfig] = useState<DashboardConfig | null>(null);
        const [isLoading, setIsLoading] = useState(true);
        const [useClustering, setUseClustering] = useState(false);
        const mapInstanceRef = useRef<L.Map | null>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const markersRef = useRef<L.LayerGroup | null>(null);
        const clusterRef = useRef<any>(null);

        const filterConditions = useFilterConditions(interactiveFilters);

        useEffect(() => {
                setIsLoading(true);
                fetchDashboardConfig(dashboardId)
                        .then(configData => {
                                setConfig(configData);
                                setUseClustering(configData.map?.clustering?.enabled ?? false);
                        })
                        .catch(console.error)
                        .finally(() => setIsLoading(false));
        }, [dashboardId]);

        // Initialize map
        const mapRef = useCallback((node: HTMLDivElement | null) => {
                if (node !== null && !mapInstanceRef.current) {
                        const instance = L.map(node, {
                                center: [0, 0],
                                zoom: 2,
                                maxZoom: 18
                        });
                        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
                                subdomains: 'abcd',
                                maxZoom: 20
                        }).addTo(instance);
                        mapInstanceRef.current = instance;
                        setMap(instance);
                        setTimeout(() => {
                                if (mapInstanceRef.current) {
                                        mapInstanceRef.current.invalidateSize();
                                }
                        }, 100);
                }
        }, []);

        // Fetch all points with filters (for small datasets without clustering)
        const fetchAllPoints = useCallback(async () => {
                try {
                        if (filterConditions.length > 0) {
                                const response = await fetch(DASHBOARD_FILTERED_MAP_POINTS_URL(Number(dashboardId)), {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ filters: filterConditions })
                                });
                                if (!response.ok) throw new Error('Failed to fetch filtered points');
                                const data = await response.json();
                                return data;
                        } else {
                                const response = await fetch(DASHBOARD_MAP_POINTS_URL(Number(dashboardId)));
                                if (!response.ok) throw new Error('Failed to fetch points');
                                const data = await response.json();
                                return data;
                        }
                } catch (err) {
                        console.error('Error fetching points:', err);
                        return null;
                }
        }, [dashboardId, filterConditions]);

        // Fetch points in viewport with filters (for clustered datasets)
        const fetchPointsInView = useCallback(async (bounds: L.LatLngBounds) => {
                if (!config?.map?.clustering) return null;
                try {
                        const sw = bounds.getSouthWest();
                        const ne = bounds.getNorthEast();
                        const limit = config.map.clustering.limit ?? 10000;
                        const response = await fetch(DASHBOARD_MAP_POINTS_IN_VIEW_URL(Number(dashboardId)), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                        bbox: [sw.lng, sw.lat, ne.lng, ne.lat],
                                        limit: limit,
                                        filters: filterConditions
                                })
                        });
                        if (!response.ok) throw new Error('Failed to fetch points in view');
                        const data = await response.json();
                        return data;
                } catch (err) {
                        console.error('Error loading points in view:', err);
                        return null;
                }
        }, [dashboardId, config, filterConditions]);

        // Render points based on clustering setting
        useEffect(() => {
                if (!mapInstanceRef.current || !config) return;

                const map = mapInstanceRef.current;
                const mapStyle = config.map.style || {
                        defaultColor: '#6b7280',
                        defaultSize: 6,
                        minSize: 4,
                        maxSize: 12,
                        rules: []
                };

                // Clear existing layers
                if (clusterRef.current) {
                        map.removeLayer(clusterRef.current);
                        clusterRef.current = null;
                }
                if (markersRef.current) {
                        map.removeLayer(markersRef.current);
                        markersRef.current = null;
                }

                if (useClustering) {
                        // Clustered mode
                        const clusterConfig = config.map.clustering;
                        if (!clusterConfig) return;

                        const clusterGroup = (L as any).markerClusterGroup({
                                maxClusterRadius: clusterConfig.maxClusterRadius ?? 60,
                                spiderfyOnMaxZoom: clusterConfig.spiderfyOnMaxZoom ?? true,
                                showCoverageOnHover: clusterConfig.showCoverageOnHover ?? false,
                                zoomToBoundsOnClick: clusterConfig.zoomToBoundsOnClick ?? true,
                                disableClusteringAtZoom: clusterConfig.disableClusteringAtZoom ?? 16,
                                chunkedLoading: clusterConfig.chunkedLoading ?? true,
                                chunkInterval: clusterConfig.chunkInterval ?? 100,
                                chunkDelay: clusterConfig.chunkDelay ?? 50
                        });

                        clusterRef.current = clusterGroup;
                        map.addLayer(clusterGroup);

                        const loadViewportPoints = async () => {
                                const bounds = map.getBounds();
                                const pointsData = await fetchPointsInView(bounds);
                                if (!pointsData?.features) return;

                                clusterGroup.clearLayers();

                                pointsData.features.forEach((feature: Feature) => {
                                        if (!isPointFeature(feature)) return;
                                        const props = feature.properties;
                                        const coordinates = feature.geometry.coordinates;
                                        if (coordinates.length < 2) return;
                                        const [lon, lat] = coordinates;
                                        if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) return;

                                        const color = getColorFromRules(props, mapStyle.rules || [], mapStyle.defaultColor);
                                        const size = getSizeFromField(props, mapStyle.sizeBy, mapStyle.defaultSize, mapStyle.minSize || 4, mapStyle.maxSize || 12);

                                        const popupContent = `
                                                <div class="p-2 min-w-50">
                                                        <h3 class="font-bold text-lg border-b pb-1 mb-2">${props?.plant_specie_name || props?.species || 'Unknown'}</h3>
                                                        <table class="text-sm w-full">
                                                                ${Object.entries(props || {})
                                                                        .filter(([key]) => !['lat', 'lon'].includes(key.toLowerCase()))
                                                                        .map(([key, value]) => `
                                                                                <tr>
                                                                                        <td class="font-semibold pr-3">${key}:</td>
                                                                                        <td>${value}</td>
                                                                                </tr>
                                                                        `).join('')}
                                                        </table>
                                                </div>
                                        `;

                                        const marker = L.circleMarker([lat, lon], {
                                                radius: size,
                                                fillColor: color,
                                                color: '#fff',
                                                weight: 1,
                                                fillOpacity: 0.8,
                                        }).bindPopup(popupContent);
                                        clusterGroup.addLayer(marker);
                                });
                        };

                        loadViewportPoints();

                        let timeoutId: NodeJS.Timeout;
                        const handleMoveEnd = () => {
                                clearTimeout(timeoutId);
                                timeoutId = setTimeout(loadViewportPoints, 300);
                        };
                        map.on('moveend', handleMoveEnd);
                        map.on('zoomend', handleMoveEnd);

                        return () => {
                                map.off('moveend', handleMoveEnd);
                                map.off('zoomend', handleMoveEnd);
                                if (clusterRef.current) map.removeLayer(clusterRef.current);
                        };
                } else {
                        // Simple mode
                        const loadAllPoints = async () => {
                                const pointsData = await fetchAllPoints();
                                if (!pointsData?.features) return;

                                const layerGroup = L.layerGroup();
                                markersRef.current = layerGroup;
                                map.addLayer(layerGroup);

                                let bounds = L.latLngBounds([]);

                                pointsData.features.forEach((feature: Feature) => {
                                        if (!isPointFeature(feature)) return;
                                        const props = feature.properties;
                                        const coordinates = feature.geometry.coordinates;
                                        if (coordinates.length < 2) return;
                                        const [lon, lat] = coordinates;
                                        if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) return;

                                        const color = getColorFromRules(props, mapStyle.rules || [], mapStyle.defaultColor);
                                        const size = getSizeFromField(props, mapStyle.sizeBy, mapStyle.defaultSize, mapStyle.minSize || 4, mapStyle.maxSize || 12);

                                        const popupContent = `
                                                <div class="p-2 min-w-50">
                                                        <h3 class="font-bold text-lg border-b pb-1 mb-2">${props?.plant_specie_name || props?.species || 'Unknown'}</h3>
                                                        <table class="text-sm w-full">
                                                                ${Object.entries(props || {})
                                                                        .filter(([key]) => !['lat', 'lon'].includes(key.toLowerCase()))
                                                                        .map(([key, value]) => `
                                                                                <tr>
                                                                                        <td class="font-semibold pr-3">${key}:</td>
                                                                                        <td>${value}</td>
                                                                                </tr>
                                                                        `).join('')}
                                                        </table>
                                                </div>
                                        `;

                                        const marker = L.circleMarker([lat, lon], {
                                                radius: size,
                                                fillColor: color,
                                                color: '#fff',
                                                weight: 1,
                                                fillOpacity: 0.8,
                                        }).bindPopup(popupContent);
                                        marker.addTo(layerGroup);
                                        bounds.extend([lat, lon]);
                                });

                                if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
                        };

                        loadAllPoints();

                        return () => {
                                if (markersRef.current) map.removeLayer(markersRef.current);
                        };
                }
        }, [config, useClustering, fetchAllPoints, fetchPointsInView, filterConditions]);

        // Clean up map on unmount
        useEffect(() => {
                return () => {
                        if (mapInstanceRef.current) {
                                mapInstanceRef.current.remove();
                                mapInstanceRef.current = null;
                        }
                };
        }, []);

        if (isLoading) {
                return <Box sx={{ width: '100%', height: '100%', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />;
        }

        return (
                <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                        <Box
                                ref={(node) => {
                                        containerRef.current = node;
                                        mapRef(node);
                                }}
                                sx={{ width: '100%', height: '100%', bgcolor: 'grey.50', borderRadius: 2 }}
                        />
                        {config?.map?.style && map && (
                                <Legend style={config.map.style} position={config.map.style.legend?.position || 'bottomright'} />
                        )}
                </Box>
        );
}
