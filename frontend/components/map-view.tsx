'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { fetchDashboardConfig } from '@/lib/client_actions';
import { DashboardConfig, FilterCondition, MapStyleRule } from '@/lib/definitions';
import { Feature, Point, GeoJsonProperties } from 'geojson';
import { DASHBOARD_MAP_POINTS_IN_VIEW_URL, DASHBOARD_MAP_POINTS_URL, DASHBOARD_FILTERED_MAP_POINTS_URL } from '@/lib/constants';

// Extend Leaflet types
declare module 'leaflet' {
    export function markerClusterGroup(options?: any): any;
}

interface Props {
    dashboardId: string;
    interactiveFilters?: Record<string, any>;
}

// Helper functions (unchanged)
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

const getSizeFromField = (properties: GeoJsonProperties, sizeBy: string | undefined, defaultSize: number, minSize: number, maxSize: number): number => {
    if (!sizeBy || !properties) return defaultSize;
    const value = properties[sizeBy];
    if (!value || isNaN(Number(value))) return defaultSize;
    const scaled = Math.log(Number(value) + 1) * 3;
    return Math.min(maxSize, Math.max(minSize, scaled));
};

const isPointFeature = (feature: Feature): feature is Feature<Point> => {
    return feature.geometry?.type === 'Point';
};

const useFilterConditions = (interactiveFilters?: Record<string, any>) => {
    return useMemo(() => {
        const conditions: FilterCondition[] = [];
        if (!interactiveFilters) return conditions;

        const processedColumns = new Set<string>();

        for (const [key, val] of Object.entries(interactiveFilters)) {
            // Skip empty values
            if (val === '' || val === undefined || val === null) continue;
            
            // For arrays (multiselect), skip empty arrays
            if (Array.isArray(val) && val.length === 0) continue;

            if (key.endsWith('_min')) {
                const column = key.slice(0, -4);
                const maxKey = `${column}_max`;
                const maxVal = interactiveFilters[maxKey];
                if (maxVal !== undefined && maxVal !== '' && maxVal !== null) {
                    conditions.push({
                        column,
                        operator: 'between',
                        value: [Number(val), Number(maxVal)]
                    });
                    processedColumns.add(column);
                } else {
                    conditions.push({ column, operator: '>=', value: Number(val) });
                    processedColumns.add(column);
                }
            } 
            else if (key.endsWith('_max')) {
                const column = key.slice(0, -4);
                if (!processedColumns.has(column)) {
                    conditions.push({ column, operator: '<=', value: Number(val) });
                    processedColumns.add(column);
                }
            }
            else {
                if (Array.isArray(val) && val.length > 0) {
                    conditions.push({ column: key, operator: 'in', value: val });
                } 
                else if (typeof val === 'object' && val !== null) {
                    if ('min' in val && val.min !== undefined) {
                        conditions.push({ column: key, operator: '>=', value: Number(val.min) });
                    }
                    if ('max' in val && val.max !== undefined) {
                        conditions.push({ column: key, operator: '<=', value: Number(val.max) });
                    }
                } 
                else if (val !== '' && val !== undefined && val !== null) {
                    conditions.push({ column: key, operator: '=', value: String(val) });
                }
            }
        }

        return conditions;
    }, [interactiveFilters]);
};

// Scrollable Popup Component - Creates a scrollable popup content
const createScrollablePopupContent = (properties: GeoJsonProperties, title: string = 'Unknown') => {
    // Filter out null/undefined values and format nicely
    const entries = Object.entries(properties || {})
        .filter(([key, value]) => value !== null && value !== undefined && value !== '')
        .sort(([a], [b]) => a.localeCompare(b));

    // Build popup HTML with scrolling
    return `
        <div style="max-height: 300px; overflow-y: auto; padding: 8px; min-width: 200px; max-width: 350px;">
            <h3 style="font-weight: bold; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px; position: sticky; top: 0; background: white; z-index: 1;">
                ${title}
            </h3>
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                ${entries.map(([key, value]) => `
                    <tr style="border-bottom: 1px solid #f3f4f6;">
                        <td style="font-weight: 600; padding: 4px 8px 4px 0; color: #4b5563; white-space: nowrap;">${key}:</td>
                        <td style="padding: 4px 0 4px 8px; word-break: break-word; color: #111827;">${String(value)}</td>
                    </tr>
                `).join('')}
            </table>
            ${entries.length === 0 ? '<p style="color: #9ca3af; text-align: center; padding: 8px;">No data available</p>' : ''}
            <div style="position: sticky; bottom: 0; height: 4px; background: linear-gradient(to bottom, transparent, white);"></div>
        </div>
    `;
};

