// src/components/RunnerMapPopup.jsx
import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, MapPinIcon, ArrowUpRightIcon, ClockIcon, UserIcon, DocumentTextIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const RunnerMapPopup = ({ runner, onClose }) => {
  const mapRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  
  // First, load Leaflet scripts and styles
  useEffect(() => {
    // Only load Leaflet if it's not already loaded
    if (typeof window.L === 'undefined') {
      // Load the Leaflet CSS
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.css';
      document.head.appendChild(linkElement);
      
      // Load the Leaflet script
      const scriptElement = document.createElement('script');
      scriptElement.src = 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.js';
      scriptElement.async = true;
      
      scriptElement.onload = () => {
        // Mark Leaflet as loaded after script has loaded
        setLeafletLoaded(true);
      };
      
      document.body.appendChild(scriptElement);
      
      return () => {
        // Clean up the script and link elements when component unmounts
        if (document.head.contains(linkElement)) {
          document.head.removeChild(linkElement);
        }
        if (document.body.contains(scriptElement)) {
          document.body.removeChild(scriptElement);
        }
      };
    } else {
      // Leaflet is already loaded
      setLeafletLoaded(true);
    }
  }, []);
  
  // Second, initialize the map only after Leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !runner?.lastKnownLocation) {
      return;
    }

    // Clear any existing map
    mapRef.current.innerHTML = '';
    
    // Now Leaflet is guaranteed to be loaded, we can use it
    try {
      const L = window.L; // Use the global L object
      
      const coords = [
        runner.lastKnownLocation.coordinates[1], 
        runner.lastKnownLocation.coordinates[0]
      ];
      
      // Create the map with higher zoom level
      const map = L.map(mapRef.current, {
        zoomControl: false, // Remove zoom controls to match design
        attributionControl: false // Remove attribution to match design
      }).setView(coords, 15);
      
      // Add the map tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      
      // Add a marker for the runner's position
      if (runner.lastKnownLocation) {
        L.marker(coords).addTo(map);
      }
      
      // Cleanup function for this effect
      return () => {
        if (map) {
          map.remove();
        }
      };
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, [leafletLoaded, runner]);
  
  // Format coordinates based on the screenshot layout
  const formattedCoordinates = runner?.lastKnownLocation ? 
    `${runner.lastKnownLocation.coordinates[1].toFixed(6)}° N, ${runner.lastKnownLocation.coordinates[0].toFixed(6)}° E` : 
    '';
  
  return (
    <div className="fixed inset-0 z-50" aria-labelledby="runner-map-modal" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen">
        {/* Light blue/gray background overlay */}
        <div className="fixed inset-0 bg-blue-50/90" onClick={onClose}></div>
        
        {/* Map and details container - matches screenshot layout */}
        <div className="relative bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-5xl mx-auto">
          {/* Close button */}
          <button 
            type="button" 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          
          {/* Map container */}
          <div className="flex flex-col md:flex-row h-[600px]">
            {/* Map section - takes 2/3 width on desktop */}
            <div className="w-full md:w-2/3 h-[300px] md:h-full">
              <div ref={mapRef} className="w-full h-full bg-gray-200">
                {!runner?.lastKnownLocation && (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <p>No location data available for this runner</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Info panel - takes 1/3 width on desktop */}
            <div className="w-full md:w-1/3 h-[300px] md:h-full bg-white p-6 overflow-y-auto">
              <div className="grid grid-cols-1 gap-5">
                {/* Row 1 */}
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-blue-500">Runner:</div>
                    <div className="text-gray-800 font-medium">{runner?.name || 'N/A'}</div>
                  </div>
                </div>
                
                {/* Row 2 */}
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-blue-500">Location Coordinates:</div>
                    <div className="text-gray-800">{formattedCoordinates || 'N/A'}</div>
                  </div>
                </div>
                
                {/* Row 3 */}
                <div className="flex items-start">
                  <ArrowUpRightIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-blue-500">Runner Number:</div>
                    <div className="text-gray-800">{runner?.runnerNumber || 'N/A'}</div>
                  </div>
                </div>
                
                {/* Row 4 */}
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-blue-500">Last Update:</div>
                    <div className="text-gray-800">
                      {runner?.lastUpdate ? new Date(runner.lastUpdate).toLocaleString() : 'Current'}
                    </div>
                  </div>
                </div>
                
                {/* Row 5 */}
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-blue-500">Status:</div>
                    <div className="text-gray-800">
                      {runner?.status ? (runner.status.charAt(0).toUpperCase() + runner.status.slice(1)) : 'N/A'}
                    </div>
                  </div>
                </div>
                
                {/* Row 6 */}
                <div className="flex items-start">
                  <DocumentTextIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-blue-500">Categories:</div>
                    <div className="text-gray-800">
                      {runner?.registeredCategories?.length > 0 ? 
                        runner.registeredCategories.join(', ') : 
                        'None'}
                    </div>
                  </div>
                </div>
                
                {/* Row 7 */}
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-blue-500">Registration:</div>
                    <div className="text-gray-800">
                      {runner?.createdAt ? new Date(runner.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
                
                {/* Row 8 */}
                <div className="flex items-start">
                  <EnvelopeIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-blue-500">Contact:</div>
                    <div className="text-gray-800">
                      {runner?.email || 'N/A'}
                    </div>
                  </div>
                </div>
                
                {/* Race Data Section */}
                <div className="flex items-start">
                  <ArrowUpRightIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-blue-500">Race Data:</div>
                    <div className="text-gray-800">
                      {runner?.races && runner.races.length > 0 ? 
                        runner.races.map((race, index) => (
                          <div key={index} className="mb-2">
                            <p className="font-medium">{race.name}</p>
                            <p className="text-sm">{race.date}</p>
                            {race.completionTime && (
                              <p>
                                Time: {typeof race.completionTime === 'number' ? 
                                  `${Math.floor(race.completionTime / 3600)}:${Math.floor((race.completionTime % 3600) / 60).toString().padStart(2, '0')}:${(race.completionTime % 60).toString().padStart(2, '0')}` : 
                                  race.completionTime}
                              </p>
                            )}
                          </div>
                        )) : 
                        'No race data available'
                      }
                    </div>
                  </div>
                </div>
                
                {/* Additional Information */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-gray-700 font-medium mb-1">Additional Information</h3>
                  <p className="text-sm text-gray-600">
                    View this runner's detailed race history and statistics in the Races section.
                  </p>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunnerMapPopup;