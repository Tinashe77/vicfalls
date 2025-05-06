// src/components/RunnerMap.jsx
import { useEffect, useRef } from 'react';

export default function RunnerMap({ location, height = '300px' }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // Dynamically import Leaflet to avoid SSR issues
    const loadMap = async () => {
      // Only create the map if it doesn't exist yet
      if (!mapInstanceRef.current && mapRef.current) {
        // Create map instance
        const L = await import('leaflet');
        
        // Make sure we have the CSS
        import('leaflet/dist/leaflet.css');
        
        // Create map centered at either the runner's location or a default location
        const coords = location?.coordinates 
          ? [location.coordinates[1], location.coordinates[0]] // Leaflet uses [lat, lng]
          : [-17.9257, 25.8526]; // Default to Victoria Falls area
        
        const map = L.map(mapRef.current).setView(coords, 15);
        
        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // If we have a location, add a marker
        if (location?.coordinates) {
          markerRef.current = L.marker(coords).addTo(map);
        }
        
        // Store the map instance for later updates
        mapInstanceRef.current = map;
      }
    };
    
    loadMap();
    
    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array means this runs once on mount
  
  // Update marker position when location changes
  useEffect(() => {
    if (mapInstanceRef.current && location?.coordinates) {
      const coords = [location.coordinates[1], location.coordinates[0]];
      
      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setLatLng(coords);
      } else {
        const L = window.L; // Access Leaflet from window after it's loaded
        if (L) {
          markerRef.current = L.marker(coords).addTo(mapInstanceRef.current);
        }
      }
      
      // Recenter map on new coordinates
      mapInstanceRef.current.setView(coords, 15);
    }
  }, [location]);

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%', borderRadius: '0.375rem', overflow: 'hidden' }}
    />
  );
}