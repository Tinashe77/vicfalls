// src/pages/Login.jsx - Updated to use modal system
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';
import vicFalls from '../assets/vic-falls.jpg';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { initModalManager, showError } from '../utils/modalManager';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Initialize modal system
  useEffect(() => {
    initModalManager();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error in component:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
      
      // Show error modal for network errors
      if (err.message.includes('Unable to connect') || err.message.includes('Network Error')) {
        showError(err.message, 'Connection Error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-300 via-purple-400 to-indigo-400" 
         style={{ 
          backgroundImage: `url(${vicFalls})`, // Replace with your image path
           backgroundRepeat: "no-repeat",
           backgroundAttachment: "fixed",
           backgroundPositionY: "top",
           backgroundPositionX: "center",
           backgroundSize: "cover",
           backgroundPosition: "center"
         }}>
      <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-r from-indigo-500/30 to-purple-500/30"></div>
      
      {/* Login Form */}
      <div className="z-10 bg-gray-800/70 p-8 rounded-lg shadow-2xl w-full max-w-md mx-auto backdrop-blur-sm text-white">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
              <img src={logo} alt="Econet Marathon" className="h-8 w-8" />
            </div>
          </div>
          <h2 className="text-xl font-semibold">Log in to your account</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-900/50 flex items-center gap-2">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
            <span className="text-sm text-red-200">{error}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
              Username
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="appearance-none block w-full px-3 py-2 border-0 border-b border-gray-400 bg-transparent placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none block w-full px-3 py-2 border-0 border-b border-gray-400 bg-transparent placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300">
            <a href="#" className="hover:text-blue-400 transition-colors">Can't log in?</a>
          </p>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-700 text-center text-xs text-gray-400">
          <span className="mr-2">Privacy policy</span>
          ·
          <span className="ml-2">Terms of use</span>
        </div>
      </div>
    </div>
  );
}