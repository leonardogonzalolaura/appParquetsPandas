import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import { FiRefreshCw } from "react-icons/fi";
import { TbBrandAws, TbCloudDataConnection } from "react-icons/tb";

// Componentes
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import BucketExplorer from "./pages/BucketExplorer";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import ErrorBoundary from "./components/ErrorBoundary";

// Configuración de axios
axios.defaults.baseURL =
  process.env.REACT_APP_API_URL || "http://localhost:8000";
axios.defaults.headers.common["Content-Type"] = "application/json";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [navigatePath, setNavigatePath] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState({
    totalBuckets: 0,
    totalFiles: 0,
    totalSizeGB: 0,
    lastSync: null,
  });

  // Verificar conexión al backend
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await axios.get("/health");
        if (response.data.status === "healthy") {
          setConnectionStatus("connected");

          // Cargar buckets
          await loadBuckets();
        } else {
          setConnectionStatus("error");
        }
      } catch (error) {
        console.error("Error de conexión:", error);
        setConnectionStatus("error");
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  const loadBuckets = async () => {
    try {
      const response = await axios.get("/api/buckets");
      setBuckets(response.data);

      // Actualizar estadísticas
      setStats((prev) => ({
        ...prev,
        totalBuckets: response.data.length,
        lastSync: new Date().toISOString(),
      }));
    } catch (error) {
      console.error("Error al cargar buckets:", error);
    }
  };

  const handleBucketSelect = (bucket) => {
    setSelectedBucket(bucket);
    setNavigatePath(null);
  };

  const handleNavigatePath = (path) => {
    setNavigatePath(path);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadBuckets();
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 loading-spinner mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Conectando con S3...
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Verificando credenciales y cargando buckets
          </p>
        </div>
      </div>
    );
  }

  if (connectionStatus === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-danger-100 dark:bg-danger-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <TbCloudDataConnection className="w-10 h-10 text-danger-600 dark:text-danger-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Error de Conexión
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No se pudo conectar con el servidor backend. Por favor verifica:
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-left mb-6 border border-gray-200 dark:border-gray-700">
            <ul className="space-y-3">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-danger-500 rounded-full mr-3"></div>
                <span>El servidor backend está ejecutándose</span>
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-danger-500 rounded-full mr-3"></div>
                <span>Las credenciales AWS están configuradas</span>
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-danger-500 rounded-full mr-3"></div>
                <span>La URL del API es correcta</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary w-full"
          >
            <FiRefreshCw className="mr-2" />
            Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
          <Sidebar
            buckets={buckets}
            selectedBucket={selectedBucket}
            onBucketSelect={handleBucketSelect}
            stats={stats}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          />

          <div className="flex-1 flex flex-col">
            <Header
              selectedBucket={selectedBucket}
              onRefresh={handleRefresh}
              connectionStatus={connectionStatus}
              onNavigatePath={handleNavigatePath}
            />

            <main className="flex-1 p-6 overflow-auto">
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route
                  path="/dashboard"
                  element={
                    <Dashboard
                      buckets={buckets}
                      stats={stats}
                      onBucketSelect={handleBucketSelect}
                    />
                  }
                />
                <Route
                  path="/explorer"
                  element={
                    <BucketExplorer
                      selectedBucket={selectedBucket}
                      onBucketSelect={handleBucketSelect}
                      navigatePath={navigatePath}
                      onNavigatePathDone={() => setNavigatePath(null)}
                    />
                  }
                />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>

            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <TbBrandAws className="w-4 h-4 mr-2" />
                    <span>S3 Parquet Explorer v1.0.0</span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${connectionStatus === "connected"
                        ? "bg-success-500"
                        : "bg-danger-500"
                        }`}
                    ></div>
                    <span>
                      {connectionStatus === "connected"
                        ? "Conectado"
                        : "Desconectado"}
                    </span>
                  </div>
                </div>
                <div>
                  {stats.lastSync && (
                    <span>
                      Última sincronización:{" "}
                      {new Date(stats.lastSync).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </footer>
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
