import React, { useState, useEffect, useCallback } from "react";
//import { useNavigate } from "react-router-dom";
import axios from "axios";

import { ParquetModal } from "../components/ParquetViewer";
import CopyModal from "../components/CopyModal";
import BucketList from "../components/bucket-explorer/BucketList";
import Breadcrumbs from "../components/bucket-explorer/Breadcrumbs";
import FolderGrid from "../components/bucket-explorer/FolderGrid";
import FileList from "../components/bucket-explorer/FileList";
import FloatingActionBar from "../components/bucket-explorer/FloatingActionBar";

const BucketExplorer = ({ selectedBucket, onBucketSelect, navigatePath, onNavigatePathDone, buckets: propBuckets }) => {
  //const navigate = useNavigate();
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
  const [searchFilter, setSearchFilter] = useState("");
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [fileToCopy, setFileToCopy] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Sincronizar buckets desde App.js (evita llamada API redundante)
  useEffect(() => {
    if (propBuckets && propBuckets.length > 0) {
      setBuckets(propBuckets);
      setExpandedBuckets(propBuckets.map(b => b.name));
    }
  }, [propBuckets]);

  useEffect(() => {
    loadBuckets();
  }, [loadBuckets]);

  useEffect(() => {
    if (selectedBucket) {
      explorePath(selectedBucket, "");
    }
  }, [selectedBucket]);

  useEffect(() => {
    if (navigatePath && selectedBucket) {
      explorePath(selectedBucket, navigatePath);
      if (onNavigatePathDone) onNavigatePathDone();
    }
  }, [navigatePath, selectedBucket, onNavigatePathDone]);

  const loadBuckets = useCallback(async () => {
    if (propBuckets && propBuckets.length > 0) return;
    setLoading(true);
    try {
      const response = await axios.get("/buckets");
      setBuckets(response.data);
      setExpandedBuckets(response.data.map((b) => b.name));
    } catch (error) {
      console.error("Error loading buckets:", error);
    } finally {
      setLoading(false);
    }
  }, [propBuckets]);

  const explorePath = async (bucket, path = "") => {
    setLoading(true);
    try {
      const response = await axios.get(`/buckets/${bucket}/explore`, {
        params: { path },
      });
      setExplorationData(response.data);
      setSelectedFiles([]);
      setSearchFilter("");
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

  const handleRefresh = () => {
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

  const filteredFiles = explorationData.files.filter((file) =>
    file.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const selectAllFiles = () => {
    if (selectedFiles.length === filteredFiles.length && filteredFiles.length > 0) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map((f) => ({ ...f, bucket: selectedBucket })));
    }
  };

  const handleDownload = async (format = "csv") => {
    if (!selectedFile) return;

    try {
      const response = await axios.get("/download", {
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
      const extension = selectedFile.key.split(".").pop();
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
      prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column],
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
      const dataResponse = await axios.post("/file/data", {
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
      const dataResponse = await axios.post("/file/data", {
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
      const metadataResponse = await axios.get("/file/metadata", {
        params: {
          bucket: selectedBucket,
          key: file.key,
        },
      });
      setFileMetadata(metadataResponse.data);

      const dataResponse = await axios.post("/file/data", {
        bucket: selectedBucket,
        key: file.key,
        limit: limit,
      });
      setFileData(dataResponse.data);

      if (dataResponse.data.columns) {
        const initialColumns = dataResponse.data.columns.slice(0, 7);
        setSelectedColumns(initialColumns);
      }
    } catch (err) {
      console.error("Error loading file:", err);
      setFileError(err.response?.data?.detail || "Error al cargar el archivo");
    } finally {
      setFileLoading(false);
    }
  };

  if (!selectedBucket) {
    return (
      <BucketList
        buckets={buckets}
        expandedBuckets={expandedBuckets}
        toggleBucket={toggleBucket}
        onBucketSelect={onBucketSelect}
        loadBuckets={loadBuckets}
      />
    );
  }

  return (
    <>
      <div className="space-y-4 max-w-full overflow-hidden px-2 sm:px-4">


        <Breadcrumbs
          currentPath={explorationData.current_path}
          parentPath={explorationData.parent_path}
          selectedBucket={selectedBucket}
          onHomeClick={handleHomeClick}
          onBackClick={handleBackClick}
          onExplorePath={explorePath}
        />

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10">
            <div className="flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin mb-3"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando contenido...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <FolderGrid
              folders={explorationData.folders}
              onFolderClick={handleFolderClick}
            />
            <FileList
              files={explorationData.files}
              filteredFiles={filteredFiles}
              searchFilter={searchFilter}
              setSearchFilter={setSearchFilter}
              explorerViewMode={explorerViewMode}
              setExplorerViewMode={setExplorerViewMode}
              handleRefresh={handleRefresh}
              selectedFiles={selectedFiles}
              toggleFileSelection={toggleFileSelection}
              selectAllFiles={selectAllFiles}
              formatFileSize={formatFileSize}
              formatDate={formatDate}
              handleViewFile={handleViewFile}
              selectedBucket={selectedBucket}
              setFileToCopy={setFileToCopy}
              setShowCopyModal={setShowCopyModal}
            />
          </div>
        )}
      </div>

      <FloatingActionBar
        selectedFiles={selectedFiles}
        onCopyClick={() => setShowCopyModal(true)}
        onClearSelection={() => setSelectedFiles([])}
      />

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

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translate(-50%, 100%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default BucketExplorer;