// Legend component
const Legend = ({ style, position }: { style: any; position: string }) => {
    const positionClasses = {
        topleft: 'top-4 left-4',
        topright: 'top-4 right-4',
        bottomleft: 'bottom-4 left-4',
        bottomright: 'bottom-4 right-4'
    };
    const legendItems = style.rules
        .filter((rule: MapStyleRule, index: number, self: MapStyleRule[]) => 
            index === self.findIndex((r) => r.color === rule.color)
        )
        .map((rule: MapStyleRule) => ({
            color: rule.color,
            label: rule.label || `${rule.field}: ${rule.value}`
        }));
    return (
        <div className={`absolute ${positionClasses[position as keyof typeof positionClasses] || 'bottom-4 right-4'} z-1000`}>
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                <h4 className="font-bold text-sm mb-2">{style.legend?.title || 'Legend'}</h4>
                <div className="space-y-1.5">
                    {legendItems.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                            <span className="text-xs break-words">{item.label}</span>
                        </div>
                    ))}
                    {style.sizeBy && (
                        <div className="mt-3 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-600">Size = {style.sizeBy}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
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

    // Fetch config and decide on clustering strategy
    useEffect(() => {
        fetchDashboardConfig(dashboardId)
            .then(configData => {
                setConfig(configData);
                const clusteringEnabled = configData.map?.clustering?.enabled ?? false;
                setUseClustering(clusteringEnabled);
            })
            .catch(err => console.error('Error fetching map config:', err))
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
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=cb1_2u0c_1_b25b10c1633c2853d7bdce86', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(instance);
            mapInstanceRef.current = instance;
            setMap(instance);
            setTimeout(() => {
                if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
            }, 100);
        }
    }, []);

    // Fetch all points (no clustering)
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
                console.log(`Fetched ${data.features?.length || 0} filtered points`);
                return data;
            } else {
                const response = await fetch(DASHBOARD_MAP_POINTS_URL(Number(dashboardId)));
                if (!response.ok) throw new Error('Failed to fetch points');
                const data = await response.json();
                console.log(`Fetched ${data.features?.length || 0} points`);
                return data;
            }
        } catch (err) {
            console.error('Error fetching points:', err);
            return null;
        }
    }, [dashboardId, filterConditions]);

    // Fetch points in viewport (for clustered datasets)
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
            console.log(`Fetched ${data.features?.length || 0} points in view with filters`);
            return data;
        } catch (err) {
            console.error('Error loading points in view:', err);
            return null;
        }
    }, [dashboardId, config, filterConditions]);

    // Render points (runs when config, clustering, or filters change)
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
            // Clustering mode
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
                    const [lon, lat] = feature.geometry.coordinates;
                    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) return;
                    const color = getColorFromRules(props, mapStyle.rules || [], mapStyle.defaultColor);
                    const size = getSizeFromField(props, mapStyle.sizeBy, mapStyle.defaultSize, mapStyle.minSize || 4, mapStyle.maxSize || 12);
                    
                    // Get title for popup
                    const title = props?.plant_specie_name || props?.species || 'Unknown';
                    
                    // Create scrollable popup content
                    const popupContent = createScrollablePopupContent(props, title);
                    
                    const marker = L.circleMarker([lat, lon], {
                        radius: size,
                        fillColor: color,
                        color: '#fff',
                        weight: 1,
                        fillOpacity: 0.8,
                    }).bindPopup(popupContent, {
                        maxWidth: 400,
                        className: 'scrollable-popup'
                    });
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
                    const [lon, lat] = feature.geometry.coordinates;
                    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) return;
                    const color = getColorFromRules(props, mapStyle.rules || [], mapStyle.defaultColor);
                    const size = getSizeFromField(props, mapStyle.sizeBy, mapStyle.defaultSize, mapStyle.minSize || 4, mapStyle.maxSize || 12);
                    
                    // Get title for popup
                    const title = props?.plant_specie_name || props?.species || 'Unknown';
                    
                    // Create scrollable popup content
                    const popupContent = createScrollablePopupContent(props, title);
                    
                    const marker = L.circleMarker([lat, lon], {
                        radius: size,
                        fillColor: color,
                        color: '#fff',
                        weight: 1,
                        fillOpacity: 0.8,
                    }).bindPopup(popupContent, {
                        maxWidth: 400,
                        className: 'scrollable-popup'
                    });
                    marker.addTo(layerGroup);
                    bounds.extend([lat, lon]);
                });

                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [20, 20] });
                }
            };
            loadAllPoints();
        }
    }, [config, useClustering, fetchAllPoints, fetchPointsInView, filterConditions]);

    // Clean up
    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    if (isLoading) {
        return <div className="w-full h-full min-h-100 bg-gray-100 animate-pulse rounded-xl" />;
    }

    return (
        <div className="relative w-full h-full min-h-100">
            <div 
                ref={(node) => {
                    containerRef.current = node;
                    mapRef(node);
                }}
                className="w-full h-full bg-gray-50 rounded-xl"
                style={{ isolation: 'isolate' }} 
            />
            {config?.map?.style && map && (
                <Legend 
                    style={config.map.style} 
                    position={config.map.style.legend?.position || 'bottomright'} 
                />
            )}
        </div>
    );
}