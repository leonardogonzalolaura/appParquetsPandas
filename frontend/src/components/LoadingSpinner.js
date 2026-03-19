import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Cargando...', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.md;

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center z-50 transition-colors">
        <div className="text-center">
          <div className={`${spinnerSize} loading-spinner mx-auto mb-4`}></div>
          {text && <p className="text-gray-600 dark:text-gray-400">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${spinnerSize} loading-spinner mb-3`}></div>
      {text && <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
