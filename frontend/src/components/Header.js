import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiUser,
  FiRefreshCw,
  FiSettings,
  FiHelpCircle,
  FiX,
  FiSun,
  FiMoon,
  FiLogOut,
} from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import { TbBrandAws } from "react-icons/tb";

const Header = ({ selectedBucket, onRefresh, connectionStatus, onNavigatePath, activeProfile, onLogout }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 relative z-40">
      <div className="flex items-center gap-3">

        {/* Estado de conexión */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden sm:block font-bold">
            {connectionStatus === "connected" ? "Sincronizado" :
              connectionStatus === "checking" ? "Conectando…" : "Sin Red"}
          </span>
        </div>

        {/* Bucket activo */}
        {selectedBucket && (
          <div className="flex items-center bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50 px-2.5 py-1.5 rounded-lg flex-shrink-0 max-w-[180px]">
            <TbBrandAws className="w-4 h-4 text-primary-500 dark:text-primary-400 mr-1.5 flex-shrink-0" />
            <span className="text-[11px] font-bold text-primary-800 dark:text-primary-200 truncate">{selectedBucket}</span>
          </div>
        )}

        {/* Buscador */}
        <form onSubmit={handleSearch} className="flex-1 min-w-0">
          <div className="relative group">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 w-4 h-4 transition-colors" />
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
              className="w-full pl-9 pr-20 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-tighter text-primary-600 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
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
          
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Perfil / Usuario */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
            >
              <div className="hidden sm:block text-right">
                <p className="text-[11px] font-bold text-gray-900 dark:text-white leading-none mb-0.5">{activeProfile?.name}</p>
                <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-none uppercase tracking-tighter">{activeProfile?.region}</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
                <FiUser className="w-4 h-4 text-white" />
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sesión activa</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{activeProfile?.name}</p>
                </div>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <FiSettings className="w-4 h-4" /> Configuración
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <FiHelpCircle className="w-4 h-4" /> Ayuda
                </button>
                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                >
                  <FiLogOut className="w-4 h-4" /> Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;

