// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { 
  UsersIcon, 
  MapIcon, 
  FlagIcon,
  ShieldCheckIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  Legend
} from 'recharts';
import Loading from '../components/Loading';
import Error from '../components/Error';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [runnerStats, setRunnerStats] = useState({ count: 0, runners: [] });
  const [routes, setRoutes] = useState({ count: 0, routes: [] });
  const [races, setRaces] = useState({ count: 0, races: [] });
  const [chartData, setChartData] = useState([]);
  const [routeData, setRouteData] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch admin users - as listed in the API documentation
      const adminsResponse = await axios.get('/auth/admins');
      if (adminsResponse.data?.success) {
        setAdminUsers(adminsResponse.data.data || []);
      } else {
        throw new Error('Failed to fetch admin users');
      }

      // Fetch runners with pagination - as listed in the API documentation
      const runnersResponse = await axios.get('/runners?limit=10');
      if (runnersResponse.data?.success) {
        setRunnerStats({
          count: runnersResponse.data.count || 0,
          runners: runnersResponse.data.data || []
        });
      } else {
        throw new Error('Failed to fetch runners');
      }

      // Fetch routes - as listed in the API documentation
      const routesResponse = await axios.get('/routes');
      if (routesResponse.data?.success) {
        const routesData = routesResponse.data.data || [];
        setRoutes({
          count: routesResponse.data.count || 0,
          routes: routesData
        });
        
        // Process route data for chart
        processRouteData(routesData);
      } else {
        throw new Error('Failed to fetch routes');
      }

      // Fetch races - as listed in the API documentation
      const racesResponse = await axios.get('/races?limit=10');
      if (racesResponse.data?.success) {
        setRaces({
          count: racesResponse.data.count || 0,
          races: racesResponse.data.data || []
        });
        
        // Generate chart data from races
        generateChartData(racesResponse.data.data || []);
      } else {
        throw new Error('Failed to fetch races');
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const processRouteData = (routesData) => {
    // Group routes by category and count them
    const categoryCounts = {};
    
    routesData.forEach(route => {
      const category = route.category || 'Unknown';
      if (!categoryCounts[category]) {
        categoryCounts[category] = {
          name: category,
          count: 0,
          avgDistance: 0,
          totalDistance: 0
        };
      }
      categoryCounts[category].count++;
      categoryCounts[category].totalDistance += (route.distance || 0);
    });
    
    // Calculate average distances
    Object.keys(categoryCounts).forEach(category => {
      categoryCounts[category].avgDistance = 
        categoryCounts[category].totalDistance / categoryCounts[category].count;
    });
    
    // Convert to array for chart
    const routeChartData = Object.values(categoryCounts);
    setRouteData(routeChartData);
  };

  const generateChartData = (racesData) => {
    // Group races by date
    const racesByDate = {};
    
    racesData.forEach(race => {
      const date = new Date(race.startTime || race.createdAt);
      const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;
      
      if (!racesByDate[dateKey]) {
        racesByDate[dateKey] = {
          date: dateKey,
          participants: 0,
          completions: 0
        };
      }
      
      racesByDate[dateKey].participants++;
      if (race.status === 'completed') {
        racesByDate[dateKey].completions++;
      }
    });
    
    // Convert to array and sort by date
    const chartData = Object.values(racesByDate);
    chartData.sort((a, b) => {
      const [aMonth, aDay] = a.date.split('/').map(Number);
      const [bMonth, bDay] = b.date.split('/').map(Number);
      return aMonth !== bMonth ? aMonth - bMonth : aDay - bDay;
    });
    
    setChartData(chartData);
  };

  // Count active and completed races
  const activeRaces = races.races ? races.races.filter(race => race.status === 'in-progress').length : 0;
  const completedRaces = races.races ? races.races.filter(race => race.status === 'completed').length : 0;

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Format time for display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of Victoria Falls Marathon metrics</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Admin Users Card */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-400 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Admin Users</p>
                <p className="text-3xl font-bold mt-1">{formatNumber(adminUsers.length)}</p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Runners Card */}
        <div className="bg-gradient-to-br from-orange-400 to-pink-300 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Total Runners</p>
                <p className="text-3xl font-bold mt-1">{formatNumber(runnerStats.count)}</p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Routes Card */}
        <div className="bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Total Routes</p>
                <p className="text-3xl font-bold mt-1">{formatNumber(routes.count)}</p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <MapIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Races Card */}
        <div className="bg-gradient-to-br from-cyan-500 to-blue-400 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Total Races</p>
                <p className="text-3xl font-bold mt-1">{formatNumber(races.count)}</p>
                <p className="text-xs mt-1">{activeRaces} active races</p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <FlagIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Race Participation Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Race Participation Trends</h2>
          </div>
          <div className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                >
                  <defs>
                    <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [value, name === 'participants' ? 'Participants' : 'Completions']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      padding: '8px 12px'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="participants" 
                    name="Participants"
                    stroke="#8884d8" 
                    strokeWidth={2}
                    fill="url(#colorParticipants)" 
                    activeDot={{ r: 8 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completions" 
                    name="Completions"
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    fill="url(#colorCompletions)" 
                    activeDot={{ r: 8 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No race data available for chart</p>
              </div>
            )}
          </div>
        </div>

        {/* Route Categories Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Route Categories</h2>
          </div>
          <div className="h-80">
            {routeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={routeData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'avgDistance' ? `${value.toFixed(1)} km` : value,
                      name === 'avgDistance' ? 'Avg Distance' : 'Count'
                    ]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      padding: '8px 12px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Routes" />
                  <Bar dataKey="avgDistance" fill="#82ca9d" name="Avg Distance (km)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No route data available for chart</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Races */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <FlagIcon className="h-5 w-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Recent Races</h2>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {races.races && races.races.length > 0 ? (
            races.races.slice(0, 5).map((race) => (
              <div key={race._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {race.runner?.name || 'Unknown Runner'}
                      </p>
                      <p className="ml-2 text-sm text-gray-500">
                        ({race.runner?.runnerNumber || 'No Number'})
                      </p>
                    </div>
                    <p className="text-sm text-gray-700">
                      {race.route?.name} - {race.category}
                    </p>
                    {race.completionTime && (
                      <p className="text-xs text-gray-500 mt-1">
                        Completion Time: {formatTime(race.completionTime)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      race.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : race.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {race.status === 'completed' ? 'Completed' : 
                       race.status === 'in-progress' ? 'In Progress' : 
                       race.status}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      {new Date(race.startTime || race.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">
              No recent races found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}