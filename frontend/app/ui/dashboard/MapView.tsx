'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchMapPoints, fetchDashboardConfig } from '@/app/lib/client_actions';
import { DashboardConfig, MapStyleRule } from '@/app/lib/definitions';
import { Feature, Point, GeoJsonProperties } from 'geojson';

interface Props {
  dashboardId: string;
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

// Type guard to check if feature is a Point
const isPointFeature = (feature: Feature): feature is Feature<Point> => {
  return feature.geometry?.type === 'Point';
};

// Legend component
const Legend = ({ style, position }: { style: any; position: string }) => {
  const positionClasses = {
    topleft: 'top-4 left-4',
    topright: 'top-4 right-4',
    bottomleft: 'bottom-4 left-4',
    bottomright: 'bottom-4 right-4'
  };
  
  // Get unique rules for legend
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
          {legendItems.map((item:any, idx:any) => (
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

export default function MapView({ dashboardId }: Props) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [points, setPoints] = useState<GeoJSON.FeatureCollection | null>(null);
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Fetch both points and config
  useEffect(() => {
    console.log('Fetching map data for dashboard:', dashboardId);
    setIsLoading(true);
    Promise.all([
      fetchMapPoints(dashboardId),
      fetchDashboardConfig(dashboardId)
    ]).then(([pointsData, configData]) => {
      console.log('Points received:', pointsData.features?.length || 0, 'features');
      console.log('Config received:', configData);
      setPoints(pointsData);
      setConfig(configData);
    }).catch(err => {
      console.error('Error fetching map data:', err);
    }).finally(() => setIsLoading(false));
  }, [dashboardId]);

  // Initialize map
  const mapRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null && !mapInstanceRef.current) {
      console.log('Initializing map');
      const instance = L.map(node).setView([0, 0], 2);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(instance);

      // Create a layer group for markers
      markersRef.current = L.layerGroup().addTo(instance);

      mapInstanceRef.current = instance;
      setMap(instance);
      
      // Force size check
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          console.log('Map invalidated after init');
        }
      }, 100);
    }
  }, []);

  // Clean up
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update points when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !points || !config || !markersRef.current) {
      console.log('Waiting for map, points, and config:', {
        map: !!mapInstanceRef.current,
        points: !!points,
        config: !!config,
        markers: !!markersRef.current
      });
      return;
    }

    console.log('Updating map with', points.features?.length, 'points');
    const map = mapInstanceRef.current;
    const markers = markersRef.current;

    // Clear existing markers
    markers.clearLayers();

    const mapStyle = config.map.style || {
      defaultColor: '#6b7280',
      defaultSize: 6,
      minSize: 4,
      maxSize: 12,
      rules: []
    };

    console.log('Using map style:', mapStyle);

    let bounds = L.latLngBounds([]);
    let pointCount = 0;

    // Type-safe iteration over features
    points.features?.forEach((feature: Feature) => {
      // Use type guard to ensure we have a Point geometry
      if (!isPointFeature(feature)) return;
      
      const props = feature.properties;
      const coordinates = feature.geometry.coordinates;
      
      // GeoJSON Point coordinates are [longitude, latitude]
      if (coordinates.length < 2) return;
      
      const [lon, lat] = coordinates;
      
      // Ensure coordinates are valid numbers
      if (typeof lat !== 'number' || typeof lon !== 'number') return;
      if (isNaN(lat) || isNaN(lon)) return;
      
      const latlng = L.latLng(lat, lon);
      
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
      
      const marker = L.circleMarker(latlng, {
        radius: size,
        fillColor: color,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.8,
      });
      
      // Create popup content with safe property access
      const popupContent = `
        <div class="p-2 min-w-50">
          <h3 class="font-bold text-lg border-b pb-1 mb-2">${props?.species || 'Unknown'}</h3>
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
      
      marker.bindPopup(popupContent);
      marker.addTo(markers);
      bounds.extend(latlng);
      pointCount++;
    });

    console.log(`Added ${pointCount} points to map`);

    if (pointCount > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
      console.log('Map bounds fitted');
    }

    // Force map to recalculate size
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        console.log('Map invalidated after adding points');
      }
    }, 100);

  }, [points, config]);

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