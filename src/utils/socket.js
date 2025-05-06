// src/utils/socket.js
import { io } from 'socket.io-client';

// Create a socket instance for the admin dashboard
const socket = io('https://econet-marathon-api.onrender.com');

// Connect to the admin dashboard channel
export const connectToAdminDashboard = () => {
  socket.emit('joinAdminDashboard');
  console.log('Connected to admin dashboard socket channel');
};

// Disconnect the socket
export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};

// Add event listeners with callbacks
export const listenToRunnerLocation = (callback) => {
  socket.on('runnerLocation', (data) => {
    callback(data);
  });
};

export const listenToRaceCompleted = (callback) => {
  socket.on('raceCompleted', (data) => {
    callback(data);
  });
};

// Remove event listeners
export const removeListeners = () => {
  if (socket) {
    socket.off('runnerLocation');
    socket.off('raceCompleted');
  }
};

export default socket;