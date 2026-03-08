'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchMapPoints, fetchDashboardConfig } from '@/app/lib/client_actions';
import { DashboardConfig, MapStyleRule } from '@/app/lib/definitions';

interface Props {
  dashboardId: string;
}

// Helper function to apply style rules
const getColorFromRules = (properties: any, rules: MapStyleRule[], defaultColor: string): string => {
  for (const rule of rules) {
    const fieldValue = properties[rule.field];
    if (fieldValue === undefined || fieldValue === null) continue;
    
    const operator = rule.operator || '=';
    
    switch (operator) {
      case '=':
        if (fieldValue === rule.value) return rule.color;
        break;
      case '!=':
        if (fieldValue !== rule.value) return rule.color;
        break;
      case 'like':
        if (typeof fieldValue === 'string' && typeof rule.value === 'string') {
          const pattern = rule.value.replace('%', '.*');
          if (new RegExp(pattern, 'i').test(fieldValue)) return rule.color;
        }
        break;
      case 'in':
        if (Array.isArray(rule.value) && rule.value.includes(fieldValue)) return rule.color;
        break;
    }
  }
  return defaultColor;
};

// Helper to get size based on field
const getSizeFromField = (properties: any, sizeBy: string | undefined, defaultSize: number, minSize: number, maxSize: number): number => {
  if (!sizeBy) return defaultSize;
  
  const value = properties[sizeBy];
  if (!value || isNaN(Number(value))) return defaultSize;
  
  // Scale logarithmically to handle outliers
  const scaled = Math.log(Number(value) + 1) * 3;
  return Math.min(maxSize, Math.max(minSize, scaled));
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
          {legendItems.map((item, idx) => (
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
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Fetch both points and config
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchMapPoints(dashboardId),
      fetchDashboardConfig(dashboardId)
    ]).then(([pointsData, configData]) => {
      setPoints(pointsData);
      setConfig(configData);
    }).catch(console.error)
      .finally(() => setIsLoading(false));
  }, [dashboardId]);

  // Initialize map once
  const mapRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null && !mapInstanceRef.current) {
      const instance = L.map(node).setView([0, 0], 2);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(instance);

      mapInstanceRef.current = instance;
      setMap(instance);
      
      // Force a size check after initialization
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
    }
  }, []);

  // Clean up map instance
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // Set up ResizeObserver to watch container size changes
  useEffect(() => {
    if (!containerRef.current || !mapInstanceRef.current) return;
    
    resizeObserverRef.current = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    
    resizeObserverRef.current.observe(containerRef.current);
    
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [map]);

  // Update points when data arrives or config changes
  useEffect(() => {
    if (!mapInstanceRef.current || !points || !config) {
      return;
    }
    
    const map = mapInstanceRef.current;
    
    // Clear existing GeoJSON layers
    map.eachLayer((layer) => {
      if (layer instanceof L.GeoJSON) {
        map.removeLayer(layer);
      }
    });

    const mapStyle = config.map.style || {
      defaultColor: '#6b7280',
      defaultSize: 6,
      minSize: 4,
      maxSize: 12,
      rules: []
    };

    // Add new points
    const layer = L.geoJSON(points, {
      pointToLayer: (feature, latlng) => {
        const props = feature.properties || {};
        
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
        
        // Create popup content
        const popupContent = `
          <div class="p-2 min-w-50">
            <h3 class="font-bold text-lg border-b pb-1 mb-2">${props.species || 'Unknown'}</h3>
            <table class="text-sm w-full">
              ${Object.entries(props)
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
        return marker;
      },
    }).addTo(map);

    // Fit bounds to points if any exist
    if (points.features.length > 0) {
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
    
    // Ensure map renders correctly
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
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