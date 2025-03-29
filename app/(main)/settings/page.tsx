// app/(main)/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import BackButton from "@/components/BackButton";

// Definición del tipo para las configuraciones
interface Settings {
  notificaciones: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacidad: {
    perfilPublico: boolean;
    mostrarEstadoConexion: boolean;
    permitirMenciones: boolean;
  };
  interfaz: {
    tema: "Amarillo" | "Azul" | "sistema";
    colorPrimario: string;
    densidad: "compacta" | "normal" | "espaciada";
  };
  idioma: string;
  moneda: string;
  husoHorario: string;
}

interface SavedSettings {
  id: string;
  fecha: string;
  configuracion: Settings;
}

// Clase para gestionar las configuraciones guardadas en localStorage
class SettingsStorage {
  static STORAGE_KEY = "app_settings";
  static HISTORY_KEY = "app_settings_history";

  // Obtener configuración actual
  static getSettings(): Settings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultSettings();
    } catch (e) {
      console.error("Error al recuperar configuraciones:", e);
      return this.getDefaultSettings();
    }
  }

  // Guardar configuración
  static saveSettings(settings: Settings): void {
    try {
      // Guardar configuración actual
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));

      // Guardar en historial
      const timestamp = new Date().toISOString();
      const savedSettings: SavedSettings = {
        id: `settings_${timestamp}`,
        fecha: timestamp,
        configuracion: { ...settings },
      };

      const history = this.getSettingsHistory();
      const updatedHistory = [savedSettings, ...history].slice(0, 10); // Mantener solo las últimas 10 configuraciones
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Error al guardar configuraciones:", e);
    }
  }

  // Obtener historial de configuraciones
  static getSettingsHistory(): SavedSettings[] {
    try {
      const stored = localStorage.getItem(this.HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Error al recuperar historial de configuraciones:", e);
      return [];
    }
  }

  // Restaurar configuración desde historial
  static restoreSettings(settingsId: string): Settings | null {
    try {
      const history = this.getSettingsHistory();
      const savedSettings = history.find((item) => item.id === settingsId);

      if (savedSettings) {
        // Guardar como configuración actual
        localStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(savedSettings.configuracion)
        );
        return savedSettings.configuracion;
      }

      return null;
    } catch (e) {
      console.error("Error al restaurar configuraciones:", e);
      return null;
    }
  }

  // Exportar configuraciones a JSON
  static exportSettings(): string {
    const settings = this.getSettings();
    return JSON.stringify(settings, null, 2);
  }

  // Importar configuraciones desde JSON
  static importSettings(jsonText: string): Settings | null {
    try {
      const settings = JSON.parse(jsonText) as Settings;
      this.saveSettings(settings);
      return settings;
    } catch (e) {
      console.error("Error al importar configuraciones:", e);
      return null;
    }
  }

  // Restablecer configuraciones por defecto
  static resetSettings(): Settings {
    const defaultSettings = this.getDefaultSettings();
    this.saveSettings(defaultSettings);
    return defaultSettings;
  }

  // Obtener configuraciones por defecto
  static getDefaultSettings(): Settings {
    return {
      notificaciones: {
        email: true,
        push: true,
        sms: false,
      },
      privacidad: {
        perfilPublico: true,
        mostrarEstadoConexion: true,
        permitirMenciones: true,
      },
      interfaz: {
        tema: "sistema",
        colorPrimario: "#001950", // blue-500
        densidad: "normal",
      },
      idioma: "es",
      moneda: "Gs.",
      husoHorario: "America/Asuncion",
    };
  }
}

