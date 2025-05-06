// src/pages/Runners.jsx - Updated to ensure live data usage
import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import Loading from '../components/Loading';
import Error from '../components/Error';
import { listenToRunnerLocation, removeListeners, connectToAdminDashboard } from '../utils/socket';
import RunnerMapPopup from '../components/RunnerDetailsPopup';
import { showError, showSuccess } from '../utils/modalManager';

export default function Runners() {
  const [runners, setRunners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedRunner, setSelectedRunner] = useState(null);
  const [locationUpdateCounter, setLocationUpdateCounter] = useState(0);

  useEffect(() => {
    // Connect to WebSocket on component mount
    connectToAdminDashboard();
    
    // Set up real-time listener for runner location updates
    listenToRunnerLocation(handleRunnerLocationUpdate);
    
    // Clean up listeners on unmount
    return () => {
      removeListeners();
    };
  }, []);

  useEffect(() => {
    // Fetch runners when page or filters change
    fetchRunners();
  }, [pagination.page, filters, locationUpdateCounter]);

  // Handler for real-time runner location updates
  const handleRunnerLocationUpdate = (data) => {
    if (!data || !data.runnerId) return;
    
    console.log('Received location update for runner:', data.runnerId);
    
    // Update runner in state if already in the list
    setRunners(prevRunners => {
      const updated = prevRunners.map(runner => {
        if (runner._id === data.runnerId || runner.runnerNumber === data.runnerNumber) {
          return {
            ...runner,
            lastKnownLocation: data.location,
            status: data.status || runner.status,
            lastUpdate: new Date().toISOString() // Add timestamp for last update
          };
        }
        return runner;
      });
      
      // If the runner was in our list, return the updated list
      if (updated.some(r => r._id === data.runnerId || r.runnerNumber === data.runnerNumber)) {
        return updated;
      }
      
      // Otherwise, don't change the list, but trigger a refetch to get new data
      setLocationUpdateCounter(prev => prev + 1);
      return prevRunners;
    });
    
    // Also update the selected runner if it's the one being updated
    if (selectedRunner && (selectedRunner._id === data.runnerId || selectedRunner.runnerNumber === data.runnerNumber)) {
      setSelectedRunner(prev => ({
        ...prev,
        lastKnownLocation: data.location,
        status: data.status || prev.status,
        lastUpdate: new Date().toISOString()
      }));
    }
  };

  const fetchRunners = async () => {
    try {
      setLoading(true);
      const { page, limit } = pagination;
      const { status, category, search } = filters;
      
      // Build query string following the API documentation
      let query = `?page=${page}&limit=${limit}`;
      if (status) query += `&status=${status}`;
      if (category) query += `&category=${category}`;
      if (search) query += `&search=${search}`;
      
      console.log(`Fetching runners with query: ${query}`);
      
      // Use axios instance to fetch from the API endpoint
      const response = await axios.get(`/runners${query}`);
      
      // Check if the response is successful
      if (response.data?.success) {
        console.log(`Received ${response.data.data?.length || 0} runners out of ${response.data.count || 0} total`);
        setRunners(response.data.data || []);
        setPagination({
          ...pagination,
          total: response.data.count || 0,
          totalPages: Math.ceil((response.data.count || 0) / pagination.limit)
        });
        setError(null);
      } else {
        throw new Error(response.data?.error || 'Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching runners:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch runners');
      
      // Important: Don't use mock data, only show the error
      setRunners([]);
      setPagination({
        ...pagination,
        total: 0,
        totalPages: 0
      });
      
      showError('Unable to fetch runners data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setPagination({ ...pagination, page: 1 }); // Reset to first page when filter changes
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // The search will be triggered by the useEffect as filters change
    fetchRunners();
  };

  const exportRunners = async () => {
    try {
      setExportLoading(true);
      
      // Using the specified endpoint for exporting runners
      const response = await axios.get('/runners/export', {
        responseType: 'blob' // Important to handle file download
      });
      
      // Create a download link for the CSV file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `runners-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showSuccess('Runners data exported successfully.');
    } catch (err) {
      console.error('Error exporting runners:', err);
      showError('Failed to export runners data. Please try again later.');
    } finally {
      setExportLoading(false);
    }
  };

  const updateRunnerStatus = async (runnerId, status, location = null) => {
    try {
      const data = { status };
      if (location) {
        data.lastKnownLocation = location;
      }
      
      // Use the API endpoint to update runner status
      const response = await axios.put(`/runners/${runnerId}`, data);
      
      if (response.data?.success) {
        // Update the runner in the local state
        setRunners(prevRunners => 
          prevRunners.map(runner => 
            runner._id === runnerId ? { ...runner, status, ...(location && { lastKnownLocation: location }) } : runner
          )
        );
        
        showSuccess(`Runner status updated to ${status.charAt(0).toUpperCase() + status.slice(1)}`);
      } else {
        throw new Error(response.data?.error || 'Invalid update response');
      }
    } catch (err) {
      console.error('Error updating runner status:', err);
      showError(err.response?.data?.error || err.message || 'Failed to update runner status');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'registered':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Updated to show map popup instead of opening a new window
  const viewRunnerDetails = (runner) => {
    setSelectedRunner(runner);
  };

  if (loading && pagination.page === 1) return <Loading />;
  
  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Runners</h1>
          <p className="mt-1 text-sm text-gray-500">Manage marathon participants</p>
        </div>
        <button
          onClick={exportRunners}
          disabled={exportLoading}
          className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exportLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Export CSV
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSearch} className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          <div className="sm:flex-1">
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                name="search"
                id="search"
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Search by name, email, or runner number"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <label htmlFor="status" className="sr-only">
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
              <option value="registered">Registered</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <label htmlFor="category" className="sr-only">
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
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <AdjustmentsHorizontalIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Apply Filters
          </button>
        </form>
      </div>

      {/* Error Display */}
      {error && <Error message={error} onRetry={fetchRunners} />}

      {/* Runners Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Runner
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Categories
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Location
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Registered
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <Loading />
                  </td>
                </tr>
              ) : runners.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No runners found matching the current filters
                  </td>
                </tr>
              ) : (
                runners.map((runner) => (
                  <tr key={runner._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{runner.name}</div>
                          <div className="text-sm text-gray-500">{runner.runnerNumber}</div>
                          <div className="text-sm text-gray-500">{runner.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {runner.registeredCategories && runner.registeredCategories.length > 0 ? (
                          runner.registeredCategories.map((category) => (
                            <span
                              key={category}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {category}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">No categories</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                          runner.status
                        )}`}
                      >
                        {runner.status ? runner.status.charAt(0).toUpperCase() + runner.status.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {runner.lastKnownLocation ? (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span>
                            {runner.lastKnownLocation.coordinates[1].toFixed(4)}, {runner.lastKnownLocation.coordinates[0].toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not available</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {runner.createdAt ? (
                        new Date(runner.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      ) : (
                        'Unknown'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-primary-600 hover:text-primary-900 mr-3"
                        onClick={() => viewRunnerDetails(runner)}
                      >
                        View
                      </button>
                      <button
                        className="text-primary-600 hover:text-primary-900"
                        onClick={() => {
                          const newStatus = runner.status === 'active' ? 'completed' : 'active';
                          updateRunnerStatus(runner._id, newStatus);
                        }}
                      >
                        {runner.status === 'active' ? 'Complete' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === pageNum
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === pagination.totalPages
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
            
            {/* Mobile pagination */}
            <div className="flex items-center justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  pagination.page === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <div className="text-sm text-gray-700">
                <span className="font-medium">{pagination.page}</span> of{' '}
                <span className="font-medium">{pagination.totalPages}</span>
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  pagination.page === pagination.totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map Popup */}
      {selectedRunner && (
        <RunnerMapPopup 
          runner={selectedRunner} 
          onClose={() => setSelectedRunner(null)} 
        />
      )}
    </div>
  );
}
