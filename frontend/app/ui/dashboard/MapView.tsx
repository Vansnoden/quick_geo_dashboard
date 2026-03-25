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

// Extend Leaflet types
declare module 'leaflet' {
  export function markerClusterGroup(options?: any): any;
}

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
  
  // Scale logarithmically to handle outliers
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
      
      // Handle range filters (they come as column_min and column_max)
      if (key.endsWith('_min')) {
        const column = key.replace('_min', '');
        const maxVal = interactiveFilters[`${column}_max`];
        if (maxVal !== undefined && maxVal !== '' && maxVal !== null) {
          conditions.push({ 
            column, 
            operator: 'between', 
            value: [Number(val), Number(maxVal)] 
          });
        } else {
          conditions.push({ column, operator: '>=', value: Number(val) });
        }
      } 
      else if (key.endsWith('_max')) {
        // Skip - handled by _min
        return;
      }
      else if (Array.isArray(val) && val.length > 0) {
        conditions.push({ column: key, operator: 'in', value: val });
      } 
      else if (typeof val === 'object' && val !== null) {
        // Handle case where range might still be an object (backward compatibility)
        if ('min' in val && val.min !== undefined) {
          conditions.push({ column: key, operator: '>=', value: Number(val.min) });
        }
        if ('max' in val && val.max !== undefined) {
          conditions.push({ column: key, operator: '<=', value: Number(val.max) });
        }
      }
      else if (val !== '') {
        conditions.push({ column: key, operator: '=', value: String(val) });
      }
    });
    
    // Remove duplicates (for between operator, we want just one condition)
    return conditions.filter((f, index, self) => 
      index === self.findIndex(t => 
        t.column === f.column && 
        t.operator === f.operator && 
        JSON.stringify(t.value) === JSON.stringify(f.value)
      )
    );
  }, [interactiveFilters]);
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
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <h4 className="font-bold text-sm mb-2">{style.legend?.title || 'Legend'}</h4>
        <div className="space-y-1.5">
          {legendItems.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span className="text-xs">{item.label}</span>
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
  const [points, setPoints] = useState<GeoJSON.FeatureCollection | null>(null);
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useClustering, setUseClustering] = useState(false);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const clusterRef = useRef<any>(null);
  
  // Convert interactive filters to FilterCondition array
  const filterConditions = useFilterConditions(interactiveFilters);

  // Fetch config and decide on clustering strategy
  useEffect(() => {
    console.log('Fetching map config for dashboard:', dashboardId);
    setIsLoading(true);
    fetchDashboardConfig(dashboardId)
      .then(configData => {
        console.log('Config received:', configData);
        setConfig(configData);
        
        // Determine if clustering should be enabled
        const clusteringEnabled = configData.map?.clustering?.enabled ?? false;
        setUseClustering(clusteringEnabled);
      })
      .catch(err => {
        console.error('Error fetching map config:', err);
      })
      .finally(() => setIsLoading(false));
  }, [dashboardId]);

  // Initialize map
  const mapRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null && !mapInstanceRef.current) {
      console.log('Initializing map');
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
          console.log('Map invalidated after init');
        }
      }, 100);
    }
  }, []);

  // Fetch all points with filters (for small datasets without clustering)
  const fetchAllPoints = useCallback(async () => {
    try {
      // Use filtered endpoint if we have filters, otherwise use regular points endpoint
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
          filters: filterConditions  // Pass the filter conditions
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

    // Clear existing layers properly
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
      clusterRef.current = null;
    }
    if (markersRef.current) {
      map.removeLayer(markersRef.current);
      markersRef.current = null;
    }

    if (useClustering) {
      // === CLUSTERED MODE (for large datasets) ===
      const clusterConfig = config.map.clustering;

      // Only proceed if clustering is enabled and config exists
      if (!clusterConfig) {
        console.warn('Clustering enabled but no cluster config found');
        return;
      }

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

      // Function to load points for current view
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
          
          if (typeof lat !== 'number' || typeof lon !== 'number') return;
          if (isNaN(lat) || isNaN(lon)) return;
          
          const color = getColorFromRules(
            props, 
            mapStyle.rules || [], 
            mapStyle.defaultColor
          );
          
          const size = getSizeFromField(
            props,
            mapStyle.sizeBy,
            mapStyle.defaultSize,
            mapStyle.minSize || 4,
            mapStyle.maxSize || 12
          );
          
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

      // Load initial points
      loadViewportPoints();

      // Debounced update on map move
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
        if (clusterRef.current) {
          map.removeLayer(clusterRef.current);
        }
      };

    } else {
      // === SIMPLE MODE (for small datasets) ===
      const loadAllPoints = async () => {
        const pointsData = await fetchAllPoints();
        if (!pointsData?.features) return;

        // Create a layer group for all markers
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
          
          if (typeof lat !== 'number' || typeof lon !== 'number') return;
          if (isNaN(lat) || isNaN(lon)) return;
          
          const color = getColorFromRules(
            props, 
            mapStyle.rules || [], 
            mapStyle.defaultColor
          );
          
          const size = getSizeFromField(
            props,
            mapStyle.sizeBy,
            mapStyle.defaultSize,
            mapStyle.minSize || 4,
            mapStyle.maxSize || 12
          );
          
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

        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      };

      loadAllPoints();

      return () => {
        if (markersRef.current) {
          map.removeLayer(markersRef.current);
        }
      };
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