'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchMapPoints } from '@/app/lib/client_actions';

export default function MapView({ dashboardId }: { dashboardId: string }) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [points, setPoints] = useState<GeoJSON.FeatureCollection | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const mapRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      // Check if Leaflet has already attached itself to this DOM element
      // Leaflet adds a '_leaflet_id' property to the container once initialized
      if ((node as any)._leaflet_id) {
        return; 
      }

      const instance = L.map(node).setView([0, 0], 2);
      
      // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      //   attribution: '&copy; OSM',
      //   zIndex: 1 
      // }).addTo(instance);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(instance);

      instance.invalidateSize();
      mapInstanceRef.current = instance;
      setMap(instance);
    }
  }, []); // Empty dependency array ensures this callback identity is stable

  // Clean up the map instance when the component unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    fetchMapPoints(dashboardId).then(setPoints).catch(console.error);
  }, [dashboardId]);

  useEffect(() => {
    if (!map || !points) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.GeoJSON) map.removeLayer(layer);
    });

    const layer = L.geoJSON(points, {
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
        radius: 4,
        fillColor: "#7c3aed",
        color: "#fff",
        weight: 2,
        fillOpacity: 0.8,
      }),
    }).addTo(map);

    if (points.features.length > 0) {
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
    
    map.invalidateSize();
  }, [map, points]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full min-h-100 bg-gray-50 rounded-xl"
      style={{ isolation: 'isolate' }} 
    />
  );
}