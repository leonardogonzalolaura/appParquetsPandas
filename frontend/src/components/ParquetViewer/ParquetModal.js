import React, { useState, useEffect } from "react";
import {
  FiX,
  FiDownload,
  FiDatabase,
  FiColumns,
  FiInfo,
  FiFileText,
  FiCode,
} from "react-icons/fi";
import { TbTable, TbFileDatabase, TbBrandAws } from "react-icons/tb";

import MetadataSection from "./MetadataSection";
import DataTable from "./DataTable";
import JsonView from "./JsonView";

const TAB_OVERVIEW = "overview";
const TAB_DATA = "data";

const ParquetModal = ({
  isOpen,
  onClose,
  file,
  metadata,
  data,
  loading,
  error,
  selectedColumns,
  setSelectedColumns,
  filters,
  setFilters,
  limit,
  setLimit,
  viewMode,
  setViewMode,
  loadFileData,
  formatDate,
  formatFileSize,
  handleDownload,
  handleColumnToggle,
  handleFilterChange,
  handleApplyFilters,
}) => {
  const [activeTab, setActiveTab] = useState(TAB_OVERVIEW);

  // Cerrar modal con Escape
  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === "Escape" && isOpen) onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  // Resetear tab al abrir un nuevo archivo
  useEffect(() => {
    if (isOpen) setActiveTab(TAB_OVERVIEW);
  }, [isOpen, file?.key]);

  if (!isOpen) return null;


  /* ── Contenido principal ───────────────────────────────────── */
  const renderBody = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-48">
          <div className="w-8 h-8 loading-spinner mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Leyendo archivo Parquet…</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Esto puede tardar unos segundos</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-center px-6">
          <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3">
            <FiDatabase className="w-5 h-5 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5">Error al cargar</h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">{error}</p>
          <button onClick={() => file && loadFileData(file)} className="btn btn-primary text-xs px-3 py-1.5">
            Reintentar
          </button>
        </div>
      );
    }

    if (activeTab === TAB_OVERVIEW) {
      return (
        <div className="p-4 space-y-4">
          <MetadataSection
            metadata={metadata}
            file={file}
            formatDate={formatDate}
            formatFileSize={formatFileSize}
          />
        </div>
      );
    }

    if (activeTab === TAB_DATA) {
      return (
        <div className="flex flex-col h-full text-black dark:text-white">
          {/* Subheader de datos */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
                {[
                  { key: "table", label: "Tabla", icon: TbTable },
                  { key: "json", label: "JSON", icon: FiColumns },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setViewMode(key)}
                    className={`flex items-center px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${viewMode === key
                      ? "bg-primary-500 text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5 mr-1.5" />
                    {label}
                  </button>
                ))}
              </div>
              {data?.row_count != null && (
                <span className="text-[11px] text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-md">
                  {data.row_count.toLocaleString()} filas &nbsp;·&nbsp; {data.columns?.length ?? 0} columnas
                </span>
              )}
            </div>
          </div>

          {/* Contenido de datos */}
          <div className="flex-1 overflow-auto">
            {viewMode === "table" && (
              <DataTable
                data={data}
                limit={limit}
                setLimit={setLimit}
                file={file}
                loadFileData={loadFileData}
                selectedColumns={selectedColumns}
                setSelectedColumns={setSelectedColumns}
                handleColumnToggle={handleColumnToggle}
                filters={filters}
                handleFilterChange={handleFilterChange}
                handleApplyFilters={handleApplyFilters}
              />
            )}
            {viewMode === "json" && <div className="p-4"><JsonView data={data} /></div>}
          </div>
        </div>
      );
    }


    return null;
  };

  /* ── Layout principal del modal ────────────────────────────── */
  const tabs = [
    { key: TAB_OVERVIEW, label: "Resumen", icon: FiInfo },
    { key: TAB_DATA, label: "Datos", icon: TbTable },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel del modal */}
      <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
        <div
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden"
          style={{ maxHeight: "92vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── HEADER ─────────────────────────────────────── */}
          <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center min-w-0">
              <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mr-2.5 flex-shrink-0">
                {file?.name.endsWith('.parquet') ? (
                  <TbFileDatabase className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                ) : file?.name.endsWith('.csv') ? (
                  <FiFileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ) : file?.name.endsWith('.json') ? (
                  <FiCode className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                ) : (
                  <FiFileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900 dark:text-white truncate leading-tight">
                  {file?.name ?? "Visualizador de Archivos"}
                </h2>
                {file && (
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <TbBrandAws className="w-3 h-3 text-orange-400 flex-shrink-0" />
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{file.bucket}</span>
                    {file.size && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600 text-[11px]">·</span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
              {/* Descargas */}
              {file && (
                <div className="flex items-center space-x-1">
                  {["csv", "json"].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => handleDownload(fmt)}
                      className="flex items-center px-2 py-1 text-[11px] font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 transition-colors"
                    >
                      <FiDownload className="w-3.5 h-3.5 mr-1" />
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                  {file.name.endsWith('.parquet') && (
                    <button
                      onClick={() => handleDownload("parquet")}
                      className="flex items-center px-2 py-1 text-[11px] font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
                    >
                      <FiDownload className="w-3.5 h-3.5 mr-1" />
                      Parquet
                    </button>
                  )}
                </div>
              )}
              {/* Cerrar */}
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-1"
                title="Cerrar"
              >
                <FiX className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* ── TABS ───────────────────────────────────────── */}
          <div className="flex items-center px-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center px-3 py-2 text-xs font-medium border-b-2 transition-colors mr-1 ${activeTab === key
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
              >
                <Icon className="w-4 h-4 mr-1.5" />
                {label}
              </button>
            ))}
          </div>

          {/* ── BODY ───────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            {renderBody()}
          </div>

          {/* ── FOOTER ─────────────────────────────────────── */}
          {file && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
              <div className="flex items-center space-x-3 text-[11px] text-gray-500 dark:text-gray-400">
                {metadata && (
                  <>
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5 inline-block" />
                      {metadata.row_count?.toLocaleString()} filas
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span>{metadata.columns?.length} columnas</span>
                    {Object.keys(filters).filter((k) => filters[k]).length > 0 && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span className="text-primary-600 dark:text-primary-400 font-medium">
                          {Object.keys(filters).filter((k) => filters[k]).length} filtro(s) activo(s)
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors px-2.5 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ParquetModal;
