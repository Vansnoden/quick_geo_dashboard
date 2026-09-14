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
import {
    DASHBOARD_MAP_POINTS_URL,
    DASHBOARD_FILTERED_MAP_POINTS_URL,
    DASHBOARD_MAP_POINTS_IN_VIEW_URL,
} from '@/lib/constants';

declare module 'leaflet' {
    export function markerClusterGroup(options?: any): any;
}

interface Props {
    dashboardId: string;
    interactiveFilters?: Record<string, any>;
}

// How long to wait after a pan/zoom before firing a viewport request.
const VIEWPORT_DEBOUNCE_MS = 400;
// Full-world bbox used for the very first viewport request.
const WORLD_BBOX: [number, number, number, number] = [-180, -90, 180, 90];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getColorFromRules = (
    properties: GeoJsonProperties,
    rules: MapStyleRule[],
    defaultColor: string,
): string => {
    if (!properties) return defaultColor;
    for (const rule of rules) {
        const fieldValue = (properties as any)[rule.field];
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
                    const stringValues = rule.value.map((v) => String(v));
                    if (stringValues.includes(String(fieldValue))) return rule.color;
                }
                break;
        }
    }
    return defaultColor;
};

const getSizeFromField = (
    properties: GeoJsonProperties,
    sizeBy: string | undefined,
    defaultSize: number,
    minSize: number,
    maxSize: number,
): number => {
    if (!sizeBy || !properties) return defaultSize;
    const value = (properties as any)[sizeBy];
    if (!value || isNaN(Number(value))) return defaultSize;
    const scaled = Math.log(Number(value) + 1) * 3;
    return Math.min(maxSize, Math.max(minSize, scaled));
};

const isPointFeature = (feature: Feature): feature is Feature<Point> =>
    feature.geometry?.type === 'Point';

const createScrollablePopupContent = (
    properties: GeoJsonProperties,
    title: string = 'Unknown',
): string => {
    const entries = Object.entries(properties || {})
        .filter(([, value]) => value !== null && value !== undefined && value !== '')
        .sort(([a], [b]) => a.localeCompare(b));

    return `
        <div style="max-height: 300px; overflow-y: auto; padding: 8px; min-width: 200px; max-width: 350px;">
            <h3 style="font-weight: bold; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px; position: sticky; top: 0; background: white; z-index: 1;">
                ${title}
            </h3>
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                ${entries
                    .map(
                        ([key, value]) => `
                    <tr style="border-bottom: 1px solid #f3f4f6;">
                        <td style="font-weight: 600; padding: 4px 8px 4px 0; color: #4b5563; white-space: nowrap;">${key}:</td>
                        <td style="padding: 4px 0 4px 8px; word-break: break-word; color: #111827;">${String(value)}</td>
                    </tr>
                `,
                    )
                    .join('')}
            </table>
            ${entries.length === 0 ? '<p style="color: #9ca3af; text-align: center; padding: 8px;">No data available</p>' : ''}
        </div>
    `;
};

const useFilterConditions = (interactiveFilters?: Record<string, any>) => {
    return useMemo(() => {
        const conditions: FilterCondition[] = [];
        if (!interactiveFilters) return conditions;
        const processedColumns = new Set<string>();

        for (const [key, val] of Object.entries(interactiveFilters)) {
            if (val === '' || val === undefined || val === null) continue;
            if (Array.isArray(val) && val.length === 0) continue;

            if (key.endsWith('_min')) {
                const column = key.slice(0, -4);
                const maxVal = interactiveFilters[`${column}_max`];
                if (maxVal !== undefined && maxVal !== '' && maxVal !== null) {
                    conditions.push({
                        column,
                        operator: 'between',
                        value: [Number(val), Number(maxVal)],
                    });
                    processedColumns.add(column);
                } else {
                    conditions.push({ column, operator: '>=', value: Number(val) });
                    processedColumns.add(column);
                }
            } else if (key.endsWith('_max')) {
                const column = key.slice(0, -4);
                if (!processedColumns.has(column)) {
                    conditions.push({ column, operator: '<=', value: Number(val) });
                    processedColumns.add(column);
                }
            } else if (Array.isArray(val) && val.length > 0) {
                conditions.push({ column: key, operator: 'in', value: val });
            } else if (typeof val === 'object' && val !== null) {
                if ('min' in val && (val as any).min !== undefined) {
                    conditions.push({
                        column: key,
                        operator: '>=',
                        value: Number((val as any).min),
                    });
                }
                if ('max' in val && (val as any).max !== undefined) {
                    conditions.push({
                        column: key,
                        operator: '<=',
                        value: Number((val as any).max),
                    });
                }
            } else if (val !== '') {
                conditions.push({ column: key, operator: '=', value: String(val) });
            }
        }
        return conditions;
    }, [interactiveFilters]);
};

