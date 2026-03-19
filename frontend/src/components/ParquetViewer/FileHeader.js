import React from "react";
import { FiDownload, FiCalendar, FiDatabase, FiFile } from "react-icons/fi";
import {
  TbFileDatabase,
  TbBrandAws,
  TbTable,
  TbChartBar,
} from "react-icons/tb";

const FileHeader = ({
  file,
  formatDate,
  formatFileSize,
  handleDownload,
  viewMode,
  setViewMode,
}) => {
  if (!file) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
        <div className="flex items-center min-w-0">
          <div className="p-3 bg-primary-50 rounded-lg mr-4 flex-shrink-0">
            <TbFileDatabase className="w-6 h-6 text-primary-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">
              {file.name}
            </h2>
            <div className="flex flex-wrap items-center text-sm text-gray-600 mt-1 gap-2">
              <div className="flex items-center">
                <TbBrandAws className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{file.bucket}</span>
              </div>
              <span className="text-gray-400">•</span>
              <div className="flex items-center">
                <FiCalendar className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">{formatDate(file.modified)}</span>
              </div>
              <span className="text-gray-400">•</span>
              <div className="flex items-center">
                <FiDatabase className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">{formatFileSize(file.size)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => handleDownload("csv")}
            className="btn btn-outline flex items-center whitespace-nowrap"
          >
            <FiDownload className="w-4 h-4 mr-2" />
            CSV
          </button>
          <button
            onClick={() => handleDownload("json")}
            className="btn btn-outline flex items-center whitespace-nowrap"
          >
            <FiDownload className="w-4 h-4 mr-2" />
            JSON
          </button>
          <button
            onClick={() => handleDownload("parquet")}
            className="btn btn-primary flex items-center whitespace-nowrap"
          >
            <FiDownload className="w-4 h-4 mr-2" />
            Parquet
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setViewMode("table")}
          className={`px-4 py-2 font-medium text-sm ${
            viewMode === "table"
              ? "border-b-2 border-primary-500 text-primary-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <TbTable className="w-4 h-4 inline mr-2" />
          Tabla
        </button>
        <button
          onClick={() => setViewMode("json")}
          className={`px-4 py-2 font-medium text-sm ${
            viewMode === "json"
              ? "border-b-2 border-primary-500 text-primary-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FiFile className="w-4 h-4 inline mr-2" />
          JSON
        </button>
        <button
          onClick={() => setViewMode("chart")}
          className={`px-4 py-2 font-medium text-sm ${
            viewMode === "chart"
              ? "border-b-2 border-primary-500 text-primary-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <TbChartBar className="w-4 h-4 inline mr-2" />
          Gráficos
        </button>
      </div>
    </div>
  );
};

export default FileHeader;
