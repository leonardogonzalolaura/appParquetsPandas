import React from "react";
import { FiHome, FiArrowLeft, FiChevronRight } from "react-icons/fi";

const Breadcrumbs = ({
  currentPath,
  parentPath,
  selectedBucket,
  onHomeClick,
  onBackClick,
  onExplorePath,
}) => {
  const pathParts = currentPath.split("/").filter(Boolean);

  return (
    <div className="flex items-center flex-wrap gap-2 mb-4 px-1">
      <button
        onClick={onHomeClick}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
        title="Ir a la raíz"
      >
        <FiHome className="w-4 h-4" />
      </button>

      {parentPath !== null && (
        <button
          onClick={onBackClick}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
          title="Atrás"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-center flex-wrap gap-1">
        <button
          onClick={onHomeClick}
          className="px-2 py-1 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
        >
          {selectedBucket}
        </button>

        {pathParts.map((part, index) => (
          <React.Fragment key={index}>
            <FiChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <button
              onClick={() => {
                const path = pathParts.slice(0, index + 1).join("/") + "/";
                onExplorePath(selectedBucket, path);
              }}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                index === pathParts.length - 1
                  ? "bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-800/20 text-primary-700 dark:text-primary-300"
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

export default Breadcrumbs;
