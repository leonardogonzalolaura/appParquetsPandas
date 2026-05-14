import React from "react";
import { FiCopy, FiX } from "react-icons/fi";

const FloatingActionBar = ({
  selectedFiles,
  onCopyClick,
  onClearSelection,
}) => {
  if (selectedFiles.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-gray-900 dark:bg-gray-950 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-4 border border-gray-700 backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center space-x-2 border-r border-gray-700 pr-4">
          <div className="bg-primary-500 w-6 h-6 rounded-full flex items-center justify-center">
            <span className="text-[11px] font-bold">{selectedFiles.length}</span>
          </div>
          <span className="text-xs font-medium whitespace-nowrap">
            archivo{selectedFiles.length !== 1 ? "s" : ""} seleccionado{selectedFiles.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onCopyClick}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-3 py-1.5 rounded-lg transition-all duration-200 text-xs font-semibold shadow-lg shadow-orange-500/25"
          >
            <FiCopy className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Copiar {selectedFiles.length > 1 ? "masivo" : "archivo"}</span>
          </button>

          <button
            onClick={onClearSelection}
            className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-gray-800 rounded-lg"
            title="Limpiar selección"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingActionBar;
