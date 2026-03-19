import React, { useState } from "react";
import { FiX, FiCopy, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { TbBrandAws } from "react-icons/tb";
import axios from "axios";

const CopyModal = ({ isOpen, onClose, file, files = [], buckets, onCopySuccess }) => {
    const isBulk = files && files.length > 0;
    const [destBucket, setDestBucket] = useState("");
    const [destPath, setDestPath] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Inicializar valores cuando se abre el modal
    React.useEffect(() => {
        if (isOpen) {
            if (isBulk) {
                setDestBucket(files[0].bucket);
                // Para bulk, por defecto sugerimos la misma carpeta
                const firstKey = files[0].key;
                const lastSlash = firstKey.lastIndexOf('/');
                setDestPath(lastSlash !== -1 ? firstKey.substring(0, lastSlash) : "");
            } else if (file) {
                setDestBucket(file.bucket);
                setDestPath(file.key);
            }
            setSuccess(false);
            setError(null);
        }
    }, [isOpen, isBulk, file, files]);

    if (!isOpen) return null;

    const handleCopy = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isBulk) {
                await axios.post("/api/buckets/bulk-copy", {
                    source_bucket: files[0].bucket,
                    source_keys: files.map(f => f.key),
                    dest_bucket: destBucket,
                    dest_path: destPath,
                });
            } else {
                await axios.post("/api/buckets/copy", {
                    source_bucket: file.bucket,
                    source_key: file.key,
                    dest_bucket: destBucket,
                    dest_key: destPath,
                });
            }
            setSuccess(true);
            setTimeout(() => {
                onCopySuccess();
                onClose();
                setSuccess(false);
            }, 2000);
        } catch (err) {
            console.error("Error copying file(s):", err);
            setError(err.response?.data?.detail || "Error al copiar el/los archivo(s)");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-primary-50 dark:bg-primary-900/20">
                    <h3 className="text-lg font-bold text-primary-900 dark:text-primary-100 flex items-center">
                        <FiCopy className="mr-2" />
                        {isBulk ? `Copiar ${files.length} Archivos` : 'Copiar Archivo Parquet'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <FiCheckCircle className="w-16 h-16 text-green-500 mb-4" />
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">¡Copiado con éxito!</h4>
                            <p className="text-gray-600 dark:text-gray-400">
                                {isBulk ? 'Los archivos se han copiado exitosamente.' : 'El archivo se ha copiado al destino seleccionado.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Origen</p>
                                {isBulk ? (
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {files.length} archivos de <span className="text-primary-600 dark:text-primary-400">{files[0].bucket}</span>
                                    </p>
                                ) : (
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file?.bucket}/{file?.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Bucket de Destino
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <TbBrandAws className="text-orange-500" />
                                    </div>
                                    <select
                                        value={destBucket}
                                        onChange={(e) => setDestBucket(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500 text-sm"
                                    >
                                        {buckets.map((b) => (
                                            <option key={b.name} value={b.name}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    {isBulk ? 'Carpeta de Destino' : 'Ruta de Destino (Key)'}
                                </label>
                                <input
                                    type="text"
                                    value={destPath}
                                    onChange={(e) => setDestPath(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500 text-sm"
                                    placeholder={isBulk ? "ej: carpeta/subcarpeta" : "ej: carpeta/subcarpeta/archivo.parquet"}
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {isBulk
                                        ? "Los archivos mantendrán sus nombres originales."
                                        : "Incluye el nombre del archivo al final."}
                                </p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start text-red-700 dark:text-red-400 text-sm">
                                    <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="pt-4 flex space-x-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCopy}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <FiCopy className="mr-2" />
                                            {isBulk ? 'Copiar Todo' : 'Confirmar Copia'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CopyModal;
