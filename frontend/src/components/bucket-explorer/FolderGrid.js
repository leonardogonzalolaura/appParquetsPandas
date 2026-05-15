import React from "react";
import { TbFolderFilled } from "react-icons/tb";


const FolderGrid = ({ folders, onFolderClick }) => {
  if (!folders || folders.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center mb-2 px-1">
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mr-2">
          Carpetas
        </h3>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          ({folders.length})
        </span>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 px-1">
        {folders.map((folder, index) => (
          <div
            key={index}
            onClick={() => onFolderClick(folder.path)}
            className="group flex items-center cursor-pointer text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
          >
            <TbFolderFilled className="w-4 h-4 mr-1.5 text-blue-500 dark:text-blue-400 group-hover:text-primary-500 transition-colors" />
            <span className="text-xs font-medium underline-offset-2 group-hover:underline">
              {folder.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FolderGrid;
