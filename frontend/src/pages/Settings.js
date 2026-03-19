import React, { useState } from "react";
import {
  FiSettings,
  FiKey,
  FiGlobe,
  FiBell,
  FiDatabase,
  FiSave,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiX,
  FiHelpCircle,
  FiShield,
  FiExternalLink,
} from "react-icons/fi";
import {
  TbBrandAws,
  TbFileDatabase,
  TbCloudDataConnection,
} from "react-icons/tb";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("aws");
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState({
    aws: {
      accessKeyId: "",
      secretAccessKey: "",
      region: "us-east-1",
      useEnvironmentVariables: true,
    },
    application: {
      theme: "light",
      language: "es",
      itemsPerPage: 50,
      autoRefresh: true,
      refreshInterval: 300,
    },
  });

  const handleInputChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSaveSettings = () => {
    // Simular guardado
    localStorage.setItem("aws_region", settings.aws.region);
    localStorage.setItem("app_theme", settings.application.theme);
    alert("Configuración guardada exitosamente");
  };

  const handleResetSettings = () => {
    if (window.confirm("¿Restaurar configuración por defecto?")) {
      setSettings({
        aws: {
          accessKeyId: "",
          secretAccessKey: "",
          region: "us-east-1",
          useEnvironmentVariables: true,
        },
        application: {
          theme: "light",
          language: "es",
          itemsPerPage: 50,
          autoRefresh: true,
          refreshInterval: 300,
        },
      });
    }
  };

  const renderAWSSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center mb-6">
          <TbBrandAws className="w-6 h-6 text-orange-500 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configuración AWS S3
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useEnvironmentVariables"
              checked={settings.aws.useEnvironmentVariables}
              onChange={(e) =>
                handleInputChange(
                  "aws",
                  "useEnvironmentVariables",
                  e.target.checked
                )
              }
              className="h-4 w-4 text-primary-600 dark:text-primary-500 rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
            <label
              htmlFor="useEnvironmentVariables"
              className="ml-2 text-sm text-gray-700 dark:text-gray-300"
            >
              Usar variables de entorno del sistema
            </label>
          </div>

          {!settings.aws.useEnvironmentVariables && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Access Key ID
                </label>
                <input
                  type={showApiKey ? "text" : "password"}
                  value={settings.aws.accessKeyId}
                  onChange={(e) =>
                    handleInputChange("aws", "accessKeyId", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Secret Access Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={settings.aws.secretAccessKey}
                    onChange={(e) =>
                      handleInputChange("aws", "secretAccessKey", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {showApiKey ? (
                      <FiEyeOff className="w-5 h-5" />
                    ) : (
                      <FiEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Región AWS
            </label>
            <select
              value={settings.aws.region}
              onChange={(e) =>
                handleInputChange("aws", "region", e.target.value)
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="us-east-1">US East (N. Virginia)</option>
              <option value="us-east-2">US East (Ohio)</option>
              <option value="us-west-1">US West (N. California)</option>
              <option value="us-west-2">US West (Oregon)</option>
              <option value="eu-west-1">EU (Ireland)</option>
              <option value="eu-central-1">EU (Frankfurt)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApplicationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center mb-6">
          <FiSettings className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configuración de la Aplicación
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tema
            </label>
            <select
              value={settings.application.theme}
              onChange={(e) =>
                handleInputChange("application", "theme", e.target.value)
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
              <option value="auto">Automático</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Idioma
            </label>
            <select
              value={settings.application.language}
              onChange={(e) =>
                handleInputChange("application", "language", e.target.value)
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Elementos por página
            </label>
            <input
              type="number"
              value={settings.application.itemsPerPage}
              onChange={(e) =>
                handleInputChange(
                  "application",
                  "itemsPerPage",
                  parseInt(e.target.value) || 50
                )
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              min="10"
              max="1000"
            />
          </div>

          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={settings.application.autoRefresh}
                onChange={(e) =>
                  handleInputChange("application", "autoRefresh", e.target.checked)
                }
                className="h-4 w-4 text-primary-600 dark:text-primary-500 rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
              <label
                htmlFor="autoRefresh"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Actualización automática
              </label>
            </div>
            {settings.application.autoRefresh && (
              <div className="ml-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Intervalo (segundos)
                </label>
                <input
                  type="number"
                  value={settings.application.refreshInterval}
                  onChange={(e) =>
                    handleInputChange(
                      "application",
                      "refreshInterval",
                      parseInt(e.target.value) || 300
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="30"
                  max="3600"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configura la aplicación y tus credenciales AWS
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() =>
              window.open("https://docs.aws.amazon.com/s3/", "_blank")
            }
            className="btn btn-outline flex items-center"
          >
            <FiExternalLink className="w-4 h-4 mr-2" />
            AWS S3 Docs
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("aws")}
            className={`px-6 py-4 font-medium text-sm ${activeTab === "aws"
              ? "border-b-2 border-primary-500 text-primary-600 dark:text-primary-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
          >
            <TbBrandAws className="w-4 h-4 inline mr-2" />
            AWS S3
          </button>
          <button
            onClick={() => setActiveTab("application")}
            className={`px-6 py-4 font-medium text-sm ${activeTab === "application"
              ? "border-b-2 border-primary-500 text-primary-600 dark:text-primary-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
          >
            <FiSettings className="w-4 h-4 inline mr-2" />
            Aplicación
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "aws" && renderAWSSettings()}
          {activeTab === "application" && renderApplicationSettings()}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Guardar Configuración
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Aplica los cambios realizados</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleResetSettings}
              className="btn btn-outline flex items-center"
            >
              <FiRefreshCw className="w-4 h-4 mr-2" />
              Restaurar valores
            </button>
            <button
              onClick={handleSaveSettings}
              className="btn btn-primary flex items-center"
            >
              <FiSave className="w-4 h-4 mr-2" />
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
