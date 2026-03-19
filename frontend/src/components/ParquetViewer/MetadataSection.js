import React, { useState } from "react";
import {
  FiHash,
  FiColumns,
  FiDatabase,
  FiCalendar,
  FiCopy,
  FiCheck,
} from "react-icons/fi";

const MetadataSection = ({
  metadata,
  file,
  formatDate,
  formatFileSize,
}) => {
  const [copied, setCopied] = useState(false);

  if (!metadata) return null;

  const handleCopySchema = () => {
    if (!metadata?.schema?.fields) return;

    const header = "Nombre | Tipo | Nullable";
    const divider = "--- | --- | ---";
    const body = metadata.schema.fields
      .map(
        (field) =>
          `${field.name} | ${field.type} | ${field.nullable ? "Sí" : "No"}`
      )
      .join("\n");

    const fullText = `${header}\n${divider}\n${body}`;

    navigator.clipboard
      .writeText(fullText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Error al copiar al portapapeles:", err);
      });
  };

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-100 dark:border-primary-900/50">
          <div className="flex items-center text-primary-600 dark:text-primary-400 mb-1">
            <FiHash className="w-4 h-4 mr-2" />
            <span className="text-xs font-semibold uppercase tracking-wide">Filas</span>
          </div>
          <div className="text-2xl font-bold text-primary-900 dark:text-white">
            {metadata.row_count?.toLocaleString()}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/50">
          <div className="flex items-center text-blue-600 dark:text-blue-400 mb-1">
            <FiColumns className="w-4 h-4 mr-2" />
            <span className="text-xs font-semibold uppercase tracking-wide">Columnas</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-white">
            {metadata.columns?.length}
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/50">
          <div className="flex items-center text-emerald-600 dark:text-emerald-400 mb-1">
            <FiDatabase className="w-4 h-4 mr-2" />
            <span className="text-xs font-semibold uppercase tracking-wide">Tamaño</span>
          </div>
          <div className="text-xl font-bold text-emerald-900 dark:text-white">
            {formatFileSize(metadata.file_size)}
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-900/50">
          <div className="flex items-center text-amber-600 dark:text-amber-400 mb-1">
            <FiCalendar className="w-4 h-4 mr-2" />
            <span className="text-xs font-semibold uppercase tracking-wide">Modificado</span>
          </div>
          <div className="text-sm font-semibold text-amber-900 dark:text-white leading-tight">
            {file?.modified ? formatDate(file.modified) : "N/A"}
          </div>
        </div>
      </div>

      {/* Schema Table */}
      {metadata.schema?.fields && metadata.schema.fields.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center">
              <FiColumns className="w-3.5 h-3.5 mr-1.5" />
              Esquema de columnas
            </h4>
            <button
              onClick={handleCopySchema}
              className={`flex items-center space-x-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-all duration-200 ${copied
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400"
                }`}
              title="Copiar esquema como texto"
            >
              {copied ? (
                <>
                  <FiCheck className="w-3.5 h-3.5" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <FiCopy className="w-3.5 h-3.5" />
                  <span>Copiar Esquema</span>
                </>
              )}
            </button>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Columna
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Tipo
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Nullable
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {metadata.schema.fields.map((field, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white max-w-[200px]">
                        <span className="truncate block" title={field.name}>{field.name}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                        <code className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs">
                          {field.type}
                        </code>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${field.nullable
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                            : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                            }`}
                        >
                          {field.nullable ? "Sí" : "No"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetadataSection;
