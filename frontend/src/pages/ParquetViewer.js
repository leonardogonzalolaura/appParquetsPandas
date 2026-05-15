import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import {
  FiFile,
  FiDownload,
  FiFilter,
  FiSearch,
  FiEye,
  FiBarChart2,
  FiColumns,
  FiHash,
  FiCalendar,
  FiDatabase,
  FiRefreshCw,
  FiChevronRight,
  FiChevronDown,
  FiCopy,
  FiExternalLink,
  FiChevronLeft,
  FiList,
  FiFileText,
} from "react-icons/fi";
import {
  TbBrandAws,
  TbFileDatabase,
  TbChartBar,
  TbTable,
} from "react-icons/tb";

// Componentes separados
import {
  FileHeader,
  MetadataSection,
  ControlsSection,
  DataTable,
  JsonView,
  ParquetModal,
} from "../components/ParquetViewer";

const ParquetViewer = ({ selectedBucket }) => {
  const location = useLocation();
  const [file, setFile] = useState(null);
  const [availableFiles, setAvailableFiles] = useState([]);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [showParquetModal, setShowParquetModal] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [filters, setFilters] = useState({});
  const [limit, setLimit] = useState(50);
  const [viewMode, setViewMode] = useState("table");
  const [expandedSections, setExpandedSections] = useState([
    "metadata",
    "preview",
  ]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    console.log(
      "useEffect inicial - location.state:",
      location.state,
      "selectedBucket:",
      selectedBucket,
    );
    // Check if file data was passed via navigation
    if (location.state?.file) {
      console.log("Archivo recibido por navigation:", location.state.file);
      const fileData = location.state.file;
      setFile({
        name: fileData.name,
        bucket: fileData.bucket || selectedBucket,
        key: fileData.key || fileData.name,
        size: fileData.size,
        modified: fileData.last_modified || fileData.modified,
      });
      loadFileData({
        bucket: fileData.bucket || selectedBucket,
        key: fileData.key || fileData.name,
      });
      // Load available files for navigation
      loadAvailableFiles(fileData.bucket || selectedBucket);
    } else if (selectedBucket) {
      console.log("Cargando archivo por defecto para bucket:", selectedBucket);
      // Load default file or show file selector
      loadDefaultFile();
      loadAvailableFiles(selectedBucket);
    } else {
      console.log("No hay bucket seleccionado");
    }
  }, [location.state, selectedBucket]);

  // Cargar datos cuando se selecciona un archivo
  useEffect(() => {
    if (file) {
      loadFileData(file);
    }
  }, [file]);

  // Actualizar columnas seleccionadas cuando cambia metadata
  useEffect(() => {
    if (metadata && metadata.columns) {
      setSelectedColumns(metadata.columns);
    }
  }, [metadata]);

  const loadAvailableFiles = async (bucket = selectedBucket) => {
    try {
      console.log("Cargando archivos disponibles para bucket:", bucket);
      const response = await axios.get(`/buckets/${bucket}/explore`, {
        params: { path: "" },
      });
      console.log("Respuesta de archivos disponibles:", response.data);
      setAvailableFiles(response.data.files || []);
    } catch (err) {
      console.error("Error al cargar archivos:", err);
      console.error("Detalles del error:", err.response?.data || err.message);
    }
  };

  const loadDefaultFile = async () => {
    try {
      console.log("Cargando archivo por defecto para bucket:", selectedBucket);
      // Load first parquet file from bucket using new explore endpoint
      const response = await axios.get(
        `/buckets/${selectedBucket}/explore`,
      );
      console.log("Respuesta de archivo por defecto:", response.data);

      if (response.data.files && response.data.files.length > 0) {
        const firstFile = response.data.files[0];
        console.log("Primer archivo encontrado:", firstFile);
        setFile({
          name: firstFile.name,
          bucket: selectedBucket,
          key: firstFile.key,
          size: firstFile.size,
          modified: firstFile.last_modified || firstFile.modified,
        });
        loadFileData({
          bucket: selectedBucket,
          key: firstFile.key,
        });
      } else {
        console.log("No se encontraron archivos en el bucket");
        setError("No se encontraron archivos Parquet en este bucket");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error al cargar archivo por defecto:", err);
      console.error("Detalles del error:", err.response?.data || err.message);
      setError("Error al cargar archivos del bucket");
      setLoading(false);
    }
  };

  const handleFileSelect = (selectedFile) => {
    setFile({
      name: selectedFile.name,
      bucket: selectedBucket,
      key: selectedFile.key,
      size: selectedFile.size,
      modified: selectedFile.last_modified || selectedFile.modified,
    });
    loadFileData({
      bucket: selectedBucket,
      key: selectedFile.key,
    });
    setShowFileSelector(false);
  };

  const handleNextFile = () => {
    if (!file || availableFiles.length === 0) return;
    const currentIndex = availableFiles.findIndex((f) => f.key === file.key);
    const nextIndex = (currentIndex + 1) % availableFiles.length;
    handleFileSelect(availableFiles[nextIndex]);
  };

  const handlePrevFile = () => {
    if (!file || availableFiles.length === 0) return;
    const currentIndex = availableFiles.findIndex((f) => f.key === file.key);
    const prevIndex =
      (currentIndex - 1 + availableFiles.length) % availableFiles.length;
    handleFileSelect(availableFiles[prevIndex]);
  };

  const loadFileData = async (fileInfo) => {
    setLoading(true);
    setError(null);

    try {
      // Ensure we have the correct bucket and key
      const bucket = fileInfo.bucket || selectedBucket;
      const key = fileInfo.key || fileInfo.name;

      if (!bucket || !key) {
        throw new Error("Bucket o clave del archivo no especificados");
      }

      console.log("Cargando archivo Parquet:", { bucket, key });

      // Load metadata
      console.log("Solicitando metadata...");
      const metadataResponse = await axios.get("/file/metadata", {
        params: {
          bucket: bucket,
          key: key,
        },
      });
      console.log("Metadata recibida:", metadataResponse.data);
      setMetadata(metadataResponse.data);

      // Load data with default limit
      console.log("Solicitando datos...");
      const dataResponse = await axios.post("/file/data", {
        bucket: bucket,
        key: key,
        limit: limit,
        columns: selectedColumns.length > 0 ? selectedColumns : undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });
      console.log("Datos recibidos:", dataResponse.data);
      setData(dataResponse.data);

      // Initialize selected columns with all columns
      if (selectedColumns.length === 0 && metadataResponse.data.columns) {
        console.log(
          "Inicializando columnas seleccionadas:",
          metadataResponse.data.columns,
        );
        setSelectedColumns(metadataResponse.data.columns);
      }
    } catch (err) {
      console.error("Error loading parquet file:", err);
      console.error("Detalles del error:", err.response?.data || err.message);
      console.error("Status del error:", err.response?.status);
      console.error("URL de la solicitud:", err.config?.url);
      setError(
        err.response?.data?.detail || "Error al cargar el archivo Parquet",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
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

  const handleApplyFilters = () => {
    if (file) {
      loadFileData(file);
    }
  };

  const handleDownload = async (format) => {
    try {
      const response = await axios.get("/download", {
        params: {
          bucket: file.bucket,
          key: file.key,
          format: format,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const extension = file.key.split('.').pop();
      link.setAttribute(
        "download",
        `${file.name.replace(`.${extension}`, "")}.${format}`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Error al descargar el archivo");
    }
  };

  const renderChartView = () => {
    if (!data.data || data.data.length === 0) {
      return (
        <div className="text-center py-12">
          <TbChartBar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay datos para gráficos
          </h3>
          <p className="text-gray-500">
            Selecciona un archivo con columnas numéricas para visualizar
          </p>
        </div>
      );
    }

    // Identificar columnas numéricas
    const numericColumns = data.columns?.filter((column) => {
      const sampleValue = data.data[0]?.[column];
      return typeof sampleValue === "number" && !isNaN(sampleValue);
    });

    if (!numericColumns || numericColumns.length === 0) {
      return (
        <div className="text-center py-12">
          <TbChartBar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay columnas numéricas
          </h3>
          <p className="text-gray-500">
            El archivo no contiene columnas numéricas para generar gráficos
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {numericColumns.slice(0, 6).map((column) => {
            const values = data.data
              .map((row) => row[column])
              .filter((v) => v !== null);
            const maxValue = Math.max(...values);
            const minValue = Math.min(...values);
            const avgValue = values.reduce((a, b) => a + b, 0) / values.length;

            return (
              <div
                key={column}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {column}
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Distribución</span>
                      <span>{values.length} valores</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {minValue.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">Mínimo</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {avgValue.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">Promedio</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {maxValue.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">Máximo</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Estadísticas de Columnas Numéricas
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Columna
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mínimo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Máximo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Promedio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valores
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {numericColumns.map((column, index) => {
                  const values = data.data
                    .map((row) => row[column])
                    .filter((v) => v !== null);
                  const maxValue = Math.max(...values);
                  const minValue = Math.min(...values);
                  const avgValue =
                    values.reduce((a, b) => a + b, 0) / values.length;

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {column}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {minValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {maxValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {avgValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {values.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderFileSelector = () => {
    if (!showFileSelector || !selectedBucket) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Seleccionar archivo Parquet
              </h2>
              <button
                onClick={() => setShowFileSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Bucket: <span className="font-medium dark:text-gray-200">{selectedBucket}</span>
            </p>
          </div>

          <div className="overflow-y-auto max-h-[60vh]">
            <div className="p-6">
              {availableFiles.length === 0 ? (
                <div className="text-center py-12">
                  <TbFileDatabase className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No hay archivos Parquet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    No se encontraron archivos .parquet en este bucket
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableFiles.map((availableFile) => (
                    <button
                      key={availableFile.key}
                      onClick={() => handleFileSelect(availableFile)}
                      className={`text-left p-4 rounded-lg border transition-all ${file?.key === availableFile.key
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                        }`}
                    >
                      <div className="flex items-start">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg mr-3">
                          <TbFileDatabase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {availableFile.name}
                          </h4>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                            <span className="mr-3">
                              {formatFileSize(availableFile.size)}
                            </span>
                            <span>
                              {formatDate(
                                availableFile.last_modified ||
                                availableFile.modified,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex justify-end">
              <button
                onClick={() => setShowFileSelector(false)}
                className="btn btn-outline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFileNavigation = () => {
    if (!file || availableFiles.length <= 1) return null;

    const currentIndex = availableFiles.findIndex((f) => f.key === file.key);
    const totalFiles = availableFiles.length;

    return (
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <button
            onClick={handlePrevFile}
            className="btn btn-outline flex items-center"
            disabled={currentIndex === 0}
          >
            <FiChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </button>
        </div>

        <div className="text-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Archivo {currentIndex + 1} de {totalFiles}
          </span>
        </div>

        <div className="flex items-center">
          <button
            onClick={handleNextFile}
            className="btn btn-outline flex items-center"
            disabled={currentIndex === totalFiles - 1}
          >
            <FiChevronRight className="w-4 h-4 ml-2" />
            Siguiente
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 loading-spinner mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Cargando archivo...
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Leyendo metadata y datos del archivo
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TbFileDatabase className="w-8 h-8 text-danger-600 dark:text-danger-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error al cargar el archivo
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => file && loadFileData(file)}
            className="btn btn-primary"
          >
            <FiRefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </button>
        </div>
      );
    }

    if (!file) {
      return (
        <div className="text-center py-12">
          <TbFileDatabase className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Selecciona un archivo Parquet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Navega a un bucket desde el Explorador y selecciona un archivo
            compatible para visualizarlo
          </p>
          {selectedBucket && (
            <div className="mt-6 space-y-3">
              <button
                onClick={loadDefaultFile}
                className="btn btn-primary flex items-center mx-auto"
              >
                <FiRefreshCw className="w-4 h-4 mr-2" />
                Cargar primer archivo disponible
              </button>
              {availableFiles.length > 0 && (
                <button
                  onClick={() => setShowFileSelector(true)}
                  className="btn btn-outline flex items-center mx-auto"
                >
                  <FiList className="w-4 h-4 mr-2" />
                  Ver lista de archivos ({availableFiles.length})
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 max-w-md mx-auto">
          <FiDatabase className="w-16 h-16 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Archivo Cargado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            <span className="font-medium dark:text-gray-200">{file.name}</span>
            <br />
            <span className="text-sm">{formatFileSize(file.size)}</span>
            <br />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Modificado: {formatDate(file.modified)}
            </span>
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setShowParquetModal(true)}
              className="btn btn-primary w-full flex items-center justify-center"
            >
              <FiEye className="w-4 h-4 mr-2" />
              Abrir Visualizador
            </button>

            <button
              onClick={() => handleDownload("csv")}
              className="btn btn-outline w-full flex items-center justify-center"
            >
              <FiDownload className="w-4 h-4 mr-2" />
              Descargar CSV
            </button>

            <button
              onClick={() => setShowFileSelector(true)}
              className="btn btn-secondary w-full flex items-center justify-center"
            >
              <FiList className="w-4 h-4 mr-2" />
              Seleccionar otro archivo
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p className="mb-1">
                <span className="font-medium dark:text-gray-200">Columnas:</span>{" "}
                {metadata?.num_columns || "Cargando..."}
              </p>
              <p className="mb-1">
                <span className="font-medium dark:text-gray-200">Filas:</span>{" "}
                {metadata?.num_rows !== undefined && metadata?.num_rows !== null 
                  ? metadata.num_rows.toLocaleString() 
                  : (metadata?.row_count === -1 ? "Archivo grande (>10MB)" : "Cargando...")}
              </p>
              <p>
                <span className="font-medium dark:text-gray-200">Formato:</span>{" "}
                {metadata?.format_version || "Parquet"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border-red-200 overflow-x-hidden">
      <div className="space-y-6 w-full max-w-full mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
              Visor de Archivos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Visualiza y analiza tus datos en tiempo real
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <button
              onClick={() => file && loadFileData(file)}
              className="btn btn-secondary flex items-center whitespace-nowrap text-sm"
            >
              <FiRefreshCw className="w-4 h-4 mr-2" />
              Refrescar
            </button>
            <button
              onClick={() =>
                window.open("https://parquet.apache.org/", "_blank")
              }
              className="btn btn-outline flex items-center whitespace-nowrap text-sm"
            >
              <FiExternalLink className="w-4 h-4 mr-2" />
              Documentación
            </button>
          </div>
        </div>

        {renderContent()}
      </div>

      {/* Modal para visualización de archivos Parquet */}
      <ParquetModal
        isOpen={showParquetModal}
        onClose={() => setShowParquetModal(false)}
        file={file}
        metadata={metadata}
        data={data}
        loading={loading}
        error={error}
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

      {/* File Selector Modal */}
      {renderFileSelector()}
    </div>
  );
};

export default ParquetViewer;