export default function SettingsPage() {
  // Disponibilidad de localStorage
  const [isClient, setIsClient] = useState(false);

  // Configuraciones
  const [settings, setSettings] = useState<Settings>(
    SettingsStorage.getDefaultSettings()
  );

  // Estado para historia de configuraciones
  const [settingsHistory, setSettingsHistory] = useState<SavedSettings[]>([]);

  // Estados para modales
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Estado para importación
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  // Estado para notificaciones toast
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success" as "success" | "error",
  });

  // Estado para modo carga
  const [loading, setLoading] = useState(false);

  // Verificar si estamos en el cliente y cargar configuraciones
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      // Cargar configuraciones
      const savedSettings = SettingsStorage.getSettings();
      setSettings(savedSettings);

      // Cargar historial
      const history = SettingsStorage.getSettingsHistory();
      setSettingsHistory(history);
    }
  }, []);

  // Mostrar toast
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000
    );
  };

  // Manejar cambios en las notificaciones
  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSettings({
      ...settings,
      notificaciones: {
        ...settings.notificaciones,
        [name]: checked,
      },
    });
  };

  // Manejar cambios en la privacidad
  const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSettings({
      ...settings,
      privacidad: {
        ...settings.privacidad,
        [name]: checked,
      },
    });
  };

  // Manejar cambios en la interfaz
  const handleInterfaceChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      interfaz: {
        ...settings.interfaz,
        [name]: value,
      },
    });
  };

  // Manejar cambios en configuraciones generales
  const handleGeneralChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value,
    });
  };

  // Restaurar configuraciones desde historial
  const restoreSettings = (settingsId: string) => {
    const restoredSettings = SettingsStorage.restoreSettings(settingsId);
    if (restoredSettings) {
      setSettings(restoredSettings);
      setHistoryModalOpen(false);
      showToast("Configuración restaurada correctamente", "success");
    } else {
      showToast("Error al restaurar la configuración", "error");
    }
  };

  // Importar configuraciones
  const importSettings = () => {
    try {
      setImportError("");
      const importedSettings = SettingsStorage.importSettings(importText);

      if (importedSettings) {
        setSettings(importedSettings);
        setImportModalOpen(false);
        setImportText("");
        showToast("Configuración importada correctamente", "success");
      } else {
        setImportError(
          "No se pudo importar la configuración. Formato incorrecto."
        );
      }
    } catch (error) {
      setImportError(
        "Error al importar la configuración. Verifique el formato JSON."
      );
    }
  };

  // Exportar configuraciones
  const exportSettings = () => {
    const exportText = SettingsStorage.exportSettings();
    navigator.clipboard
      .writeText(exportText)
      .then(() => {
        showToast("Configuración copiada al portapapeles", "success");
      })
      .catch(() => {
        showToast("Error al copiar al portapapeles", "error");
      });
  };

  // Restablecer configuraciones por defecto
  const resetSettings = () => {
    if (
      confirm(
        "¿Estás seguro de que deseas restablecer todas las configuraciones a los valores predeterminados?"
      )
    ) {
      const defaultSettings = SettingsStorage.resetSettings();
      setSettings(defaultSettings);
      showToast(
        "Configuraciones restablecidas a valores predeterminados",
        "success"
      );
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Guardar configuraciones
      SettingsStorage.saveSettings(settings);

      // Actualizar historial
      const history = SettingsStorage.getSettingsHistory();
      setSettingsHistory(history);

      // Simulamos una llamada API con un timeout
      setTimeout(() => {
        setLoading(false);
        showToast("Configuración guardada correctamente", "success");
      }, 1000);
    } catch (error) {
      console.error("Error al guardar configuraciones:", error);
      setLoading(false);
      showToast("Error al guardar la configuración", "error");
    }
  };

  // Si no estamos en el cliente, mostrar un skeleton
  if (!isClient) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mb-6"></div>
        <div className="h-10 w-60 bg-gray-200 animate-pulse rounded mb-6"></div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-8 w-40 bg-gray-200 animate-pulse rounded mb-4"></div>
          <div className="h-60 bg-gray-100 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Back Button */}
      <BackButton text="Atrás" link="/" />

      <div className="mt-10">
        <h3 className="text-2xl font-semibold mb-6">Configuración General</h3>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Menú lateral de navegación */}
                <div className="md:col-span-1">
                  <div className="space-y-2 sticky top-6">
                    <a
                      href="#notificaciones"
                      className="block p-3 bg-slate-100 rounded hover:bg-slate-200"
                    >
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                          />
                        </svg>
                        <span className="font-medium">Notificaciones</span>
                      </div>
                    </a>

                    <a
                      href="#privacidad"
                      className="block p-3 bg-slate-100 rounded hover:bg-slate-200"
                    >
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        <span className="font-medium">Privacidad</span>
                      </div>
                    </a>

                    <a
                      href="#interfaz"
                      className="block p-3 bg-slate-100 rounded hover:bg-slate-200"
                    >
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                          />
                        </svg>
                        <span className="font-medium">Interfaz</span>
                      </div>
                    </a>

                    <a
                      href="#general"
                      className="block p-3 bg-slate-100 rounded hover:bg-slate-200"
                    >
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="font-medium">General</span>
                      </div>
                    </a>

                    <a
                      href="#data"
                      className="block p-3 bg-slate-100 rounded hover:bg-slate-200"
                    >
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                          />
                        </svg>
                        <span className="font-medium">Datos</span>
                      </div>
                    </a>

                    <button
                      type="button"
                      onClick={() => setHistoryModalOpen(true)}
                      className="w-full p-3 mt-6 flex items-center justify-center border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Historial
                    </button>
                  </div>
                </div>

                {/* Configuraciones */}
                <div className="md:col-span-2 space-y-8">
                  {/* Notificaciones */}
                  <section id="notificaciones" className="scroll-mt-6">
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      Notificaciones
                    </h4>

                    <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">
                            Notificaciones por Correo Electrónico
                          </h5>
                          <p className="text-sm text-gray-500">
                            Recibir notificaciones y actualizaciones por correo
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="email"
                            className="sr-only peer"
                            checked={settings.notificaciones.email}
                            onChange={handleNotificationChange}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">Notificaciones Push</h5>
                          <p className="text-sm text-gray-500">
                            Recibir notificaciones en el navegador o dispositivo
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="push"
                            className="sr-only peer"
                            checked={settings.notificaciones.push}
                            onChange={handleNotificationChange}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">Notificaciones SMS</h5>
                          <p className="text-sm text-gray-500">
                            Recibir notificaciones importantes por SMS
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="sms"
                            className="sr-only peer"
                            checked={settings.notificaciones.sms}
                            onChange={handleNotificationChange}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>
                  </section>

                  {/* Privacidad */}
                  <section id="privacidad" className="pt-4 scroll-mt-6">
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Privacidad
                    </h4>

                    <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">Perfil Público</h5>
                          <p className="text-sm text-gray-500">
                            Permitir que otros usuarios vean tu perfil
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="perfilPublico"
                            className="sr-only peer"
                            checked={settings.privacidad.perfilPublico}
                            onChange={handlePrivacyChange}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">
                            Mostrar Estado de Conexión
                          </h5>
                          <p className="text-sm text-gray-500">
                            Permitir que otros vean cuándo estás en línea
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="mostrarEstadoConexion"
                            className="sr-only peer"
                            checked={settings.privacidad.mostrarEstadoConexion}
                            onChange={handlePrivacyChange}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">Permitir Menciones</h5>
                          <p className="text-sm text-gray-500">
                            Permitir que otros usuarios te mencionen
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="permitirMenciones"
                            className="sr-only peer"
                            checked={settings.privacidad.permitirMenciones}
                            onChange={handlePrivacyChange}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>
                  </section>

                  {/* Interfaz */}
                  <section id="interfaz" className="pt-4 scroll-mt-6">
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                        />
                      </svg>
                      Interfaz
                    </h4>

                    <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                      <div>
                        <label className="font-medium block mb-2">Tema</label>
                        <select
                          name="tema"
                          value={settings.interfaz.tema}
                          onChange={handleInterfaceChange}
                          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        >
                          <option value="Amarillo">Amarillo</option>
                          <option value="Azul">Azul</option>
                          <option value="sistema">
                            Usar configuración del sistema
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="font-medium block mb-2">
                          Color Primario
                        </label>
                        <div className="flex items-center">
                          <input
                            type="color"
                            name="colorPrimario"
                            value={settings.interfaz.colorPrimario}
                            onChange={handleInterfaceChange}
                            className="w-10 h-10 rounded mr-2"
                          />
                          <input
                            type="text"
                            name="colorPrimario"
                            value={settings.interfaz.colorPrimario}
                            onChange={handleInterfaceChange}
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary w-32 p-2.5"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-medium block mb-2">
                          Densidad de Contenido
                        </label>
                        <select
                          name="densidad"
                          value={settings.interfaz.densidad}
                          onChange={handleInterfaceChange}
                          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        >
                          <option value="compacta">Compacta</option>
                          <option value="normal">Normal</option>
                          <option value="espaciada">Espaciada</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* General */}
                  <section id="general" className="pt-4 scroll-mt-6">
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      General
                    </h4>

                    <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                      <div>
                        <label className="font-medium block mb-2">Idioma</label>
                        <select
                          name="idioma"
                          value={settings.idioma}
                          onChange={handleGeneralChange}
                          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        >
                          <option value="es">Español</option>
                          <option value="en">English</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-medium block mb-2">Moneda</label>
                        <select
                          name="moneda"
                          value={settings.moneda}
                          onChange={handleGeneralChange}
                          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        >
                          <option value="Gs">Guaranies (Gs.)</option>
                          <option value="USD">US Dollar (USD)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-medium block mb-2">
                          Uso Horario
                        </label>
                        <select
                          name="husoHorario"
                          value={settings.husoHorario}
                          onChange={handleGeneralChange}
                          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        >
                          <option value="America/Asuncion">
                            Ciudad de Asuncion (UTC-4)
                          </option>
                          <option value="America/New_York">
                            New York (UTC-5)
                          </option>
                          <option value="Europe/London">London (UTC+0)</option>
                          <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Datos */}
                  <section id="data" className="pt-4 scroll-mt-6">
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                        />
                      </svg>
                      Datos
                    </h4>

                    <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                      <div className="flex flex-col space-y-2">
                        <button
                          type="button"
                          onClick={() => setImportModalOpen(true)}
                          className="flex items-center justify-center p-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"
                            />
                          </svg>
                          Importar Configuración
                        </button>

                        <button
                          type="button"
                          onClick={() => setExportModalOpen(true)}
                          className="flex items-center justify-center p-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          Exportar Configuración
                        </button>

                        <button
                          type="button"
                          onClick={resetSettings}
                          className="flex items-center justify-center p-2 border border-red-300 rounded text-red-600 hover:bg-red-50"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Restablecer a Valores Predeterminados
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 bg-primary text-white rounded hover:bg-secondary ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Toast de notificación */}
      {toast.show && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg ${
            toast.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Modal para ver historial de configuraciones */}
      {historyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Historial de Configuraciones
              </h3>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-grow">
              {settingsHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay historial de configuraciones guardadas.
                </div>
              ) : (
                <div className="space-y-3">
                  {settingsHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 border rounded hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-medium">Configuración guardada</p>
                        <p className="text-sm text-gray-500">
                          {new Date(item.fecha).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => restoreSettings(item.id)}
                        className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-secondary"
                      >
                        Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para importar configuración */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full flex flex-col">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Importar Configuración</h3>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Pega el código JSON de configuración exportado previamente:
                </p>

                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full h-40 p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                  placeholder='{"notificaciones": {...}, "privacidad": {...}, ...}'
                ></textarea>

                {importError && (
                  <div className="text-red-500 text-sm">{importError}</div>
                )}
              </div>
            </div>

            <div className="p-4 border-t flex justify-between">
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setImportText("");
                  setImportError("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>

              <button
                onClick={importSettings}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-secondary"
              >
                Importar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para exportar configuración */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full flex flex-col">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Exportar Configuración</h3>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Tu configuración en formato JSON. Cópiala y guárdala para
                  importarla más tarde:
                </p>

                <div className="w-full h-40 p-2 border border-gray-300 rounded bg-gray-50 overflow-auto">
                  <pre className="text-xs">
                    {JSON.stringify(settings, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-between">
              <button
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cerrar
              </button>

              <button
                onClick={exportSettings}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-secondary flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                Copiar al Portapapeles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
