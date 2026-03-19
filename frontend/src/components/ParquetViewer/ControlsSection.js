import React from "react";
import { FiColumns, FiFilter } from "react-icons/fi";

const ControlsSection = ({
  metadata,
  selectedColumns,
  handleColumnToggle,
  setSelectedColumns,
  filters,
  handleFilterChange,
  handleApplyFilters,
  setFilters,
}) => {
  if (!metadata) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 overflow-hidden">
      {/* Column Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Columnas seleccionadas
            </h3>
            <span className="text-xs text-gray-500">
              {selectedColumns.length} de {metadata.columns.length}
            </span>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max">
              {metadata.columns.map((column) => (
                <button
                  key={column}
                  onClick={() => handleColumnToggle(column)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm flex-shrink-0 ${selectedColumns.includes(column)
                      ? "bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                    }`}
                >
                  <FiColumns className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate max-w-[120px]">{column}</span>
                  {selectedColumns.includes(column) && (
                    <span className="ml-2 text-xs flex-shrink-0">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            onClick={() => setSelectedColumns(metadata.columns)}
            className="text-sm text-primary-600 hover:text-primary-700 whitespace-nowrap"
          >
            Seleccionar todas
          </button>
          <button
            onClick={() => setSelectedColumns([])}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 whitespace-nowrap"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">Máximo 3 columnas</span>
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-2 min-w-max">
                {metadata.columns.slice(0, 3).map((column) => (
                  <div
                    key={column}
                    className="flex items-center flex-shrink-0"
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-400 mr-2 whitespace-nowrap">
                      {column}:
                    </span>
                    <input
                      type="text"
                      placeholder="Valor..."
                      value={filters[column] || ""}
                      onChange={(e) =>
                        handleFilterChange(column, e.target.value)
                      }
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              onClick={handleApplyFilters}
              className="btn btn-primary text-sm whitespace-nowrap"
            >
              <FiFilter className="w-4 h-4 mr-2" />
              Aplicar filtros
            </button>
            <button
              onClick={() => setFilters({})}
              className="btn btn-outline text-sm whitespace-nowrap"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlsSection;
