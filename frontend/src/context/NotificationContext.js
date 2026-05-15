import React, { createContext, useContext, useState, useCallback } from 'react';
import { FiX, FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de un NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'info', title = null) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, message, type, title }]);

    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  }, []);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* Portal de Notificaciones */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {notifications.map((n) => (
          <NotificationItem 
            key={n.id} 
            notification={n} 
            onClose={() => removeNotification(n.id)} 
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

const NotificationItem = ({ notification, onClose }) => {
  const { message, type, title } = notification;

  const styles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-100 dark:border-green-800',
      icon: <FiCheckCircle className="text-green-500" />,
      text: 'text-green-800 dark:text-green-200',
      title: title || 'Éxito'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-100 dark:border-red-800',
      icon: <FiAlertCircle className="text-red-500" />,
      text: 'text-red-800 dark:text-red-200',
      title: title || 'Error de Sistema'
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-100 dark:border-yellow-800',
      icon: <FiAlertTriangle className="text-yellow-500" />,
      text: 'text-yellow-800 dark:text-yellow-200',
      title: title || 'Atención'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-100 dark:border-blue-800',
      icon: <FiInfo className="text-blue-500" />,
      text: 'text-blue-800 dark:text-blue-200',
      title: title || 'Información'
    }
  };

  const s = styles[type] || styles.info;

  return (
    <div className={`pointer-events-auto flex items-start gap-4 p-4 rounded-2xl border ${s.bg} ${s.border} shadow-2xl shadow-black/5 animate-in slide-in-from-right-8 fade-in duration-300`}>
      <div className="mt-0.5">{s.icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-bold ${s.text} mb-0.5`}>{s.title}</h4>
        <p className={`text-xs opacity-80 ${s.text} leading-relaxed break-words`}>{message}</p>
      </div>
      <button 
        onClick={onClose}
        className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
      >
        <FiX className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
};
