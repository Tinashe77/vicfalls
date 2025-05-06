// src/utils/modalManager.js
import { createRoot } from 'react-dom/client';
import React from 'react';
import Modal from '../components/Modal';

// Create a container for our modals
let modalContainer;
let modalRoot;

/**
 * Initialize the modal container
 */
export const initModalManager = () => {
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'modal-container';
    document.body.appendChild(modalContainer);
    modalRoot = createRoot(modalContainer);
  }
};

/**
 * Show a modal with the given parameters
 * @param {Object} params - Modal parameters
 */
export const showModal = ({ 
  title = 'Notification', 
  message, 
  type = 'info',
  confirmLabel = 'OK',
  onConfirm = null,
  cancelLabel = 'Cancel',
  duration = 0 // auto-close after duration (ms), 0 means no auto-close
}) => {
  initModalManager();
  
  // Create a random ID for this modal instance
  const modalId = `modal-${Math.random().toString(36).substr(2, 9)}`;
  
  // Create a div for this specific modal
  const modalInstanceContainer = document.createElement('div');
  modalInstanceContainer.id = modalId;
  modalContainer.appendChild(modalInstanceContainer);
  
  const instanceRoot = createRoot(modalInstanceContainer);
  
  // Function to close and clean up this modal
  const closeModal = () => {
    instanceRoot.unmount();
    if (modalInstanceContainer.parentNode) {
      modalInstanceContainer.parentNode.removeChild(modalInstanceContainer);
    }
  };
  
  // Auto-close timer if duration is provided
  let autoCloseTimer;
  if (duration > 0) {
    autoCloseTimer = setTimeout(closeModal, duration);
  }
  
  // Render the modal - using React.createElement instead of JSX
  instanceRoot.render(
    React.createElement(Modal, {
      isOpen: true,
      onClose: () => {
        if (autoCloseTimer) clearTimeout(autoCloseTimer);
        closeModal();
      },
      title: title,
      message: message,
      type: type,
      confirmLabel: confirmLabel,
      onConfirm: onConfirm,
      cancelLabel: cancelLabel
    })
  );
  
  // Return a function that can be used to close the modal programmatically
  return closeModal;
};

/**
 * Show an info modal (replacement for alert)
 */
export const showInfo = (message, title = 'Information') => {
  return showModal({ title, message, type: 'info' });
};

/**
 * Show a success modal
 */
export const showSuccess = (message, title = 'Success') => {
  return showModal({ title, message, type: 'success' });
};

/**
 * Show a warning modal
 */
export const showWarning = (message, title = 'Warning') => {
  return showModal({ title, message, type: 'warning' });
};

/**
 * Show an error modal
 */
export const showError = (message, title = 'Error') => {
  return showModal({ title, message, type: 'error' });
};

/**
 * Show a confirmation modal (replacement for confirm)
 */
export const showConfirm = (message, onConfirm, title = 'Confirm', confirmLabel = 'Yes', cancelLabel = 'No') => {
  return showModal({
    title,
    message,
    type: 'warning',
    confirmLabel,
    onConfirm,
    cancelLabel
  });
};