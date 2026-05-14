import React from "react";
import { TbBrandAws } from "react-icons/tb";
import { FiRefreshCw, FiChevronRight, FiChevronDown } from "react-icons/fi";

const BucketList = ({
  buckets,
  expandedBuckets,
  toggleBucket,
  onBucketSelect,
  loadBuckets,
}) => {
  return (
    <div className="max-w-4xl mx-auto w-full px-4 overflow-hidden">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <TbBrandAws className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0" />
                <span className="truncate">Buckets S3</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Selecciona un bucket para explorar su contenido
              </p>
            </div>
            <button
              onClick={loadBuckets}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center space-x-2 flex-shrink-0"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Actualizar</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {buckets.map((bucket, index) => (
            <div key={index} className="transition-all duration-200">
              <button
                onClick={() => toggleBucket(bucket.name)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                    <TbBrandAws className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="text-left overflow-hidden">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                      {bucket.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      Creado: {new Date(bucket.creation_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {expandedBuckets.includes(bucket.name) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onBucketSelect(bucket.name);
                      }}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-primary-500 text-white hover:bg-primary-600 transition-all duration-200"
                    >
                      Explorar
                    </button>
                  )}
                  {expandedBuckets.includes(bucket.name) ? (
                    <FiChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <FiChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  )}
                </div>
              </button>

              {expandedBuckets.includes(bucket.name) && (
                <div className="px-4 pb-3 pt-0 bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Haz clic en "Explorar" para ver el contenido
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
          {buckets.length === 0 && (
             <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
               No hay buckets disponibles.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BucketList;
