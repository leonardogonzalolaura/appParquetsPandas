import React, { useState, useEffect } from "react";
import {
  FiDatabase,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiServer,
  FiCheck,
  FiExternalLink,
  FiX,
  FiEye,
  FiEyeOff,
  FiSettings,
} from "react-icons/fi";
import { TbBrandAws } from "react-icons/tb";
import ProfileService from "../services/ProfileService";

const Settings = ({
  activeProfile,
  onProfileSelect,
  onProfilesChange,
  onProfileBucketsUpdate,
}) => {
  const [profiles, setProfiles] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);

  // States for bucket manager (for active profile)
  const [bucketList, setBucketList] = useState([]);
  const [newBucket, setNewBucket] = useState("");

  // States for forms
  const [formData, setFormData] = useState({
    name: "",
    accessKey: "",
    secretKey: "",
    region: "us-east-1",
    defaultBucket: "",
  });

  // Load profiles from localStorage
  const loadProfiles = async () => {
    try {
      const list = await ProfileService.getProfiles();
      setProfiles(list);
    } catch (e) {
      console.error("Error loading profiles in Settings:", e);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [activeProfile]);

  // Sync bucket list of the active profile
  useEffect(() => {
    if (activeProfile?.defaultBucket) {
      setBucketList(
        activeProfile.defaultBucket
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean)
      );
    } else {
      setBucketList([]);
    }
  }, [activeProfile]);

  // Handle profile switching
  const handleActivateProfile = async (id) => {
    if (onProfileSelect) {
      await onProfileSelect(id);
      if (onProfilesChange) await onProfilesChange();
    }
  };

  // Add Bucket to active profile
  const handleAddBucket = () => {
    const name = newBucket.trim();
    if (!name || bucketList.includes(name)) return;
    const updated = [...bucketList, name];
    setBucketList(updated);
    setNewBucket("");
    saveBuckets(updated);
  };

  // Remove Bucket from active profile
  const handleRemoveBucket = (bucket) => {
    const updated = bucketList.filter((b) => b !== bucket);
    setBucketList(updated);
    saveBuckets(updated);
  };

  const saveBuckets = async (list) => {
    if (!activeProfile?.id) return;
    const joined = list.join(",");
    ProfileService.updateProfileBuckets(activeProfile.id, joined);
    if (onProfileBucketsUpdate) onProfileBucketsUpdate(list);
    if (onProfilesChange) await onProfilesChange();
  };

  // Submit Profile (Create)
  const handleCreateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ProfileService.saveProfile(formData.name, formData);
      await loadProfiles();
      if (onProfilesChange) await onProfilesChange();
      setShowAddModal(false);
      resetFormData();
    } catch (error) {
      alert("Error al guardar el perfil");
    } finally {
      setLoading(false);
    }
  };

  // Edit Profile Mode
  const handleStartEdit = (profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      accessKey: profile.accessKeyEnc || "",
      secretKey: profile.secretKeyEnc || "",
      region: profile.region || "us-east-1",
      defaultBucket: profile.defaultBucket || "",
    });
    setShowEditModal(true);
  };

  // Update Profile (Save changes)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ProfileService.updateProfile(editingProfile.id, formData);
      await loadProfiles();
      if (onProfilesChange) await onProfilesChange();
      setShowEditModal(false);
      setEditingProfile(null);
      resetFormData();
    } catch (error) {
      alert("Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  // Delete Profile
  const handleDeleteProfile = async (id, name) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el perfil "${name}"?`)) {
      ProfileService.deleteProfile(id);
      await loadProfiles();
      if (onProfilesChange) await onProfilesChange();
    }
  };

  const resetFormData = () => {
    setFormData({
      name: "",
      accessKey: "",
      secretKey: "",
      region: "us-east-1",
      defaultBucket: "",
    });
    setShowApiKey(false);
  };

  const renderProfileModal = (isEdit) => {
    const title = isEdit ? "Editar perfil AWS S3" : "Agregar nuevo perfil AWS S3";
    const submitBtnText = loading
      ? "Guardando..."
      : isEdit
      ? "Guardar Cambios"
      : "Crear Perfil";

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <TbBrandAws className="w-6 h-6 text-orange-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-base">{title}</h3>
            </div>
            <button
              onClick={() => {
                if (isEdit) {
                  setShowEditModal(false);
                  setEditingProfile(null);
                } else {
                  setShowAddModal(false);
                }
                resetFormData();
              }}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={isEdit ? handleUpdateProfile : handleCreateProfile} className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Nombre del Perfil
              </label>
              <input
                required
                type="text"
                placeholder="ej: Principal, AWS Desarrollo, Sandbox"
                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-95- dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 outline-none text-sm transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Access Key ID
              </label>
              <input
                required
                type="password"
                placeholder="AKIAIOSFODNN7EXAMPLE"
                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-95- dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 outline-none text-sm transition-all font-mono"
                value={formData.accessKey}
                onChange={(e) => setFormData({ ...formData, accessKey: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Secret Access Key
              </label>
              <div className="relative">
                <input
                  required
                  type={showApiKey ? "text" : "password"}
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-95- dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 outline-none text-sm transition-all font-mono"
                  value={formData.secretKey}
                  onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
                >
                  {showApiKey ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Región AWS
                </label>
                <select
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-95- dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 outline-none text-sm transition-all"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                >
                  <option value="us-east-1">us-east-1</option>
                  <option value="us-east-2">us-east-2</option>
                  <option value="us-west-1">us-west-1</option>
                  <option value="us-west-2">us-west-2</option>
                  <option value="eu-west-1">eu-west-1</option>
                  <option value="eu-central-1">eu-central-1</option>
                  <option value="sa-east-1">sa-east-1</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5" title="Listado de buckets para este perfil separados por coma">
                  Buckets Manuales
                </label>
                <input
                  type="text"
                  placeholder="bucket1, bucket2"
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-95- dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 outline-none text-sm transition-all"
                  value={formData.defaultBucket}
                  onChange={(e) => setFormData({ ...formData, defaultBucket: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  if (isEdit) {
                    setShowEditModal(false);
                    setEditingProfile(null);
                  } else {
                    setShowAddModal(false);
                  }
                  resetFormData();
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg transition-all text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 rounded-lg transition-all shadow-md shadow-primary-500/20 disabled:opacity-50 text-xs"
              >
                {submitBtnText}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiSettings className="w-6 h-6 text-primary-500" />
            Configuración y Perfiles AWS
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra tus perfiles de AWS S3 y los buckets enfocados para tu sesión.
          </p>
        </div>
        <button
          onClick={() => {
            resetFormData();
            setShowAddModal(true);
          }}
          className="btn btn-primary flex items-center gap-1.5"
        >
          <FiPlus className="w-4 h-4" /> Agregar Perfil
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column Left: Profiles List (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiServer className="w-5 h-5 text-primary-500" />
                Perfiles de Conexión S3 ({profiles.length})
              </h3>
            </div>

            <div className="space-y-3">
              {profiles.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl">
                  <FiServer className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No tienes perfiles configurados</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-4">Crea un perfil para conectarte a AWS S3</p>
                  <button
                    onClick={() => {
                      resetFormData();
                      setShowAddModal(true);
                    }}
                    className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                  >
                    <FiPlus className="w-3.5 h-3.5" /> Crear primer perfil
                  </button>
                </div>
              ) : (
                profiles.map((profile) => {
                  const isActive = profile.id === activeProfile?.id;
                  return (
                    <div
                      key={profile.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                        isActive
                          ? "bg-primary-50/50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800/80 shadow-md shadow-primary-950/20"
                          : "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-lg transition-colors ${
                            isActive
                              ? "bg-primary-100/80 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400"
                              : "bg-white dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <TbBrandAws className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                              {profile.name}
                            </span>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400">
                                <FiCheck className="w-2.5 h-2.5" /> Activo
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-xs uppercase tracking-widest mt-0.5 ${
                              isActive
                                ? "text-primary-600 dark:text-primary-400 font-semibold"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {profile.region}
                          </p>
                          {profile.defaultBucket && (
                            <p
                              className={`text-[10px] truncate mt-1 ${
                                isActive
                                  ? "text-primary-600/80 dark:text-primary-400/80 font-medium"
                                  : "text-gray-400 dark:text-gray-500"
                              }`}
                            >
                              Buckets:{" "}
                              <span
                                className={`font-mono ${
                                  isActive
                                    ? "text-primary-700 dark:text-primary-300 font-semibold"
                                    : "text-gray-600 dark:text-gray-400"
                                }`}
                              >
                                {profile.defaultBucket}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!isActive && (
                          <button
                            onClick={() => handleActivateProfile(profile.id)}
                            className="px-3 py-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-lg border border-primary-200 dark:border-primary-800 transition-colors inline-flex items-center gap-1"
                          >
                            <FiCheck className="w-3.5 h-3.5" /> Activar
                          </button>
                        )}
                        <button
                          onClick={() => handleStartEdit(profile)}
                          className={`p-2 rounded-lg border transition-all ${
                            isActive
                              ? "border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 hover:bg-primary-100/50 dark:hover:bg-primary-900/30"
                              : "border-gray-200 dark:border-gray-700 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          }`}
                          title="Editar perfil"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProfile(profile.id, profile.name)}
                          className={`p-2 rounded-lg border transition-all ${
                            isActive
                              ? "border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 hover:bg-primary-100/50 dark:hover:bg-primary-900/30"
                              : "border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          }`}
                          title="Eliminar perfil"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Column Right: Bucket Manager & S3 Helper (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Profile Buckets Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-3">
              <FiDatabase className="w-5 h-5 text-primary-500 mr-2.5" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Buckets del perfil activo
              </h3>
            </div>
            
            {activeProfile ? (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                  Buckets enfocados del perfil activo: <span className="font-bold text-primary-600 dark:text-primary-400">{activeProfile.name}</span>. 
                  Esto evita tener que listar todos los buckets de tu cuenta de AWS si no tienes permisos suficientes.
                </p>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newBucket}
                    onChange={(e) => setNewBucket(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddBucket()}
                    placeholder="nombre-del-bucket"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                  />
                  <button
                    onClick={handleAddBucket}
                    className="btn btn-primary flex items-center px-3.5 py-2 text-sm gap-1"
                  >
                    <FiPlus className="w-4 h-4" /> Agregar
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {bucketList.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6 border border-dashed border-gray-100 dark:border-gray-700 rounded-lg">
                      No hay buckets manuales definidos. Se intentará listar todos los buckets automáticamente.
                    </p>
                  ) : (
                    bucketList.map((bucket) => (
                      <div
                        key={bucket}
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 rounded-lg"
                      >
                        <span className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200">
                          {bucket}
                        </span>
                        <button
                          onClick={() => handleRemoveBucket(bucket)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Quitar bucket"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-6 border border-dashed border-gray-100 dark:border-gray-700 rounded-lg">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Selecciona o crea un perfil primero para gestionar sus buckets.
                </p>
              </div>
            )}
          </div>

          {/* S3 Help Guide Card */}
          <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-200/50 dark:border-orange-900/30 rounded-xl p-6">
            <div className="flex items-center mb-3">
              <TbBrandAws className="w-6 h-6 text-orange-500 mr-2" />
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">¿Cómo configurar perfiles S3?</h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
              Para conectarte a un bucket de AWS S3 necesitas crear un usuario IAM en la consola de AWS con permisos de lectura para S3 (políticas como <code className="px-1 py-0.5 bg-orange-100 dark:bg-orange-950/40 rounded text-orange-700 font-mono">AmazonS3ReadOnlyAccess</code>).
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              Las credenciales de tus perfiles se **encriptan de forma segura localmente** en tu navegador utilizando la Web Crypto API del sistema, por lo que nunca viajan al backend desprotegidas.
            </p>
            <a
              href="https://docs.aws.amazon.com/s3/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 inline-flex items-center gap-1 transition-colors"
            >
              Documentación Oficial AWS S3 <FiExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      </div>

      {/* Add Profile Modal */}
      {showAddModal && renderProfileModal(false)}

      {/* Edit Profile Modal */}
      {showEditModal && renderProfileModal(true)}
    </div>
  );
};

export default Settings;
