import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import { FiLogOut } from "react-icons/fi";
import { TbBrandAws } from "react-icons/tb";

// Componentes
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import BucketExplorer from "./pages/BucketExplorer";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import WelcomeScreen from "./components/setup/WelcomeScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import ProfileService from "./services/ProfileService";

// Configuración de axios
axios.defaults.baseURL = process.env.REACT_APP_API_URL || "http://localhost:3015/api/";
axios.interceptors.request.use(config => {
  // Solo agregar Content-Type para métodos que tengan body
  if (config.method !== 'get' && config.method !== 'delete') {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

function App() {
  const [activeProfile, setActiveProfile] = useState(null);
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

  // Configurar interceptores de axios para enviar credenciales del perfil activo
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(async (config) => {
      const profile = await ProfileService.getActiveProfile();
      if (profile) {
        config.headers["x-aws-access-key"] = profile.accessKey;
        config.headers["x-aws-secret-key"] = profile.secretKey;
        config.headers["x-aws-region"] = profile.region;
      }
      return config;
    });

    return () => axios.interceptors.request.eject(interceptor);
  }, [activeProfile]);

  const loadBuckets = useCallback(async (manualBuckets = []) => {
    // Si el perfil tiene buckets configurados, usarlos directamente sin llamar al API
    if (manualBuckets.length > 0) {
      const profileBuckets = manualBuckets.map(mb => ({
        name: mb,
        creation_date: new Date().toISOString(),
        isManual: true
      }));
      setBuckets(profileBuckets);
      setStats((prev) => ({
        ...prev,
        totalBuckets: profileBuckets.length,
        lastSync: new Date().toISOString(),
      }));
      setConnectionStatus("connected");
      return true;
    }

    // Sin buckets manuales: intentar listar todos los buckets del API
    try {
      const response = await axios.get("/buckets");
      const s3Buckets = response.data;
      setBuckets(s3Buckets);
      setStats((prev) => ({
        ...prev,
        totalBuckets: s3Buckets.length,
        lastSync: new Date().toISOString(),
      }));
      setConnectionStatus("connected");
      return true;
    } catch (error) {
      console.error("Error al cargar buckets:", error);
      setConnectionStatus("error");
      const errorMsg = error.response?.data?.detail || error.message;
      throw new Error(errorMsg);
    }
  }, []);

  const checkInitialProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const profile = await ProfileService.getActiveProfile();
      if (profile) {
        setActiveProfile(profile);
        // Procesar buckets manuales (separados por coma)
        const manualList = profile.defaultBucket
          ? profile.defaultBucket.split(',').map(b => b.trim()).filter(b => b)
          : [];

        await loadBuckets(manualList);

        if (manualList.length > 0 && !selectedBucket) {
          setSelectedBucket(manualList[0]);
        }
      } else {
        setActiveProfile(null);
      }
    } catch (error) {
      console.error("Fallo al inicializar perfil:", error);
      setActiveProfile(null);
      ProfileService.setActiveProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [loadBuckets, selectedBucket]);

  useEffect(() => {
    checkInitialProfile();
  }, [checkInitialProfile]);

  const handleProfileSelect = async (id) => {
    setIsLoading(true);
    try {
      await ProfileService.setActiveProfile(id);
      const profile = await ProfileService.getActiveProfile();
      setActiveProfile(profile);

      const manualList = profile.defaultBucket
        ? profile.defaultBucket.split(',').map(b => b.trim()).filter(b => b)
        : [];

      await loadBuckets(manualList);

      if (manualList.length > 0) {
        setSelectedBucket(manualList[0]);
      }
    } catch (error) {
      alert(`Error de conexión S3: ${error.message}`);
      setActiveProfile(null);
      ProfileService.setActiveProfile(null);
    } finally {
      setIsLoading(false);
    }
  };



  const handleLogout = () => {
    ProfileService.setActiveProfile(null);
    setActiveProfile(null);
    setBuckets([]);
    setSelectedBucket(null);
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Iniciando sesión segura...</p>
        </div>
      </div>
    );
  }

  // Si no hay perfil activo, mostramos la pantalla de bienvenida
  if (!activeProfile) {
    return <WelcomeScreen onProfileSelect={handleProfileSelect} />;
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
              activeProfile={activeProfile}
              onLogout={handleLogout}
              onProfileSelect={handleProfileSelect}
            />

            <main className="flex-1 p-6 overflow-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
                <Route path="/settings" element={
                  <Settings
                    activeProfile={activeProfile}
                    onProfileSelect={handleProfileSelect}
                    onProfilesChange={checkInitialProfile}
                    onProfileBucketsUpdate={(list) => {
                      const updated = list.map(name => ({
                        name,
                        creation_date: new Date().toISOString(),
                        isManual: true
                      }));
                      setBuckets(updated);
                      if (updated.length > 0 && !selectedBucket) {
                        setSelectedBucket(updated[0].name);
                      }
                    }}
                  />
                } />
              </Routes>
            </main>

            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center font-medium text-gray-700 dark:text-gray-300">
                    <TbBrandAws className="w-4 h-4 mr-1.5 text-orange-500" />
                    <span>{activeProfile.name} ({activeProfile.region})</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${connectionStatus === "connected" ? "bg-success-500" : "bg-danger-500"}`}></div>
                    <span>{connectionStatus === "connected" ? "Conectado" : "Error de red"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {stats.lastSync && (
                    <span>Sincronizado: {new Date(stats.lastSync).toLocaleTimeString()}</span>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-red-500 font-medium"
                  >
                    <FiLogOut className="w-3.5 h-3.5" /> Salir
                  </button>
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

