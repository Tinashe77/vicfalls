// src/components/Loading.jsx
export default function Loading({ fullScreen = false }) {
    const baseClasses = "flex items-center justify-center";
    const classes = fullScreen ? `${baseClasses} min-h-screen` : `${baseClasses} h-64`;
  
    return (
      <div className={classes}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }