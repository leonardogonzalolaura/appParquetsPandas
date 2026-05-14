import React from "react";
import {
  FiSearch,
  FiList,
  FiGrid,
  FiRefreshCw,
  FiCheckSquare,
  FiSquare,
  FiCalendar,
  FiHardDrive,
  FiEye,
  FiCopy,
  FiDownload,
  FiFileText,
  FiCode,
  FiFile,
} from "react-icons/fi";
import { TbFileDatabase } from "react-icons/tb";

const FileList = ({
  files,
  filteredFiles,
  searchFilter,
  setSearchFilter,
  explorerViewMode,
  setExplorerViewMode,
  handleRefresh,
  selectedFiles,
  toggleFileSelection,
  selectAllFiles,
  formatFileSize,
  formatDate,
  handleViewFile,
  selectedBucket,
  setFileToCopy,
  setShowCopyModal,
  handleDownload, // Optional pass if we implement individual download
}) => {
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center">
        <TbFileDatabase className="w-10 h-10 text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
        No hay archivos compatibles
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
        Esta carpeta no contiene archivos compatibles con la vista previa
      </p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
        Formatos soportados: .parquet, .csv, .json, .txt
      </p>
    </div>
  );

  const getFileIcon = (fileName, className = "w-4 h-4") => {
    if (fileName.endsWith(".parquet")) return <TbFileDatabase className={`${className} text-green-600 dark:text-green-400`} />;
    if (fileName.endsWith(".csv")) return <FiFileText className={`${className} text-blue-600 dark:text-blue-400`} />;
    if (fileName.endsWith(".json")) return <FiCode className={`${className} text-orange-600 dark:text-orange-400`} />;
    return <FiFile className={`${className} text-gray-600 dark:text-gray-400`} />;
  };

  const getFileBgClass = (fileName, isGrid = false) => {
    if (fileName.endsWith(".parquet")) return isGrid ? "bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20" : "bg-green-100 dark:bg-green-900/30";
    if (fileName.endsWith(".csv")) return isGrid ? "bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20" : "bg-blue-100 dark:bg-blue-900/30";
    if (fileName.endsWith(".json")) return isGrid ? "bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20" : "bg-orange-100 dark:bg-orange-900/30";
    return isGrid ? "bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700" : "bg-gray-100 dark:bg-gray-800";
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {filteredFiles.map((file, index) => (
        <div
          key={index}
          className={`group bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300 hover:shadow-lg cursor-pointer overflow-hidden ${selectedFiles.some((f) => f.key === file.key)
            ? "border-primary-500 shadow-md shadow-primary-500/20 bg-primary-50/50 dark:bg-primary-900/10"
            : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600"
            }`}
          onClick={() => toggleFileSelection(file)}
        >
          <div className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                <div className={`p-2 rounded-xl transition-all duration-200 group-hover:scale-110 flex-shrink-0 ${getFileBgClass(file.name, true)}`}>
                  {getFileIcon(file.name, "w-4 h-4")}
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-sm font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewFile(file);
                    }}
                    title={file.name}
                  >
                    {file.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 ml-2">
                {selectedFiles.some((f) => f.key === file.key) ? (
                  <FiCheckSquare className="w-4 h-4 text-primary-500" />
                ) : (
                  <FiSquare className="w-4 h-4 text-gray-400 group-hover:text-primary-400 transition-colors" />
                )}
              </div>
            </div>

            <div className="space-y-1.5 text-xs border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <FiCalendar className="w-3 h-3 mr-1.5 flex-shrink-0" />
                <span className="truncate text-[11px]">{formatDate(file.last_modified)}</span>
              </div>
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <FiHardDrive className="w-3 h-3 mr-1.5 flex-shrink-0" />
                <span className="text-[11px]">
                  {file.size_mb ? file.size_mb.toFixed(2) : (file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-3 pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewFile(file);
                }}
                className="flex-1 px-2 py-1.5 text-[11px] font-medium rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all duration-200 flex items-center justify-center"
              >
                <FiEye className="w-3 h-3 mr-1" />
                Ver
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFileToCopy({
                    name: file.name,
                    bucket: selectedBucket,
                    key: file.key,
                  });
                  setShowCopyModal(true);
                }}
                className="flex-1 px-2 py-1.5 text-[11px] font-medium rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all duration-200 flex items-center justify-center"
              >
                <FiCopy className="w-3 h-3 mr-1" />
                Copiar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-3 py-2.5 w-10">
                <button
                  onClick={selectAllFiles}
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {selectedFiles.length === filteredFiles.length && filteredFiles.length > 0 ? (
                    <FiCheckSquare className="w-4 h-4" />
                  ) : (
                    <FiSquare className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Tamaño
              </th>
              <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Modificación
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredFiles.map((file, index) => (
              <tr
                key={index}
                className={`group transition-all duration-200 cursor-pointer ${selectedFiles.some((f) => f.key === file.key)
                  ? "bg-primary-50/50 dark:bg-primary-900/10"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  }`}
                onClick={() => toggleFileSelection(file)}
              >
                <td className="px-3 py-2">
                  {selectedFiles.some((f) => f.key === file.key) ? (
                    <FiCheckSquare className="w-4 h-4 text-primary-500" />
                  ) : (
                    <FiSquare className="w-4 h-4 text-gray-400 group-hover:text-primary-400 transition-colors" />
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center min-w-0">
                    <div className={`p-1.5 rounded-lg mr-2.5 flex-shrink-0 ${getFileBgClass(file.name, false)}`}>
                      {getFileIcon(file.name, "w-3.5 h-3.5")}
                    </div>
                    <div
                      className="text-xs font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition-colors truncate max-w-[150px] sm:max-w-xs md:max-w-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewFile(file);
                      }}
                      title={file.name}
                    >
                      {file.name}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatFileSize(file.size)}
                </td>
                <td className="px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatDate(file.last_modified)}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end space-x-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewFile(file);
                      }}
                      className="p-1.5 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200"
                      title="Ver detalles"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileToCopy({
                          name: file.name,
                          bucket: selectedBucket,
                          key: file.key,
                        });
                        setShowCopyModal(true);
                      }}
                      className="p-1.5 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200"
                      title="Copiar archivo"
                    >
                      <FiCopy className="w-3.5 h-3.5" />
                    </button>
                    {handleDownload && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file);
                        }}
                        className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                        title="Descargar"
                      >
                        <FiDownload className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (!files || files.length === 0) {
    return renderEmptyState();
  }

  return (
    <div className="overflow-hidden">
      {/* Barra de búsqueda y acciones */}
      <div className="mb-2 mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
        <div className="relative flex-1 max-w-sm w-full">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Buscar archivos..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button
              onClick={() => setExplorerViewMode("list")}
              className={`px-2.5 py-1.5 transition-all duration-200 ${explorerViewMode === "list"
                ? "bg-primary-500 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              <FiList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setExplorerViewMode("grid")}
              className={`px-2.5 py-1.5 transition-all duration-200 ${explorerViewMode === "grid"
                ? "bg-primary-500 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              <FiGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            title="Refrescar"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Información de archivos */}
      <div className="mb-3 flex items-center justify-between text-[11px] px-1">
        <span className="text-gray-500 dark:text-gray-400">
          Mostrando {filteredFiles.length} de {files.length} archivos
        </span>
        {selectedFiles.length > 0 && (
          <span className="text-primary-600 dark:text-primary-400 font-medium">
            {selectedFiles.length} seleccionado(s)
          </span>
        )}
      </div>

      {explorerViewMode === "grid" ? renderGridView() : renderListView()}
    </div>
  );
};

export default FileList;
