import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiDatabase,
  FiFolder,
  FiArrowRight,
  FiTrendingUp,
  FiClock,
  FiHardDrive,
  FiInbox,
} from "react-icons/fi";
import {
  TbBrandAws,
  TbFileDatabase,
  TbCloudDataConnection,
} from "react-icons/tb";

const Dashboard = ({ buckets = [], stats = {}, onBucketSelect }) => {
  const navigate = useNavigate();

  const handleBucketClick = (bucketName) => {
    if (onBucketSelect) {
      onBucketSelect(bucketName);
      navigate("/explorer");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header compacto */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Resumen de tus buckets S3 y archivos Parquet
        </p>
      </div>

      {/* Stats Grid compacto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Total Buckets */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center space-x-4">
          <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex-shrink-0">
            <FiDatabase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              {stats.totalBuckets || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Buckets configurados</p>
            <p className="text-xs text-gray-400 flex items-center mt-0.5">
              <TbBrandAws className="w-3 h-3 mr-1" />
              Leídos desde .env
            </p>
          </div>
        </div>

        {/* Última sincronización */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center space-x-4">
          <div className="p-2 bg-success-50 dark:bg-success-900/30 rounded-lg flex-shrink-0">
            <FiClock className="w-5 h-5 text-success-600 dark:text-success-400" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              {stats.lastSync
                ? new Date(stats.lastSync).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                : "—"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Última sincronización</p>
            <p className="text-xs text-gray-400 flex items-center mt-0.5">
              <FiTrendingUp className="w-3 h-3 mr-1" />
              Datos en tiempo real
            </p>
          </div>
        </div>

        {/* Estado del backend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center space-x-4">
          <div className="p-2 bg-warning-50 dark:bg-warning-900/30 rounded-lg flex-shrink-0">
            <TbCloudDataConnection className="w-5 h-5 text-warning-600 dark:text-warning-400" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              Activo
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Estado del backend</p>
            <p className="text-xs text-gray-400 flex items-center mt-0.5">
              <FiHardDrive className="w-3 h-3 mr-1" />
              localhost:8080
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Buckets */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Buckets S3</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Variable{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">
                S3_PREDEFINED_BUCKETS
              </code>{" "}
              en <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">backend/.env</code>
            </p>
          </div>
          <button
            onClick={() => navigate("/explorer")}
            className="btn btn-outline flex items-center text-sm py-1.5 px-3"
          >
            Explorar
            <FiArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>

        {buckets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
            <FiInbox className="w-8 h-8 mb-2" />
            <p className="text-sm font-medium">No hay buckets configurados</p>
            <p className="text-xs mt-1 text-center">
              Agrega buckets en{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">backend/.env</code>
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {buckets.map((bucket) => {
              const bucketName =
                typeof bucket === "string" ? bucket : bucket.name;
              return (
                <div
                  key={bucketName}
                  className="flex items-center justify-between px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 cursor-pointer"
                  onClick={() => handleBucketClick(bucketName)}
                >
                  <div className="flex items-center min-w-0">
                    <div className="p-1.5 bg-primary-100 dark:bg-primary-900/40 rounded-md mr-3 flex-shrink-0">
                      <TbBrandAws className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {bucketName}
                    </span>
                  </div>
                  <FiArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/explorer")}
            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 text-left flex items-center"
          >
            <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg mr-3 flex-shrink-0">
              <FiFolder className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Explorar Buckets</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Navega por S3</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/settings")}
            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 text-left flex items-center"
          >
            <div className="p-2 bg-success-100 dark:bg-success-900/50 rounded-lg mr-3 flex-shrink-0">
              <TbFileDatabase className="w-4 h-4 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Configuración</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Credenciales y ajustes</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
