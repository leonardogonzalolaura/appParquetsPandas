import React, { useState, useEffect } from 'react';
import { FiPlus, FiServer, FiFile, FiTrash2, FiCheck, FiExternalLink, FiEdit2, FiX } from 'react-icons/fi';
import { TbBrandAws, TbFileDatabase } from 'react-icons/tb';
import ProfileService from '../../services/ProfileService';

export default function WelcomeScreen({ onProfileSelect }) {
  const [profiles, setProfiles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    accessKey: '',
    secretKey: '',
    region: 'us-east-1',
    defaultBucket: ''
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const list = await ProfileService.getProfiles();
    setProfiles(list);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ProfileService.saveProfile(formData.name, formData);
      await loadProfiles();
      setShowForm(false);
      setFormData({ name: '', accessKey: '', secretKey: '', region: 'us-east-1', defaultBucket: '' });
    } catch (error) {
      alert('Error guardando el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      accessKey: profile.accessKey || '',
      secretKey: profile.secretKey || '',
      region: profile.region || 'us-east-1',
      defaultBucket: profile.defaultBucket || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Actualizar perfil (manteniendo el mismo ID)
      await ProfileService.updateProfile(editingProfile.id, formData);
      await loadProfiles();
      setShowEditModal(false);
      setEditingProfile(null);
      setFormData({ name: '', accessKey: '', secretKey: '', region: 'us-east-1', defaultBucket: '' });
    } catch (error) {
      alert('Error actualizando el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar este perfil?')) {
      ProfileService.deleteProfile(id);
      loadProfiles();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2.5 bg-primary-500 rounded-xl shadow-lg shadow-primary-500/20 mb-4">
            <TbFileDatabase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
            S3 Parquet Explorer
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
            Explora, filtra y analiza tus datos de Amazon S3 de forma rápida y segura.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card: S3 Profiles */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <TbBrandAws className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Perfiles S3</h2>
              </div>
              <button 
                onClick={() => setShowForm(!showForm)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-primary-500"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>

            {showForm ? (
              <form onSubmit={handleSubmit} className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <input
                  required
                  placeholder="Nombre del Perfil"
                  className="w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border-none focus:ring-1 focus:ring-primary-500 dark:text-white text-xs"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
                <input
                  required
                  type="password"
                  placeholder="Access Key ID"
                  className="w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border-none focus:ring-1 focus:ring-primary-500 dark:text-white text-xs"
                  value={formData.accessKey}
                  onChange={e => setFormData({...formData, accessKey: e.target.value})}
                />
                <input
                  required
                  type="password"
                  placeholder="Secret Access Key"
                  className="w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border-none focus:ring-1 focus:ring-primary-500 dark:text-white text-xs"
                  value={formData.secretKey}
                  onChange={e => setFormData({...formData, secretKey: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-2">
                   <select 
                    className="px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border-none focus:ring-1 focus:ring-primary-500 dark:text-white text-xs"
                    value={formData.region}
                    onChange={e => setFormData({...formData, region: e.target.value})}
                   >
                     <option value="us-east-1">us-east-1</option>
                     <option value="us-west-2">us-west-2</option>
                     <option value="eu-west-1">eu-west-1</option>
                     <option value="sa-east-1">sa-east-1</option>
                   </select>
                   <input
                    required
                    placeholder="Buckets (ej: my-bucket, other-b)"
                    title="Si no tienes permiso para listar todos los buckets, agrégalos aquí separados por coma"
                    className="px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border-none focus:ring-1 focus:ring-primary-500 dark:text-white text-xs"
                    value={formData.defaultBucket}
                    onChange={e => setFormData({...formData, defaultBucket: e.target.value})}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg transition-all shadow-md shadow-primary-500/20 disabled:opacity-50 text-xs"
                  >
                    {loading ? 'Guardando...' : 'Crear Perfil'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-xs"
                  >
                    Cerrar
                  </button>
                </div>
              </form>
            ) : (
              <>
                {profiles.length > 0 && (
                  <div className="mb-2 text-[10px] text-gray-500 uppercase tracking-widest px-1 flex justify-between">
                    <span>Selecciona un perfil</span>
                    <span>{profiles.length} perfiles</span>
                  </div>
                )}
                
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[240px] pr-1 custom-scrollbar">
                  {profiles.length > 0 ? (
                    profiles.map(profile => (
                      <div 
                        key={profile.id}
                        onClick={() => onProfileSelect(profile.id)}
                        className="group p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-xl cursor-pointer transition-all border border-transparent hover:border-primary-200 dark:hover:border-primary-900/50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm text-gray-400 group-hover:text-primary-500 transition-colors">
                            <FiServer className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-xs">{profile.name}</h3>
                            <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-widest">{profile.region}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(profile);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(e, profile.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-6 opacity-50 text-center">
                      <FiServer className="w-8 h-8 mb-2 text-gray-300" />
                      <p className="text-xs text-gray-500">Sin perfiles</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Card: Local File (Placeholder) */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 group">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FiFile className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Local</h2>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl p-6 text-center group-hover:border-blue-500/30 transition-colors">
              <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FiPlus className="w-6 h-6 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-sm">Cargar Parquet</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-4">Arrastra un archivo aquí</p>
              
              <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[9px] font-bold rounded-full uppercase">
                Próximamente
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center flex items-center justify-center gap-4 text-gray-400 dark:text-gray-600 text-[10px]">
          <span className="flex items-center gap-1"><FiCheck className="text-green-500" /> Encriptación AES</span>
          <span className="flex items-center gap-1"><FiCheck className="text-green-500" /> Local Storage</span>
          <button className="hover:text-primary-500 flex items-center gap-1 transition-colors bg-transparent border-none cursor-pointer p-0">Doc <FiExternalLink /></button>
        </div>
      </div>

      {/* Edit Modal - Minimalista */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <FiEdit2 className="w-4 h-4 text-primary-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Editar perfil</h3>
              </div>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProfile(null);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FiX className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Nombre
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:text-white text-sm outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Access Key ID
                </label>
                <input
                  required
                  type="password"
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:text-white text-sm outline-none transition-all"
                  value={formData.accessKey}
                  onChange={e => setFormData({...formData, accessKey: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Secret Access Key
                </label>
                <input
                  required
                  type="password"
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:text-white text-sm outline-none transition-all"
                  value={formData.secretKey}
                  onChange={e => setFormData({...formData, secretKey: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Región
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:text-white text-sm outline-none transition-all"
                    value={formData.region}
                    onChange={e => setFormData({...formData, region: e.target.value})}
                  >
                    <option value="us-east-1">us-east-1</option>
                    <option value="us-west-2">us-west-2</option>
                    <option value="eu-west-1">eu-west-1</option>
                    <option value="sa-east-1">sa-east-1</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Buckets
                  </label>
                  <input
                    type="text"
                    placeholder="my-bucket, other-bucket"
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:text-white text-sm outline-none transition-all"
                    value={formData.defaultBucket}
                    onChange={e => setFormData({...formData, defaultBucket: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProfile(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-lg transition-all shadow-md shadow-primary-500/20 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}