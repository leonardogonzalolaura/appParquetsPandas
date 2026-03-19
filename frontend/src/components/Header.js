import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiBell,
  FiUser,
  FiRefreshCw,
  FiSettings,
  FiHelpCircle,
  FiX,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import { TbBrandAws } from "react-icons/tb";

const Header = ({ selectedBucket, onRefresh, connectionStatus, onNavigatePath }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    const path = searchQuery.trim();
    if (!path || !selectedBucket) return;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    if (onNavigatePath) onNavigatePath(cleanPath);
    navigate("/explorer");
    setSearchQuery("");
  };

  const statusColor =
    connectionStatus === "connected" ? "bg-green-400" :
      connectionStatus === "checking" ? "bg-yellow-400" : "bg-red-400";

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center gap-3">

        {/* Estado de conexión */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            {connectionStatus === "connected" ? "Conectado" :
              connectionStatus === "checking" ? "Verificando…" : "Error"}
          </span>
        </div>

        {/* Bucket activo */}
        {selectedBucket && (
          <div className="flex items-center bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 px-2.5 py-1.5 rounded-lg flex-shrink-0 max-w-[200px]">
            <TbBrandAws className="w-4 h-4 text-primary-500 dark:text-primary-400 mr-1.5 flex-shrink-0" />
            <span className="text-xs font-semibold text-primary-800 dark:text-primary-200 truncate">{selectedBucket}</span>
          </div>
        )}

        {/* Buscador — ocupa todo el espacio restante */}
        <form onSubmit={handleSearch} className="flex-1 min-w-0">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                selectedBucket
                  ? `Ir a ruta… ej: exports/test01/CO/2026/`
                  : "Selecciona un bucket primero"
              }
              disabled={!selectedBucket}
              className="w-full pl-9 pr-20 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-16 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              disabled={!selectedBucket || !searchQuery.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 rounded hover:bg-primary-50 transition-colors"
            >
              Ir →
            </button>
          </div>
        </form>

        {/* Acciones */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            title="Refrescar"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? <FiMoon className="w-4 h-4" /> : <FiSun className="w-4 h-4" />}
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400" title="Configuración">
            <FiSettings className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400" title="Ayuda">
            <FiHelpCircle className="w-4 h-4" />
          </button>

          {/* Usuario */}
          <div className="ml-1 w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
            <FiUser className="w-4 h-4 text-white" />
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
