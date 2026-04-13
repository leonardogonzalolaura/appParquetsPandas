import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiFolder,
  FiFile,
  FiSearch,
  FiDownload,
  FiChevronRight,
  FiChevronDown,
  FiRefreshCw,
  FiHardDrive,
  FiCalendar,
  FiEye,
  FiArrowLeft,
  FiHome,
  FiCopy,
  FiX,
  FiFileText,
  FiCode,
} from "react-icons/fi";
import { TbBrandAws, TbFileDatabase, TbFolderFilled } from "react-icons/tb";
import { ParquetModal } from "../components/ParquetViewer";
import CopyModal from "../components/CopyModal";

const BucketExplorer = ({ selectedBucket, onBucketSelect, navigatePath, onNavigatePathDone }) => {
  const navigate = useNavigate();
  const [buckets, setBuckets] = useState([]);
  const [explorationData, setExplorationData] = useState({
    bucket: "",
    current_path: "/",
    folders: [],
    files: [],
    parent_path: null,
  });
  const [loading, setLoading] = useState(true);
  const [showParquetModal, setShowParquetModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileMetadata, setFileMetadata] = useState(null);
  const [fileData, setFileData] = useState({});
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [filters, setFilters] = useState({});
  const [limit, setLimit] = useState(50);
  const [viewMode, setViewMode] = useState("table");
  const [explorerViewMode, setExplorerViewMode] = useState("list");
  const [expandedBuckets, setExpandedBuckets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [fileToCopy, setFileToCopy] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    loadBuckets();
  }, []);

  useEffect(() => {
    if (selectedBucket) {
      explorePath(selectedBucket, "");
    }
  }, [selectedBucket]);

  // Navegar al path recibido desde el buscador del Header
  useEffect(() => {
    if (navigatePath && selectedBucket) {
      explorePath(selectedBucket, navigatePath);
      if (onNavigatePathDone) onNavigatePathDone();
    }
  }, [navigatePath]);

  const loadBuckets = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/buckets");
      setBuckets(response.data);
      // Expandir todos los buckets que devuelva el backend (sin hardcodear nombres)
      setExpandedBuckets(response.data.map((b) => b.name));
    } catch (error) {
      console.error("Error loading buckets:", error);
    } finally {
      setLoading(false);
    }
  };

  const explorePath = async (bucket, path = "") => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/buckets/${bucket}/explore`, {
        params: { path },
      });
      setExplorationData(response.data);
    } catch (error) {
      console.error("Error exploring path:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folderPath) => {
    if (selectedBucket) {
      explorePath(selectedBucket, folderPath);
    }
  };

  const handleBackClick = () => {
    if (explorationData.parent_path !== null && selectedBucket) {
      explorePath(selectedBucket, explorationData.parent_path);
    }
  };

  const handleHomeClick = () => {
    if (selectedBucket) {
      explorePath(selectedBucket, "");
    }
  };

  const toggleBucket = (bucketName) => {
    setExpandedBuckets((prev) =>
      prev.includes(bucketName)
        ? prev.filter((name) => name !== bucketName)
        : [...prev, bucketName],
    );
  };

  const refreshExploration = () => {
    if (selectedBucket) {
      explorePath(selectedBucket, explorationData.current_path);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isDarkMode = document.documentElement.classList.contains('dark');

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRefresh = () => {
    if (selectedBucket) {
      explorePath(selectedBucket, explorationData.current_path);
      setSelectedFiles([]); // Limpiar selección al refrescar
    }
  };

  const toggleFileSelection = (file) => {
    setSelectedFiles((prev) => {
      const isSelected = prev.some((f) => f.key === file.key);
      if (isSelected) {
        return prev.filter((f) => f.key !== file.key);
      } else {
        return [...prev, { ...file, bucket: selectedBucket }];
      }
    });
  };

  const selectAllFiles = () => {
    if (selectedFiles.length === explorationData.files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(explorationData.files.map(f => ({ ...f, bucket: selectedBucket })));
    }
  };

  const handleDownload = async (format = "csv") => {
    if (!selectedFile) return;

    try {
      const response = await axios.get("/api/download", {
        params: {
          bucket: selectedFile.bucket,
          key: selectedFile.key,
          format: format,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const extension = selectedFile.key.split('.').pop();
      link.setAttribute(
        "download",
        `${selectedFile.name.replace(`.${extension}`, "")}.${format}`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Error al descargar el archivo");
    }
  };

  const handleColumnToggle = (column) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column],
    );
  };

  const handleFilterChange = (column, value) => {
    setFilters((prev) => ({
      ...prev,
      [column]: value || undefined,
    }));
  };

  const handleApplyFilters = async () => {
    if (!selectedFile) return;

    setFileLoading(true);
    try {
      const dataResponse = await axios.post("/api/file/data", {
        bucket: selectedFile.bucket,
        key: selectedFile.key,
        limit: limit,
        columns: selectedColumns.length > 0 ? selectedColumns : undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });
      setFileData(dataResponse.data);
    } catch (err) {
      console.error("Error applying filters:", err);
      setFileError(err.response?.data?.detail || "Error al aplicar filtros");
    } finally {
      setFileLoading(false);
    }
  };

  const loadFileData = async () => {
    if (!selectedFile) return;

    setFileLoading(true);
    try {
      const dataResponse = await axios.post("/api/file/data", {
        bucket: selectedFile.bucket,
        key: selectedFile.key,
        limit: limit,
        columns: selectedColumns.length > 0 ? selectedColumns : undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });
      setFileData(dataResponse.data);
    } catch (err) {
      console.error("Error loading file data:", err);
      setFileError(err.response?.data?.detail || "Error al cargar datos");
    } finally {
      setFileLoading(false);
    }
  };

  const handleViewFile = async (file) => {
    setSelectedFile({
      name: file.name,
      bucket: selectedBucket,
      key: file.key,
      size: file.size,
      modified: file.last_modified,
    });

    setShowParquetModal(true);

    setFileLoading(true);
    setFileError(null);

    try {
      // Cargar metadata
      const metadataResponse = await axios.get("/api/file/metadata", {
        params: {
          bucket: selectedBucket,
          key: file.key,
        },
      });
      setFileMetadata(metadataResponse.data);

      // Cargar datos iniciales
      const dataResponse = await axios.post("/api/file/data", {
        bucket: selectedBucket,
        key: file.key,
        limit: limit,
      });
      setFileData(dataResponse.data);

      // Configurar columnas seleccionadas (primeras 7 por defecto)
      if (dataResponse.data.columns) {
        const initialColumns = dataResponse.data.columns.slice(0, 7);
        setSelectedColumns(initialColumns);
      }
    } catch (err) {
      console.error("Error loading file:", err);
      setFileError(
        err.response?.data?.detail || "Error al cargar el archivo",
      );
    } finally {
      setFileLoading(false);
    }
  };

  const renderBreadcrumbs = () => {
    const pathParts = explorationData.current_path.split("/").filter(Boolean);

    return (
      <div className="flex items-center space-x-2 mb-4">
        <button
          onClick={handleHomeClick}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
          title="Ir a la raíz"
        >
          <FiHome className="w-4 h-4" />
        </button>

        {explorationData.parent_path !== null && (
          <button
            onClick={handleBackClick}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
            title="Atrás"
          >
            <FiArrowLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center space-x-1">
          <button
            onClick={handleHomeClick}
            className="px-3 py-1 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {selectedBucket}
          </button>

          {pathParts.map((part, index) => (
            <React.Fragment key={index}>
              <FiChevronRight className="w-4 h-4 text-gray-400" />
              <button
                onClick={() => {
                  const path = pathParts.slice(0, index + 1).join("/") + "/";
                  explorePath(selectedBucket, path);
                }}
                className={`px-3 py-1 rounded-lg transition-colors ${index === pathParts.length - 1
                  ? "bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderFolders = () => {
    if (explorationData.folders.length === 0) return null;

    return (
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Carpetas</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {explorationData.folders.map((folder, index) => (
            <div
              key={index}
              onClick={() => handleFolderClick(folder.path)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-sm transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md mr-2 flex-shrink-0">
                  <TbFolderFilled className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {folder.name}
                  </h4>
                </div>
                <FiChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFiles = () => {
    if (explorationData.files.length === 0) {
      return (
        <div className="text-center py-12">
          <TbFileDatabase className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay archivos compatibles
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Esta carpeta no contiene archivos compatibles (.parquet, .csv, .json, .txt)
          </p>
        </div>
      );
    }

    if (explorerViewMode === "grid") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {explorationData.files.map((file, index) => (
            <div
              key={index}
              onClick={() => toggleFileSelection(file)}
              className={`bg-white dark:bg-gray-800 border rounded-lg p-4 hover:shadow-card-hover transition-all duration-200 cursor-pointer relative ${selectedFiles.some(f => f.key === file.key) ? 'border-primary-500 ring-1 ring-primary-500 dark:border-primary-400 dark:ring-primary-400' : 'border-gray-200 dark:border-gray-700'
                }`}
            >
              <div className="absolute top-3 right-3 z-10">
                <input
                  type="checkbox"
                  checked={selectedFiles.some(f => f.key === file.key)}
                  onChange={() => { }} // Manejado por el div parent
                  className="rounded text-primary-600 dark:text-primary-500 focus:ring-primary-500 h-4 w-4 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
              <div className="flex items-start mb-3">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg mr-3">
                  {file.name.endsWith('.parquet') ? (
                    <TbFileDatabase className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : file.name.endsWith('.csv') ? (
                    <FiFileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  ) : file.name.endsWith('.json') ? (
                    <FiCode className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  ) : (
                    <FiFileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 
                    className="font-medium text-gray-900 dark:text-white truncate hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleViewFile(file);
                    }}
                    title="Ver detalles"
                  >
                    {file.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiCalendar className="w-4 h-4 mr-2" />
                  <span>{formatDate(file.last_modified)}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiHardDrive className="w-4 h-4 mr-2" />
                  <span>{file.size_mb.toFixed(2)} MB</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleViewFile(file);
                  }}
                  className="w-full btn btn-outline btn-sm flex items-center justify-center"
                >
                  <FiEye className="w-4 h-4 mr-2" />
                  Ver detalles
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFileToCopy({
                      name: file.name,
                      bucket: selectedBucket,
                      key: file.key,
                    });
                    setShowCopyModal(true);
                  }}
                  className="w-full mt-2 btn btn-outline btn-sm flex items-center justify-center border-orange-200 dark:border-orange-900/50 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                >
                  <FiCopy className="w-4 h-4 mr-2" />
                  Copiar
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={explorationData.files.length > 0 && selectedFiles.length === explorationData.files.length}
                  onChange={selectAllFiles}
                  className="rounded text-primary-600 dark:text-primary-500 focus:ring-primary-500 h-4 w-4 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tamaño
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Última modificación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {explorationData.files.map((file, index) => (
              <tr
                key={index}
                className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${selectedFiles.some(f => f.key === file.key) ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                  }`}
                onClick={() => toggleFileSelection(file)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedFiles.some(f => f.key === file.key)}
                    onChange={() => { }} // Manejado por tr onClick
                    className="rounded text-primary-600 dark:text-primary-500 focus:ring-primary-500 h-4 w-4 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`p-1.5 rounded mr-3 ${
                      file.name.endsWith('.parquet') ? 'bg-green-100 dark:bg-green-900/30' :
                      file.name.endsWith('.csv') ? 'bg-blue-100 dark:bg-blue-900/30' :
                      file.name.endsWith('.json') ? 'bg-orange-100 dark:bg-orange-900/30' :
                      'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {file.name.endsWith('.parquet') ? (
                        <TbFileDatabase className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : file.name.endsWith('.csv') ? (
                        <FiFileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      ) : file.name.endsWith('.json') ? (
                        <FiCode className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <FiFileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                    <div 
                      className="text-sm font-medium text-gray-900 dark:text-white truncate max-xs hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleViewFile(file);
                      }}
                      title="Ver detalles"
                    >
                      {file.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(file.last_modified)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleViewFile(file);
                    }}
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-3 transition-colors"
                  >
                    <FiEye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setFileToCopy({
                        name: file.name,
                        bucket: selectedBucket,
                        key: file.key,
                      });
                      setShowCopyModal(true);
                    }}
                    className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 mr-3 transition-colors"
                    title="Copiar archivo"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => console.log("Descargar:", file.key)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderBucketList = () => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Buckets S3</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Selecciona un bucket para explorar</p>
        </div>
        <button
          onClick={loadBuckets}
          className="btn btn-outline flex items-center"
        >
          <FiRefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </button>
      </div>

      <div className="space-y-2">
        {buckets.map((bucket, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <button
              onClick={() => toggleBucket(bucket.name)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex items-center">
                <TbBrandAws className="w-4 h-4 text-orange-500 mr-2.5" />
                <div className="text-left">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{bucket.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Creado:{" "}
                    {new Date(bucket.creation_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {expandedBuckets.includes(bucket.name) ? (
                <FiChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <FiChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {expandedBuckets.includes(bucket.name) && (
              <div className="p-4 pt-0">
                <button
                  onClick={() => onBucketSelect(bucket.name)}
                  className="w-full btn btn-outline flex items-center justify-center"
                >
                  <FiFolder className="w-4 h-4 mr-2" />
                  Explorar bucket
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (!selectedBucket) {
    return renderBucketList();
  }

  return (
    <>
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {selectedBucket}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Explorador de archivos</p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExplorerViewMode("grid")}
                  className={`px-4 py-2 transition-colors ${explorerViewMode === "grid"
                    ? "bg-primary-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setExplorerViewMode("list")}
                  className={`px-4 py-2 transition-colors ${explorerViewMode === "list"
                    ? "bg-primary-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                >
                  Lista
                </button>
              </div>

              <button
                onClick={handleRefresh}
                className="btn btn-outline flex items-center"
              >
                <FiRefreshCw className="w-4 h-4 mr-2" />
                Refrescar
              </button>
            </div>
          </div>

          {renderBreadcrumbs()}

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="w-8 h-8 loading-spinner mx-auto mb-2"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
              </div>
            </div>
          ) : (
            <>
              {renderFolders()}
              {renderFiles()}
            </>
          )}
        </div>

        {/* Barra de acciones flotante */}
        {selectedFiles.length > 0 && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
            <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-6 border border-gray-700">
              <div className="flex items-center space-x-2 border-r border-gray-700 pr-6">
                <span className="bg-primary-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  {selectedFiles.length}
                </span>
                <span className="text-sm font-medium">seleccionados</span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowCopyModal(true)}
                  className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-semibold"
                >
                  <FiCopy className="w-4 h-4" />
                  <span>Copiar Masivo</span>
                </button>

                <button
                  onClick={() => setSelectedFiles([])}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                  title="Desactivar selección"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para visualización de archivos Parquet */}
      <ParquetModal
        isOpen={showParquetModal}
        onClose={() => setShowParquetModal(false)}
        file={selectedFile}
        metadata={fileMetadata}
        data={fileData}
        loading={fileLoading}
        error={fileError}
        selectedColumns={selectedColumns}
        setSelectedColumns={setSelectedColumns}
        filters={filters}
        setFilters={setFilters}
        limit={limit}
        setLimit={setLimit}
        viewMode={viewMode}
        setViewMode={setViewMode}
        loadFileData={loadFileData}
        formatDate={formatDate}
        formatFileSize={formatFileSize}
        handleDownload={handleDownload}
        handleColumnToggle={handleColumnToggle}
        handleFilterChange={handleFilterChange}
        handleApplyFilters={handleApplyFilters}
      />

      {/* Modal para copiar archivos */}
      <CopyModal
        isOpen={showCopyModal}
        onClose={() => {
          setShowCopyModal(false);
          setFileToCopy(null);
        }}
        file={fileToCopy}
        files={selectedFiles}
        buckets={buckets}
        onCopySuccess={() => {
          handleRefresh();
          setSelectedFiles([]);
        }}
      />
    </>
  );
};

export default BucketExplorer;
