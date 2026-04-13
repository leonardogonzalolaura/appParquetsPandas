import React, { useRef, useState, useEffect } from "react";
import {
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiMaximize,
  FiMinimize,
  FiFolder,
  FiRefreshCw,
  FiArrowUp,
  FiArrowDown,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { TbTable } from "react-icons/tb";

const DataTable = ({
  data,
  limit,
  setLimit,
  file,
  loadFileData,
  selectedColumns,
  setSelectedColumns,
  handleColumnToggle,
  filters,
  handleFilterChange,
  handleApplyFilters,
}) => {
  const tableContainerRef = useRef(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showColumnCount, setShowColumnCount] = useState(7);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");
  const pickerRef = useRef(null);

  // Cerrar picker al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowColumnPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lógica de ordenamiento
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!data.data || !sortConfig.key || !sortConfig.direction) {
      return data.data;
    }

    return [...data.data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null) return 1;
      if (bValue === null) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [data.data, sortConfig]);

  // Ancho fijo para 7 columnas (150px mínimo por columna)
  const COLUMN_MIN_WIDTH = 150;
  const VISIBLE_COLUMNS_COUNT = 7;
  const CONTAINER_WIDTH = VISIBLE_COLUMNS_COUNT * COLUMN_MIN_WIDTH;

  // Actualizar columnas visibles basadas en las seleccionadas
  useEffect(() => {
    if (data.columns && selectedColumns) {
      // Filtrar columnas que existen en los datos
      const filteredColumns = data.columns.filter((col) =>
        selectedColumns.includes(col),
      );
      setVisibleColumns(filteredColumns);
    } else if (data.columns) {
      setVisibleColumns(data.columns);
    }

    // Configurar número inicial de columnas a mostrar
    if (data.columns) {
      const initialCount = Math.min(data.columns.length, VISIBLE_COLUMNS_COUNT);
      setShowColumnCount(initialCount);

      // Mostrar solo las primeras columnas inicialmente
      if (!selectedColumns || selectedColumns.length === 0) {
        const initialColumns = data.columns.slice(0, initialCount);
        setSelectedColumns(initialColumns);
      }
    }
  }, [data.columns, selectedColumns]);

  // Verificar scroll horizontal
  const checkScroll = () => {
    if (tableContainerRef.current) {
      const container = tableContainerRef.current;
      setShowLeftScroll(container.scrollLeft > 0);
      setShowRightScroll(
        container.scrollLeft < container.scrollWidth - container.clientWidth,
      );
    }
  };

  // Efecto para verificar scroll después de renderizar
  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [visibleColumns]);

  // Scroll horizontal
  const scrollHorizontal = (direction) => {
    if (tableContainerRef.current) {
      const container = tableContainerRef.current;
      const scrollAmount = 300;
      const newScrollLeft =
        direction === "left"
          ? container.scrollLeft - scrollAmount
          : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });

      // Actualizar estado después de un breve delay
      setTimeout(checkScroll, 300);
    }
  };

  // Expandir/contraer tabla
  const toggleExpand = () => {
    const expanding = !isExpanded;
    setIsExpanded(expanding);
    if (expanding && data.columns) {
      // Al expandir: mostrar TODAS las columnas
      setSelectedColumns(data.columns);
      setShowColumnCount(data.columns.length);
    } else if (!expanding && data.columns) {
      // Al contraer: volver a las primeras 7
      const initial = data.columns.slice(0, Math.min(data.columns.length, VISIBLE_COLUMNS_COUNT));
      setSelectedColumns(initial);
      setShowColumnCount(initial.length);
    }
  };



  // Obtener el número de columnas ocultas
  const getHiddenColumnsCount = () => {
    if (!data.columns) return 0;
    return data.columns.length - visibleColumns.length;
  };


  return (
    <div className={isExpanded ? "fixed inset-0 z-[60] flex items-center justify-center p-4" : "relative w-full"}>
      {/* Fondo oscuro cuando está expandido */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 -z-[1]"
          onClick={toggleExpand}
        />
      )}
      {/* Contenedor principal */}
      <div
        className={`overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 ${
          isExpanded
            ? "w-full h-full max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] shadow-2xl"
            : "w-full"
        }`}
      >
        {/* Header con controles */}
        <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {visibleColumns.length} columnas visibles
              </span>
              {visibleColumns.length > VISIBLE_COLUMNS_COUNT && (
                <div className="flex items-center space-x-1 border-l border-gray-200 dark:border-gray-700 pl-3">
                  <button
                    onClick={() => scrollHorizontal("left")}
                    disabled={!showLeftScroll}
                    className={`p-1 rounded ${showLeftScroll ? "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" : "text-gray-300 dark:text-gray-600 cursor-not-allowed"}`}
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollHorizontal("right")}
                    disabled={!showRightScroll}
                    className={`p-1 rounded ${showRightScroll ? "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" : "text-gray-300 dark:text-gray-600 cursor-not-allowed"}`}
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Botón Aplicar Filtros (si hay filtros) */}
              {Object.values(filters).some(v => v) && (
                <button
                  onClick={handleApplyFilters}
                  className="flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-600 dark:bg-primary-700 text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-all shadow-sm animate-pulse-subtle"
                  title="Aplicar todos los filtros (Enter)"
                >
                  <FiRefreshCw className="w-3.5 h-3.5 mr-2" />
                  Aplicar Filtros
                </button>
              )}

              {/* Botón Limpiar Filtros */}
              {Object.values(filters).some(v => v) && (
                <button
                  onClick={() => {
                    Object.keys(filters).forEach(k => handleFilterChange(k, ""));
                    setTimeout(handleApplyFilters, 0);
                  }}
                  className="flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  <FiX className="w-3.5 h-3.5 mr-2" />
                  Limpiar
                </button>
              )}

              {/* Selector de columnas granular */}
              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => {
                    if (!showColumnPicker) setColumnSearch("");
                    setShowColumnPicker(!showColumnPicker);
                  }}
                  className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    showColumnPicker
                      ? "bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:border-primary-400 dark:text-primary-300"
                      : "bg-white border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:border-gray-400"
                  }`}
                >
                  <FiEye className="w-3.5 h-3.5 mr-2" />
                  Personalizar
                  <FiChevronDown className={`ml-2 w-3.5 h-3.5 transition-transform ${showColumnPicker ? "rotate-180" : ""}`} />
                </button>

                {showColumnPicker && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[70] overflow-hidden animate-slide-up">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Columnas
                      </span>
                      <span className="text-[10px] bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 px-1.5 py-0.5 rounded-full font-bold">
                        {selectedColumns.length} / {data.columns?.length || 0}
                      </span>
                    </div>

                    {/* Buscador de columnas */}
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                      <div className="relative">
                        <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar columna..."
                          className="w-full pl-8 pr-8 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
                          value={columnSearch}
                          onChange={(e) => setColumnSearch(e.target.value)}
                          autoFocus
                        />
                        {columnSearch && (
                          <button
                            onClick={() => setColumnSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                          >
                            <FiX className="w-2.5 h-2.5 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto p-2 space-y-0.5">
                      <button
                        onClick={() => {
                          setSelectedColumns(data.columns || []);
                          setShowColumnCount(data.columns?.length || 0);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                      >
                        Seleccionar Todas
                      </button>
                      <button
                        onClick={() => {
                          const initial = data.columns?.slice(0, Math.min(data.columns.length, VISIBLE_COLUMNS_COUNT)) || [];
                          setSelectedColumns(initial);
                          setShowColumnCount(initial.length);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border-b border-gray-100 dark:border-gray-700 mb-1"
                      >
                        Primeras {VISIBLE_COLUMNS_COUNT}
                      </button>
                      {data.columns
                        ?.filter((col) =>
                          col.toLowerCase().includes(columnSearch.toLowerCase())
                        )
                        .map((col) => (
                          <label
                            key={col}
                            className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors group"
                          >
                            <input
                              type="checkbox"
                              checked={selectedColumns.includes(col)}
                              onChange={() => handleColumnToggle(col)}
                              className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3"
                            />
                            <span
                              className={`text-xs truncate ${
                                selectedColumns.includes(col)
                                  ? "text-gray-900 dark:text-white font-medium"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {col}
                            </span>
                          </label>
                        ))}
                      {data.columns?.filter((col) =>
                        col.toLowerCase().includes(columnSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="py-4 text-center">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 italic">
                            No se encontraron columnas
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Botón expandir/contraer */}
              <button
                onClick={toggleExpand}
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
                title={isExpanded ? "Contraer tabla" : "Expandir tabla"}
              >
                {isExpanded ? (
                  <FiMinimize className="w-4 h-4" />
                ) : (
                  <FiMaximize className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL CON SCROLL HORIZONTAL */}
        <div
          ref={tableContainerRef}
          className="overflow-x-auto"
          style={{
            flex: 1,
            maxHeight: isExpanded ? "none" : "450px",
            width: "100%",
          }}
          onScroll={checkScroll}
        >
          {/* TABLA CON ANCHO MÍNIMO BASADO EN COLUMNAS */}
          <div
            style={{
              minWidth: `${visibleColumns.length * COLUMN_MIN_WIDTH}px`,
            }}
          >
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  {visibleColumns.map((column, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider group cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      style={{
                        minWidth: `${COLUMN_MIN_WIDTH}px`,
                        maxWidth: `${COLUMN_MIN_WIDTH * 2}px`,
                      }}
                      onClick={() => handleSort(column)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 truncate">
                          <span className="truncate" title={column}>
                            {column}
                          </span>
                          {sortConfig.key === column && (
                            <span className="text-primary-500 dark:text-primary-400">
                              {sortConfig.direction === "asc" ? (
                                <FiArrowUp className="w-3.5 h-3.5" />
                              ) : (
                                <FiArrowDown className="w-3.5 h-3.5" />
                              )}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleColumnToggle(column);
                          }}
                          className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Ocultar columna"
                        >
                          <FiEye className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
                {/* Nueva fila de filtros */}
                <tr className="bg-gray-100/50 dark:bg-gray-900/30">
                  {visibleColumns.map((column, index) => (
                    <th
                      key={`filter-${index}`}
                      className="px-3 py-2 border-b border-gray-200 dark:border-gray-700"
                    >
                      <div className="relative group">
                        <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                        <input
                          type="text"
                          placeholder="Filtrar..."
                          className="w-full pl-7 pr-7 py-1 text-[10px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-gray-400"
                          value={filters[column] || ""}
                          onChange={(e) => handleFilterChange(column, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleApplyFilters();
                          }}
                        />
                        {filters[column] && (
                          <button
                            onClick={() => {
                              handleFilterChange(column, "");
                              setTimeout(handleApplyFilters, 0);
                            }}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                          >
                            <FiX className="w-2.5 h-2.5 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.is_tabular === false ? (
                  <tr>
                    <td colSpan={visibleColumns.length} className="p-0">
                      <pre className="p-6 text-sm font-mono text-gray-700 dark:text-gray-300 overflow-auto bg-gray-50 dark:bg-gray-900/30 line-height-relaxed select-text">
                        {data.data.map(row => row.line).join('\n')}
                      </pre>
                    </td>
                  </tr>
                ) : sortedData && sortedData.length > 0 ? (
                  sortedData.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      {visibleColumns.map((column, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300"
                          style={{
                            minWidth: `${COLUMN_MIN_WIDTH}px`,
                            maxWidth: `${COLUMN_MIN_WIDTH * 2}px`,
                          }}
                        >
                          <div className="truncate" title={String(row[column])}>
                            {row[column] === null ? (
                              <span className="text-gray-400 dark:text-gray-500 italic">
                                null
                              </span>
                            ) : typeof row[column] === "object" ? (
                              <code className="text-xs bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 p-1 rounded block truncate">
                                {JSON.stringify(row[column])}
                              </code>
                            ) : (
                              String(row[column])
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={visibleColumns.length}
                      className="px-6 py-20 text-center"
                    >
                      <TbTable className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                        No hay datos para mostrar
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Intenta ajustar los filtros o seleccionar diferentes
                        columnas
                      </p>
                      {Object.values(filters).some((v) => v) && (
                        <button
                          onClick={() => {
                            Object.keys(filters).forEach((k) =>
                              handleFilterChange(k, "")
                            );
                            setTimeout(handleApplyFilters, 0);
                          }}
                          className="mt-4 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          Limpiar todos los filtros
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer con controles de paginación */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex flex-col gap-3">
            {/* Fila superior del footer: Ruta del archivo */}
            {file?.key && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-100/50 dark:bg-gray-800/50 px-2 py-1 rounded">
                <FiFolder className="w-3.5 h-3.5 mr-2 text-gray-400 dark:text-gray-500" />
                <span className="font-mono truncate" title={file.key}>{file.key}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-lg shadow-sm">
                  <span className="font-semibold text-primary-700 dark:text-primary-400 mr-1">
                    {Math.min(limit, data.data.length).toLocaleString()}
                  </span>
                  <span className="text-gray-400 dark:text-gray-600 mx-1">/</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {data.row_count?.toLocaleString() || 0} filas
                  </span>
                </div>

                <span className="hidden sm:inline text-gray-400 dark:text-gray-600">•</span>

                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {visibleColumns.length} columnas
                </span>

                {getHiddenColumnsCount() > 0 && (
                  <>
                    <span className="hidden sm:inline text-gray-400">•</span>
                    <span className="text-amber-600 font-medium">
                      {getHiddenColumnsCount()} ocultas
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold">Límite:</span>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value))}
                    className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                  </select>
                </div>

                <button
                  onClick={() => file && loadFileData(file)}
                  className="flex items-center px-4 py-1.5 bg-primary-600 dark:bg-primary-700 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 font-semibold transition-all shadow-sm active:scale-95"
                >
                  <FiRefreshCw className="w-3.5 h-3.5 mr-2" />
                  Actualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
