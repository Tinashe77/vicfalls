// src/pages/Races.jsx - Updated to consume API data properly
import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { 
  ClockIcon,
  MapPinIcon,
  UserIcon,
  FlagIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import Loading from '../components/Loading';
import Error from '../components/Error';
import { 
  connectToAdminDashboard, 
  listenToRunnerLocation, 
  listenToRaceCompleted,
  removeListeners,
  disconnectSocket
} from '../utils/socket';
import { showInfo, showError, showSuccess, showConfirm } from '../utils/modalManager';

export default function Races() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRace, setSelectedRace] = useState(null);
  const [view, setView] = useState('list'); // 'list' or 'detail'
  const [filters, setFilters] = useState({
    status: '',
    category: ''
  });
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    connectToAdminDashboard();
    
    // Set up listeners for real-time updates
    listenToRunnerLocation(handleRunnerLocationUpdate);
    listenToRaceCompleted(handleRaceCompleted);
    
    // Fetch races on load
    fetchRaces();
    
    // Clean up listeners when component unmounts
    return () => {
      removeListeners();
      disconnectSocket();
    };
  }, [filters]); // Re-fetch when filters change

  // Handler for real-time runner location updates
  const handleRunnerLocationUpdate = (data) => {
    setRaces(prevRaces => {
      return prevRaces.map(race => {
        if (race._id === data.raceId) {
          // Update the race with the new tracking data
          return {
            ...race,
            trackingData: [
              ...(race.trackingData || []),
              {
                timestamp: data.timestamp,
                location: data.location,
                elevation: data.elevation,
                speed: data.speed
              }
            ]
          };
        }
        return race;
      });
    });
    
    // If we're viewing a race detail and it's the updated race, update the selected race
    if (selectedRace && selectedRace._id === data.raceId) {
      setSelectedRace(prevRace => {
        return {
          ...prevRace,
          trackingData: [
            ...(prevRace.trackingData || []),
            {
              timestamp: data.timestamp,
              location: data.location,
              elevation: data.elevation,
              speed: data.speed
            }
          ]
        };
      });
    }
  };

  // Handler for race completion events
  const handleRaceCompleted = (data) => {
    setRaces(prevRaces => {
      return prevRaces.map(race => {
        if (race._id === data.raceId) {
          // Update the race with completion data
          return {
            ...race,
            status: 'completed',
            finishTime: data.finishTime,
            completionTime: data.completionTime,
            averagePace: data.averagePace
          };
        }
        return race;
      });
    });
    
    // If we're viewing a race detail and it's the completed race, update the selected race
    if (selectedRace && selectedRace._id === data.raceId) {
      setSelectedRace(prevRace => {
        return {
          ...prevRace,
          status: 'completed',
          finishTime: data.finishTime,
          completionTime: data.completionTime,
          averagePace: data.averagePace
        };
      });

      // Show notification about race completion
      showSuccess(`Race completed by ${selectedRace.runner.name} in ${formatTime(data.completionTime)}!`);
    }
  };

  const fetchRaces = async () => {
    try {
      setLoading(true);
      
      // Prepare query params from filters
      let query = '';
      if (filters.status || filters.category) {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.category) params.append('category', filters.category);
        query = `?${params.toString()}`;
      }
      
      // Fetch races from the API endpoint
      const response = await axios.get(`/races${query}`);
      
      // Check if the response is successful
      if (response.data && response.data.success) {
        setRaces(response.data.data || []);
        setError(null);
      } else {
        throw new Error(response.data?.error || 'Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching races:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch races');
      
      // Show error notification
      showError('Unable to fetch races data. Please try again later.');
      
      // Set empty array instead of using mock data
      setRaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const applyFilters = () => {
    fetchRaces();
  };

  const openRaceDetail = async (race) => {
    try {
      setLoading(true);
      
      // Fetch the full race details
      const response = await axios.get(`/races/${race._id}`);
      
      if (response.data && response.data.success) {
        setSelectedRace(response.data.data);
        setView('detail');
      } else {
        throw new Error(response.data?.error || 'Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching race details:', err);
      showError('Failed to load race details. Please try again.');
      
      // Fall back to the summary data if API fails
      setSelectedRace(race);
      setView('detail');
    } finally {
      setLoading(false);
    }
  };

  const goBackToList = () => {
    setView('list');
    setSelectedRace(null);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace) => {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'started':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const generateCertificate = async (raceId) => {
    try {
      setCertificateLoading(true);
      
      // Use the specific certificate endpoint
      const response = await axios.get(`/races/${raceId}/certificate`, {
        responseType: 'blob' // Important for downloading files
      });
      
      // Create a download link for the PDF certificate
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `race-certificate-${raceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Show success notification
      showSuccess('Certificate generated and downloaded successfully.');
      
    } catch (err) {
      console.error('Error generating certificate:', err);
      showError('Failed to generate certificate. Please try again later.');
    } finally {
      setCertificateLoading(false);
    }
  };

  const refreshRaceData = async (raceId) => {
    try {
      setRefreshLoading(true);
      
      // Fetch updated race data
      const response = await axios.get(`/races/${raceId}`);
      
      if (response.data && response.data.success) {
        // Update selected race if we're in detail view
        if (view === 'detail' && selectedRace?._id === raceId) {
          setSelectedRace(response.data.data);
        }
        
        // Update race in the list
        setRaces(prevRaces => {
          return prevRaces.map(race => 
            race._id === raceId ? response.data.data : race
          );
        });
        
        showSuccess('Race data refreshed successfully.');
      } else {
        throw new Error(response.data?.error || 'Invalid API response format');
      }
      
    } catch (err) {
      console.error('Error refreshing race data:', err);
      showError('Failed to refresh race data. Please try again.');
    } finally {
      setRefreshLoading(false);
    }
  };

  // Race List View
  const RaceListView = () => (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Races</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor ongoing and completed races</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="sm:flex sm:items-center sm:gap-4">
          <div className="w-full sm:w-auto">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Filter by Status
            </label>
            <select
              id="status"
              name="status"
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="started">Started</option>
            </select>
          </div>
          <div className="w-full sm:w-auto mt-4 sm:mt-0">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Filter by Category
            </label>
            <select
              id="category"
              name="category"
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              <option value="Half Marathon">Half Marathon</option>
              <option value="Full Marathon">Full Marathon</option>
              <option value="Fun Run">Fun Run</option>
            </select>
          </div>
          <div className="mt-4 sm:mt-auto">
            <button
              type="button"
              onClick={applyFilters}
              className="w-full sm:w-auto inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Races List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {loading ? (
            <li className="px-6 py-4 flex items-center justify-center">
              <Loading />
            </li>
          ) : races.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No races found
            </li>
          ) : (
            races.map((race) => (
              <li key={race._id}>
                <div className="px-4 py-4 flex items-center sm:px-6 hover:bg-gray-50 cursor-pointer" onClick={() => openRaceDetail(race)}>
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <div className="flex text-sm">
                        <p className="font-medium text-primary-600 truncate">{race.runner.name}</p>
                        <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                          ({race.runner.runnerNumber})
                        </p>
                      </div>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-gray-500">
                          <FlagIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          <p>
                            {race.route.name} <span className="mx-1">•</span> {race.category}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                      <div className="flex flex-col space-y-2 sm:items-end">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                            race.status
                          )}`}
                        >
                          {race.status === 'in-progress' ? 'In Progress' : 
                           race.status === 'completed' ? 'Completed' : 
                           race.status.charAt(0).toUpperCase() + race.status.slice(1)}
                        </span>
                        <div className="text-sm text-gray-500">
                          {race.status === 'completed' ? (
                            <span>Completed in {formatTime(race.completionTime)}</span>
                          ) : (
                            <span>Started {formatDateTime(race.startTime)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-5 flex-shrink-0">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );

  // Race Detail View
  const RaceDetailView = () => {
    if (!selectedRace) return null;

    // Get last known position from tracking data
    const lastPosition = selectedRace.trackingData && 
                         selectedRace.trackingData.length > 0 ? 
                         selectedRace.trackingData[selectedRace.trackingData.length - 1] : null;

    return (
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={goBackToList}
              className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-900"
            >
              <ChevronLeftIcon className="mr-1 h-5 w-5" aria-hidden="true" />
              Back to races
            </button>
            <h1 className="mt-2 text-2xl font-semibold text-gray-900">{selectedRace.route.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {selectedRace.category} • {selectedRace.runner.name} ({selectedRace.runner.runnerNumber})
            </p>
          </div>
          <div className="mt-4 flex space-x-3 sm:mt-0">
            <button
              type="button"
              onClick={() => refreshRaceData(selectedRace._id)}
              disabled={refreshLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                  Refresh Data
                </>
              )}
            </button>
            {selectedRace.status === 'completed' && (
              <button
                type="button"
                onClick={() => generateCertificate(selectedRace._id)}
                disabled={certificateLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {certificateLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5" />
                    Get Certificate
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Status and Time Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <span
                className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                  selectedRace.status
                )}`}
              >
                {selectedRace.status === 'in-progress' ? 'In Progress' : 
                 selectedRace.status === 'completed' ? 'Completed' : 
                 selectedRace.status.charAt(0).toUpperCase() + selectedRace.status.slice(1)}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Start Time</h3>
              <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedRace.startTime)}</p>
            </div>
            {selectedRace.status === 'completed' && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Finish Time</h3>
                  <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedRace.finishTime)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Completion Time</h3>
                  <p className="mt-1 text-sm text-gray-900">{formatTime(selectedRace.completionTime)}</p>
                </div>
              </>
            )}
            {selectedRace.averagePace && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Average Pace</h3>
                <p className="mt-1 text-sm text-gray-900">{formatPace(selectedRace.averagePace)}</p>
              </div>
            )}
            {lastPosition && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Known Position</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {lastPosition.location.coordinates[1].toFixed(4)}, {lastPosition.location.coordinates[0].toFixed(4)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p className="mt-1 text-sm text-gray-900">{formatDateTime(lastPosition.timestamp)}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Checkpoints */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Checkpoints</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {selectedRace.checkpointTimes && selectedRace.checkpointTimes.length > 0 ? (
              selectedRace.checkpointTimes.map((checkpoint, idx) => (
                <div key={idx} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-primary-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{checkpoint.checkpoint.name}</p>
                        <p className="text-sm text-gray-500">{checkpoint.checkpoint.distanceFromStart} km from start</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDateTime(checkpoint.time)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-4 text-center text-gray-500">
                No checkpoint data available
              </div>
            )}
          </div>
        </div>

        {/* Tracking Data */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Tracking Data</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Elevation
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Speed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedRace.trackingData && selectedRace.trackingData.length > 0 ? (
                  selectedRace.trackingData.map((point, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(point.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {point.location.coordinates[1].toFixed(4)}, {point.location.coordinates[0].toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {point.elevation} m
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {point.speed.toFixed(1)} km/h
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      No tracking data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Map Visualization */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Map Visualization</h2>
          </div>
          <div className="p-6 flex items-center justify-center bg-gray-100 h-96">
            <div className="text-center text-gray-500">
              <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm font-medium">Map visualization would be displayed here</p>
              <p className="text-xs">In a real application, this would show a map with the runner's path and current location</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return view === 'list' ? <RaceListView /> : <RaceDetailView />;
}