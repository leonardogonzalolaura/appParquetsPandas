import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiFolder,
  FiSettings,
  FiDatabase,
  FiChevronRight,
  FiChevronLeft,
  FiUsers,
  FiMenu,
} from "react-icons/fi";
import { TbBrandAws, TbFileDatabase } from "react-icons/tb";

const Sidebar = ({ buckets, selectedBucket, onBucketSelect, stats, collapsed, onToggleCollapse }) => {
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: FiHome },
    { name: "Explorador", href: "/explorer", icon: FiFolder },
    { name: "Configuración", href: "/settings", icon: FiSettings },
  ];


  return (
    <div
      className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden transition-all duration-300 ${collapsed ? "w-16" : "w-64"
        }`}
    >
      {/* Logo + toggle */}
      <div className={`p-4 border-b border-gray-200 dark:border-gray-700 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <TbFileDatabase className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate">S3 Parquet Explorer</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AWS S3 Data Browser</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <TbFileDatabase className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors flex-shrink-0 ${collapsed ? "mt-0" : ""}`}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navegación principal */}
      <nav className="p-2 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            title={collapsed ? item.name : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-lg transition-colors duration-200 ${collapsed ? "justify-center px-2 py-3" : "px-3 py-2.5"
              } ${isActive
                ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-l-4 border-primary-600 dark:border-primary-500"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`
            }
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 ${!collapsed && "mr-3"}`} />
            {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Buckets favoritos — justo debajo de la nav */}
      {!collapsed && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center">
              <FiDatabase className="w-3.5 h-3.5 mr-1.5" />
              Buckets
            </h3>
            <span className="text-xs bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 px-1.5 py-0.5 rounded-full">
              {buckets.length}
            </span>
          </div>
          <div className="space-y-1 overflow-y-auto">
            {buckets.map((bucket) => {
              const name = typeof bucket === "string" ? bucket : bucket.name;
              return (
                <button
                  key={name}
                  onClick={() => onBucketSelect(name)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors duration-200 ${
                    selectedBucket === name
                      ? "bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 border border-primary-200 dark:border-primary-800"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center min-w-0">
                    <TbBrandAws className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{name}</span>
                  </div>
                  <FiChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Spacer: empuja las estadísticas al fondo */}
      <div className="flex-1" />

      {/* Iconos bucket colapsado */}
      {collapsed && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
          {buckets.map((bucket) => {
            const name = typeof bucket === "string" ? bucket : bucket.name;
            return (
              <button
                key={name}
                onClick={() => onBucketSelect(name)}
                title={name}
                className={`w-full flex items-center justify-center p-2 rounded-lg transition-colors duration-200 ${
                  selectedBucket === name
                    ? "bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <TbBrandAws className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      )}

      {/* Estadísticas (solo expandido) */}
      {!collapsed && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="space-y-2">
            {[
              ["Buckets", stats.totalBuckets],
              ["Archivos", stats.totalFiles.toLocaleString()],
              ["Tamaño", stats.totalSizeGB > 0 ? `${stats.totalSizeGB.toFixed(1)} GB` : "N/A"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center text-xs text-gray-400">
            <FiUsers className="w-3 h-3 mr-1.5" />
            <span className="truncate">AWS IAM User</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
