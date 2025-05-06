// src/utils/inactivityTracker.js
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * 
 * Custom hook to track user inactivity and log out after 2 minutes
 */
export const useInactivityTracker = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const TIMEOUT_DURATION = 120 * 1000; // 2 minutes in milliseconds

  // Custom popup for timeout notification
  const showTimeoutNotification = () => {
    // Create container
    const notificationContainer = document.createElement('div');
    notificationContainer.className = 'fixed z-50 inset-0 overflow-y-auto';
    notificationContainer.setAttribute('aria-labelledby', 'timeout-modal');
    notificationContainer.setAttribute('role', 'dialog');
    notificationContainer.setAttribute('aria-modal', 'true');

    // Create notification content
    notificationContainer.innerHTML = `
      <div class="flex items-center justify-center min-h-screen">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" id="timeout-backdrop"></div>
        <div class="relative bg-white rounded-lg w-full max-w-md mx-auto p-6 shadow-xl transform transition-all">
          <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Session Expired</h3>
            <p class="text-sm text-gray-500 mb-4">You have been logged out due to inactivity.</p>
            <button id="timeout-confirm-btn" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm">
              OK
            </button>
          </div>
        </div>
      </div>
    `;

    // Add to document
    document.body.appendChild(notificationContainer);

    // Added event listeners
    document.getElementById('timeout-confirm-btn').addEventListener('click', () => {
      document.body.removeChild(notificationContainer);
    });

    document.getElementById('timeout-backdrop').addEventListener('click', () => {
      document.body.removeChild(notificationContainer);
    });
  };

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      // Log out user after timeout
      logout();
      navigate('/login');
      showTimeoutNotification();
    }, TIMEOUT_DURATION);
  };

  useEffect(() => {
    // Start the timer
    resetTimer();

    // Define event types to track
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Handler to reset timer on user activity
    const activityHandler = () => {
      resetTimer();
    };
    
    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, activityHandler);
    });
    
    // Clean up
    return () => {
      // Clear the timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Remove event listeners
      events.forEach(event => {
        window.removeEventListener(event, activityHandler);
      });
    };
  }, [logout, navigate]);
};