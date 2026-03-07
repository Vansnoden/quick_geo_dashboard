'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchMapPoints } from '@/app/lib/client_actions';


interface Props {
  dashboardId: string;
  latCol: string;
  lonCol: string;
}

export default function MapView({ dashboardId, latCol, lonCol }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [points, setPoints] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMapPoints(dashboardId)
      .then(setPoints)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [dashboardId]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current).setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    mapInstanceRef.current = map;
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !points) return;
    const map = mapInstanceRef.current;

    // Clear old layers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.GeoJSON) {
        map.removeLayer(layer);
      }
    });

    // Add points
    L.geoJSON(points, {
      pointToLayer: (feature, latlng) => L.marker(latlng)
    }).addTo(map);

    // Fit bounds
    const bounds = L.geoJSON(points).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds);
  }, [points]);

  if (loading) return <div className="h-96 bg-gray-200 animate-pulse" />;
  if (error) return <div className="text-red-500">Error loading map: {error}</div>;

  return <div ref={mapRef} className="h-full w-full" />;
}