const Legend = ({ style, position }: { style: any; position: string }) => {
    const positionClasses: Record<string, string> = {
        topleft: 'top-4 left-4',
        topright: 'top-4 right-4',
        bottomleft: 'bottom-4 left-4',
        bottomright: 'bottom-4 right-4',
    };
    const legendItems = (style.rules || [])
        .filter((rule: MapStyleRule, index: number, self: MapStyleRule[]) =>
            index === self.findIndex((r) => r.color === rule.color),
        )
        .map((rule: MapStyleRule) => ({
            color: rule.color,
            label: rule.label || `${rule.field}: ${rule.value}`,
        }));

    return (
        <div className={`absolute ${positionClasses[position] || 'bottom-4 right-4'} z-[1000]`}>
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                <h4 className="font-bold text-sm mb-2">{style.legend?.title || 'Legend'}</h4>
                <div className="space-y-1.5">
                    {legendItems.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span
                                className="w-4 h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                            />
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MapView({ dashboardId, interactiveFilters }: Props) {
    const [config, setConfig] = useState<DashboardConfig | null>(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [isLoadingPoints, setIsLoadingPoints] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);

    const mapInstanceRef = useRef<L.Map | null>(null);
    const clusterRef = useRef<any>(null);
    const markersRef = useRef<L.LayerGroup | null>(null);
    const hasFitBoundsRef = useRef(false);
    const abortRef = useRef<AbortController | null>(null);

    const filterConditions = useFilterConditions(interactiveFilters);

    // ------------------------------------------------------------------
    // Fetch dashboard config once
    // ------------------------------------------------------------------
    useEffect(() => {
        let cancelled = false;
        setIsLoadingConfig(true);
        fetchDashboardConfig(dashboardId)
            .then((cfg) => {
                if (!cancelled) setConfig(cfg);
            })
            .catch((err) => console.error('Error fetching map config:', err))
            .finally(() => {
                if (!cancelled) setIsLoadingConfig(false);
            });
        return () => {
            cancelled = true;
        };
    }, [dashboardId]);

    // ------------------------------------------------------------------
    // Initialise the Leaflet map exactly once
    // ------------------------------------------------------------------
    const mapRef = useCallback((node: HTMLDivElement | null) => {
        if (node && !mapInstanceRef.current) {
            const instance = L.map(node, {
                center: [20, 0],
                zoom: 2,
                maxZoom: 18,
                worldCopyJump: true,
            });
            L.tileLayer(
                'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=cb1_2u0c_1_b25b10c1633c2853d7bdce86',
                {
                    attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    subdomains: 'abcd',
                    maxZoom: 20,
                },
            ).addTo(instance);
            mapInstanceRef.current = instance;
            setIsMapReady(true);
            setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
        }
    }, []);

    // ------------------------------------------------------------------
    // Data fetchers
    // ------------------------------------------------------------------
    const fetchAllPoints = useCallback(
        async (signal: AbortSignal) => {
            try {
                const url =
                    filterConditions.length > 0
                        ? DASHBOARD_FILTERED_MAP_POINTS_URL(Number(dashboardId))
                        : DASHBOARD_MAP_POINTS_URL(Number(dashboardId));

                const response =
                    filterConditions.length > 0
                        ? await fetch(url, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ filters: filterConditions }),
                              signal,
                          })
                        : await fetch(url, { signal });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            } catch (err: any) {
                if (err?.name !== 'AbortError') console.error('Error fetching all points:', err);
                return null;
            }
        },
        [dashboardId, filterConditions],
    );

    const fetchViewport = useCallback(
        async (
            bbox: [number, number, number, number],
            limit: number,
            signal: AbortSignal,
        ) => {
            try {
                const response = await fetch(
                    DASHBOARD_MAP_POINTS_IN_VIEW_URL(Number(dashboardId)),
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bbox, limit, filters: filterConditions }),
                        signal,
                    },
                );
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            } catch (err: any) {
                if (err?.name !== 'AbortError') console.error('Error fetching viewport:', err);
                return null;
            }
        },
        [dashboardId, filterConditions],
    );

    // ------------------------------------------------------------------
    // Build markers into a Leaflet layer/cluster group
    // ------------------------------------------------------------------
    const addMarkersToLayer = useCallback(
        (
            features: Feature[],
            target: any,
            mapStyle: any,
            map: L.Map,
            fitBounds: boolean,
        ) => {
            const bounds = L.latLngBounds([]);

            for (const feature of features) {
                if (!isPointFeature(feature)) continue;
                const props = feature.properties;
                const [lon, lat] = feature.geometry.coordinates;
                if (
                    typeof lat !== 'number' ||
                    typeof lon !== 'number' ||
                    isNaN(lat) ||
                    isNaN(lon) ||
                    lat < -90 ||
                    lat > 90 ||
                    lon < -180 ||
                    lon > 180
                ) {
                    continue;
                }

                const color = getColorFromRules(
                    props,
                    mapStyle.rules || [],
                    mapStyle.defaultColor,
                );
                const size = getSizeFromField(
                    props,
                    mapStyle.sizeBy,
                    mapStyle.defaultSize,
                    mapStyle.minSize || 4,
                    mapStyle.maxSize || 12,
                );
                const title =
                    (props as any)?.species || (props as any)?.name || 'Details';
                const popupContent = createScrollablePopupContent(props, title);

                const marker = L.circleMarker([lat, lon], {
                    radius: size,
                    fillColor: color,
                    color: '#fff',
                    weight: 1,
                    fillOpacity: 0.85,
                }).bindPopup(popupContent, {
                    maxWidth: 400,
                    className: 'scrollable-popup',
                });

                target.addLayer(marker);
                bounds.extend([lat, lon]);
            }

            if (fitBounds && bounds.isValid()) {
                map.fitBounds(bounds, { padding: [20, 20], maxZoom: 10 });
            }
        },
        [],
    );

    // ------------------------------------------------------------------
    // Main effect: (re)build markers whenever config or filters change
    // ------------------------------------------------------------------
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !config) return;

        const mapStyle = config.map.style || {
            defaultColor: '#6b7280',
            defaultSize: 6,
            minSize: 4,
            maxSize: 12,
            rules: [],
        };

        // Cancel any prior in-flight request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        // Wipe any existing marker layer
        if (clusterRef.current) {
            map.removeLayer(clusterRef.current);
            clusterRef.current = null;
        }
        if (markersRef.current) {
            map.removeLayer(markersRef.current);
            markersRef.current = null;
        }

        const clusteringCfg = config.map.clustering;
        const clusteringEnabled = clusteringCfg?.enabled ?? false;

        let moveEndHandler: (() => void) | null = null;
        let moveEndTimer: ReturnType<typeof setTimeout> | null = null;

        // ------------------------------------------------------------------
        // Case A — clustering enabled: viewport-based loading
        // ------------------------------------------------------------------
        if (clusteringEnabled && clusteringCfg) {
            const clusterGroup = (L as any).markerClusterGroup({
                maxClusterRadius: clusteringCfg.maxClusterRadius ?? 60,
                spiderfyOnMaxZoom: clusteringCfg.spiderfyOnMaxZoom ?? true,
                showCoverageOnHover: clusteringCfg.showCoverageOnHover ?? false,
                zoomToBoundsOnClick: clusteringCfg.zoomToBoundsOnClick ?? true,
                disableClusteringAtZoom: clusteringCfg.disableClusteringAtZoom ?? 16,
                chunkedLoading: clusteringCfg.chunkedLoading ?? true,
                chunkInterval: clusteringCfg.chunkInterval ?? 100,
                chunkDelay: clusteringCfg.chunkDelay ?? 50,
            });
            clusterRef.current = clusterGroup;
            map.addLayer(clusterGroup);

            const limit = clusteringCfg.limit ?? 10000;

            // --- Initial load: one wide-bbox request ---------------------
            (async () => {
                setIsLoadingPoints(true);
                const data = await fetchViewport(WORLD_BBOX, limit, controller.signal);
                setIsLoadingPoints(false);
                if (!data?.features || controller.signal.aborted) return;

                clusterGroup.clearLayers();
                addMarkersToLayer(
                    data.features,
                    clusterGroup,
                    mapStyle,
                    map,
                    !hasFitBoundsRef.current,
                );
                hasFitBoundsRef.current = true;

                // If we hit the API limit, more data exists off-screen.
                // Only then do we install the viewport-reload handler.
                if (data.features.length >= limit) {
                    moveEndHandler = () => {
                        if (moveEndTimer) clearTimeout(moveEndTimer);
                        moveEndTimer = setTimeout(async () => {
                            const b = map.getBounds();
                            const sw = b.getSouthWest();
                            const ne = b.getNorthEast();
                            const viewBbox: [number, number, number, number] = [
                                sw.lng,
                                sw.lat,
                                ne.lng,
                                ne.lat,
                            ];

                            setIsLoadingPoints(true);
                            const inView = await fetchViewport(
                                viewBbox,
                                limit,
                                controller.signal,
                            );
                            setIsLoadingPoints(false);
                            if (!inView?.features || controller.signal.aborted) return;

                            clusterGroup.clearLayers();
                            addMarkersToLayer(
                                inView.features,
                                clusterGroup,
                                mapStyle,
                                map,
                                false,
                            );
                        }, VIEWPORT_DEBOUNCE_MS);
                    };
                    map.on('moveend', moveEndHandler);
                }
            })();
        }
        // ------------------------------------------------------------------
        // Case B — clustering disabled: load everything once
        // ------------------------------------------------------------------
        else {
            const layerGroup = L.layerGroup();
            markersRef.current = layerGroup;
            map.addLayer(layerGroup);

            (async () => {
                setIsLoadingPoints(true);
                const data = await fetchAllPoints(controller.signal);
                setIsLoadingPoints(false);
                if (!data?.features || controller.signal.aborted) return;

                layerGroup.clearLayers();
                addMarkersToLayer(
                    data.features,
                    layerGroup,
                    mapStyle,
                    map,
                    !hasFitBoundsRef.current,
                );
                hasFitBoundsRef.current = true;
            })();
        }

        // ------------------------------------------------------------------
        // Cleanup for this effect run
        // ------------------------------------------------------------------
        return () => {
            controller.abort();
            if (moveEndTimer) clearTimeout(moveEndTimer);
            if (moveEndHandler) map.off('moveend', moveEndHandler);
            if (clusterRef.current) {
                map.removeLayer(clusterRef.current);
                clusterRef.current = null;
            }
            if (markersRef.current) {
                map.removeLayer(markersRef.current);
                markersRef.current = null;
            }
        };
    }, [config, fetchAllPoints, fetchViewport, addMarkersToLayer]);

    // ------------------------------------------------------------------
    // Full cleanup on unmount
    // ------------------------------------------------------------------
    useEffect(() => {
        return () => {
            abortRef.current?.abort();
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    if (isLoadingConfig) {
        return (
            <div className="w-full h-full min-h-100 bg-gray-100 animate-pulse rounded-xl" />
        );
    }

    return (
        <div className="relative w-full h-full min-h-100">
            <div
                ref={mapRef}
                className="w-full h-full bg-gray-50 rounded-xl"
                style={{ isolation: 'isolate' }}
            />
            {isLoadingPoints && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 px-3 py-1.5 rounded-full shadow text-xs text-gray-600 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    Loading points…
                </div>
            )}
            {config?.map?.style && isMapReady && (
                <Legend
                    style={config.map.style}
                    position={config.map.style.legend?.position || 'bottomright'}
                />
            )}
        </div>
    );
}