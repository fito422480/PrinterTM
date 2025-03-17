// app/(main)/profile/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import BackButton from "@/components/BackButton";

// Clave para guardar directamente la imagen de perfil activa
const ACTIVE_PROFILE_IMAGE_KEY = "active_profile_image";
const USER_DATA_KEY = "user_data";

// Definición del tipo para el usuario
interface User {
  id: string;
  nombre: string;
  username: string;
  email: string;
  imagenUrl: string;
  rol: "Admin" | "Usuario" | "Editor";
  createdAt: string;
}

// Tipo para imágenes guardadas
interface StoredImage {
  id: string;
  fileName: string;
  dataUrl: string;
  path: string;
  size: number; // tamaño en bytes
  created: string;
  isSelected: boolean;
}

// Clase para gestionar el almacenamiento de imágenes en localStorage
class ImageStorage {
  static STORAGE_KEY = "profile_images";
  static PATH_PREFIX = "/images/profile/";
  static DEFAULT_IMAGE = "/placeholder-avatar.jpg";

  // Obtener todas las imágenes guardadas
  static getImages(): StoredImage[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Error al recuperar imágenes:", e);
      return [];
    }
  }

  // Guardar una imagen
  static saveImage(file: File, userId: string, dataUrl: string): StoredImage {
    // Generar información de la imagen
    const timestamp = new Date().getTime();
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `user_${userId}_${timestamp}.${extension}`;
    const path = `${this.PATH_PREFIX}${fileName}`;

    const newImage: StoredImage = {
      id: `img_${timestamp}`,
      fileName,
      dataUrl,
      path,
      size: this.calculateSize(dataUrl),
      created: new Date().toISOString(),
      isSelected: false,
    };

    try {
      // Recuperar imágenes existentes
      const images = this.getImages();

      // Añadir la nueva imagen al principio
      const updatedImages = [newImage, ...images];

      // Guardar en localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedImages));

      return newImage;
    } catch (e) {
      console.error("Error al guardar imagen:", e);
      throw new Error(
        "No se pudo guardar la imagen en localStorage. Posiblemente se excedió el límite de almacenamiento."
      );
    }
  }

  // Seleccionar una imagen como activa
  static selectImage(imageId: string): void {
    const images = this.getImages();
    const updatedImages = images.map((img) => ({
      ...img,
      isSelected: img.id === imageId,
    }));

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedImages));
    } catch (e) {
      console.error("Error al actualizar selección:", e);
    }
  }

  // Eliminar una imagen
  static deleteImage(imageId: string): void {
    const images = this.getImages();
    const updatedImages = images.filter((img) => img.id !== imageId);

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedImages));
    } catch (e) {
      console.error("Error al eliminar imagen:", e);
    }
  }

  // Limpiar todas las imágenes
  static clearImages(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.error("Error al limpiar imágenes:", e);
    }
  }

  // Calcular tamaño aproximado en bytes
  static calculateSize(dataUrl: string): number {
    // Una estimación: cada caracter en base64 representa aproximadamente 0.75 bytes
    const base64 = dataUrl.split(",")[1];
    return base64 ? Math.round(base64.length * 0.75) : 0;
  }

  // Obtener el uso total de almacenamiento
  static getTotalStorageUsed(): number {
    const images = this.getImages();
    return images.reduce((total, img) => total + img.size, 0);
  }

  // Formatear tamaño para mostrar
  static formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  }

  // Comprimir imagen
  static async compressImage(
    dataUrl: string,
    maxWidth = 800,
    quality = 0.7
  ): Promise<string> {
    return new Promise((resolve) => {
      // Usamos el constructor de Image global del navegador, no el componente Next.js
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Redimensionar si es necesario
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir a JPEG con calidad reducida
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = dataUrl;
    });
  }
}

export default function ProfilePage() {
  // Referencia para el input de archivo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Usuario actual (simulado)
  const [usuario, setUsuario] = useState<User>({
    id: "1",
    nombre: "Juan Pérez",
    username: "jperez",
    email: "juan.perez@tigo.net.py",
    imagenUrl: ImageStorage.DEFAULT_IMAGE, // Imagen por defecto
    rol: "Admin",
    createdAt: "2024-12-10",
  });

  // Estado del formulario de perfil
  const [formData, setFormData] = useState({
    nombre: usuario.nombre,
    username: usuario.username,
    email: usuario.email,
    passwordActual: "",
    passwordNuevo: "",
    passwordConfirmar: "",
  });

  // Estado para la imagen de perfil
  const [imagenPreview, setImagenPreview] = useState<string | null>(
    usuario.imagenUrl
  );
  const [imagenFile, setImagenFile] = useState<File | null>(null);

  // Estado para gestionar modales
  const [modalOpen, setModalOpen] = useState(false);
  const [storageInfoOpen, setStorageInfoOpen] = useState(false);

  // Estado para guardar listado de imágenes
  const [storedImages, setStoredImages] = useState<StoredImage[]>([]);

  // Información de almacenamiento
  const [storageUsed, setStorageUsed] = useState<number>(0);

  // Estado para notificaciones toast
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success" as "success" | "error",
  });

  // Estado para modo carga
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);

  // Cargar imágenes guardadas al inicio
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== "undefined") {
      const images = ImageStorage.getImages();
      setStoredImages(images);

      // Calcular uso de almacenamiento
      const used = ImageStorage.getTotalStorageUsed();
      setStorageUsed(used);

      // Si hay una imagen seleccionada, establecerla como imagen de perfil
      const selectedImage = images.find((img) => img.isSelected);
      if (selectedImage) {
        setUsuario((prev) => ({
          ...prev,
          imagenUrl: selectedImage.path,
        }));
        setImagenPreview(selectedImage.dataUrl);
      }
    }
  }, []);

  // Guardar datos del usuario en localStorage para las iniciales en el avatar
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        USER_DATA_KEY,
        JSON.stringify({
          nombre: usuario.nombre,
          username: usuario.username,
          email: usuario.email,
        })
      );
    }
  }, [usuario.nombre, usuario.username, usuario.email]);

  // Mostrar toast
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000
    );
  };

  // Actualizar el formulario cuando cambia el usuario
  useEffect(() => {
    setFormData({
      nombre: usuario.nombre,
      username: usuario.username,
      email: usuario.email,
      passwordActual: "",
      passwordNuevo: "",
      passwordConfirmar: "",
    });

    // Si la imagen de perfil es una ruta guardada, cargar la imagen correspondiente
    if (usuario.imagenUrl !== ImageStorage.DEFAULT_IMAGE) {
      const storedImage = storedImages.find(
        (img) => img.path === usuario.imagenUrl
      );
      if (storedImage) {
        setImagenPreview(storedImage.dataUrl);
      } else {
        setImagenPreview(usuario.imagenUrl);
      }
    } else {
      setImagenPreview(usuario.imagenUrl);
    }
  }, [usuario, storedImages]);

  // Manejar cambios en el formulario
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Manejar clic en el área de la imagen
  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Manejar cambio de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("La imagen no debe superar los 5MB", "error");
        return;
      }

      // Validar tipo
      if (!file.type.startsWith("image/")) {
        showToast("El archivo debe ser una imagen", "error");
        return;
      }

      setImagenFile(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Eliminar imagen
  const handleRemoveImage = () => {
    setImagenPreview(ImageStorage.DEFAULT_IMAGE);
    setImagenFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Eliminar la imagen activa
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACTIVE_PROFILE_IMAGE_KEY);

      // Disparar evento y actualizar timestamp
      window.dispatchEvent(new Event("profileUpdated"));
      localStorage.setItem("profile_last_updated", Date.now().toString());
    }
  };

  // Ver imágenes subidas y abrir modal
  const viewUploadedImages = () => {
    setModalOpen(true);
  };

  // Abrir modal de información de almacenamiento
  const viewStorageInfo = () => {
    // Actualizar uso de almacenamiento
    const used = ImageStorage.getTotalStorageUsed();
    setStorageUsed(used);

    setStorageInfoOpen(true);
  };

  // Seleccionar una imagen
  const selectImage = (image: StoredImage) => {
    // Actualizar selección en localStorage
    ImageStorage.selectImage(image.id);

    // Actualizar estado
    setStoredImages((prev) =>
      prev.map((img) => ({
        ...img,
        isSelected: img.id === image.id,
      }))
    );

    // Establecer como imagen de perfil
    setImagenPreview(image.dataUrl);
    setUsuario((prev) => ({
      ...prev,
      imagenUrl: image.path,
    }));

    // Guardar la imagen directamente para acceso rápido
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_PROFILE_IMAGE_KEY, image.dataUrl);

      // Disparar evento y actualizar timestamp
      window.dispatchEvent(new Event("profileUpdated"));
      localStorage.setItem("profile_last_updated", Date.now().toString());
    }

    setModalOpen(false);
    showToast("Imagen seleccionada", "success");
  };

  // Eliminar una imagen
  const deleteStoredImage = (imageId: string) => {
    // Confirmar eliminación
    if (!confirm("¿Estás seguro de que deseas eliminar esta imagen?")) {
      return;
    }

    // Eliminar de localStorage
    ImageStorage.deleteImage(imageId);

    // Actualizar estado
    setStoredImages((prev) => prev.filter((img) => img.id !== imageId));

    // Si era la imagen seleccionada, restablecer a la imagen por defecto
    const deletedImage = storedImages.find((img) => img.id === imageId);
    if (deletedImage && deletedImage.isSelected) {
      setImagenPreview(ImageStorage.DEFAULT_IMAGE);
      setUsuario((prev) => ({
        ...prev,
        imagenUrl: ImageStorage.DEFAULT_IMAGE,
      }));

      // Eliminar la imagen activa
      if (typeof window !== "undefined") {
        localStorage.removeItem(ACTIVE_PROFILE_IMAGE_KEY);

        // Disparar evento
        window.dispatchEvent(new Event("profileUpdated"));
        localStorage.setItem("profile_last_updated", Date.now().toString());
      }
    }

    // Actualizar uso de almacenamiento
    const used = ImageStorage.getTotalStorageUsed();
    setStorageUsed(used);

    showToast("Imagen eliminada", "success");
  };

  // Limpiar todas las imágenes
  const clearAllImages = () => {
    // Confirmar eliminación
    if (
      !confirm(
        "¿Estás seguro de que deseas eliminar TODAS las imágenes guardadas? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    // Limpiar localStorage
    ImageStorage.clearImages();

    // Actualizar estado
    setStoredImages([]);
    setStorageUsed(0);

    // Restablecer imagen de perfil
    setImagenPreview(ImageStorage.DEFAULT_IMAGE);
    setUsuario((prev) => ({
      ...prev,
      imagenUrl: ImageStorage.DEFAULT_IMAGE,
    }));

    // Eliminar la imagen activa
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACTIVE_PROFILE_IMAGE_KEY);

      // Disparar evento
      window.dispatchEvent(new Event("profileUpdated"));
      localStorage.setItem("profile_last_updated", Date.now().toString());
    }

    setStorageInfoOpen(false);
    showToast("Todas las imágenes fueron eliminadas", "success");
  };

  // Guardar imagen en localStorage
  const saveImageToStorage = async (
    file: File,
    dataUrl: string
  ): Promise<StoredImage> => {
    setCompressing(true);
    try {
      // Comprimir imagen para reducir tamaño
      const compressedDataUrl = await ImageStorage.compressImage(
        dataUrl,
        800,
        0.7
      );

      // Guardar en localStorage
      const savedImage = ImageStorage.saveImage(
        file,
        usuario.id,
        compressedDataUrl
      );

      // Actualizar estado
      setStoredImages((prev) => [savedImage, ...prev]);

      // Actualizar uso de almacenamiento
      const used = ImageStorage.getTotalStorageUsed();
      setStorageUsed(used);

      // Guardar la imagen activa directamente para acceso rápido
      if (typeof window !== "undefined") {
        localStorage.setItem(ACTIVE_PROFILE_IMAGE_KEY, compressedDataUrl);

        // Disparar evento para notificar a otros componentes
        window.dispatchEvent(new Event("profileUpdated"));
        localStorage.setItem("profile_last_updated", Date.now().toString());
      }

      return savedImage;
    } catch (error) {
      console.error("Error al guardar imagen:", error);
      throw error;
    } finally {
      setCompressing(false);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validar que las contraseñas coincidan si se están cambiando
    if (formData.passwordNuevo) {
      if (formData.passwordNuevo !== formData.passwordConfirmar) {
        showToast("Las contraseñas nuevas no coinciden", "error");
        setLoading(false);
        return;
      }

      if (!formData.passwordActual) {
        showToast("Debes ingresar tu contraseña actual", "error");
        setLoading(false);
        return;
      }

      // Validar longitud
      if (formData.passwordNuevo.length < 8) {
        showToast("La contraseña debe tener al menos 8 caracteres", "error");
        setLoading(false);
        return;
      }
    }

    try {
      // Procesar imagen si hay una nueva
      let nuevaImagenUrl = usuario.imagenUrl;

      if (imagenFile && imagenPreview) {
        try {
          // Guardar en localStorage
          const savedImage = await saveImageToStorage(
            imagenFile,
            imagenPreview
          );

          // Marcar como seleccionada
          ImageStorage.selectImage(savedImage.id);

          // Actualizar todas las imágenes
          setStoredImages((prev) =>
            prev.map((img) => ({
              ...img,
              isSelected: img.id === savedImage.id,
            }))
          );

          nuevaImagenUrl = savedImage.path;
        } catch (error: any) {
          showToast(error.message || "Error al guardar la imagen", "error");
          setLoading(false);
          return;
        }
      }

      // Simulamos una llamada API con un timeout para actualizar el perfil
      setTimeout(() => {
        // Actualizar usuario (en un caso real, esto sería una llamada API)
        setUsuario({
          ...usuario,
          nombre: formData.nombre,
          username: formData.username,
          email: formData.email,
          imagenUrl: nuevaImagenUrl,
        });

        // Limpiar campos de contraseña
        setFormData({
          ...formData,
          passwordActual: "",
          passwordNuevo: "",
          passwordConfirmar: "",
        });

        setLoading(false);
        showToast("Perfil actualizado correctamente", "success");
      }, 1000);
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      setLoading(false);
      showToast("Error al actualizar el perfil", "error");
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Back Button */}
      <BackButton text="Atrás" link="/" />

      <div className="mt-10">
        <h3 className="text-2xl font-semibold mb-6">Configuración de Perfil</h3>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Imagen de perfil circular */}
                <div className="md:col-span-1 flex flex-col items-center">
                  <div className="flex flex-col items-center justify-center mb-6">
                    {/* Círculo exterior con borde gradiente y efecto de degradado */}
                    <div className="relative w-40 h-40 rounded-full p-1 bg-gradient-to-r from-blue-900 to-gray-300">
                      {/* Círculo interior con la imagen */}
                      <div
                        className="w-full h-full rounded-full overflow-hidden cursor-pointer border-2 border-white bg-gradient-to-r from-blue-900 to-gray-300"
                        onClick={handleImageClick}
                      >
                        {imagenPreview ? (
                          <>
                            <div className="relative w-full h-full overflow-hidden">
                              <Image
                                src={imagenPreview}
                                alt="Foto de perfil"
                                fill
                                sizes="(max-width: 768px) 100vw, 160px"
                                style={{
                                  objectFit: "cover",
                                  objectPosition: "center center",
                                }}
                                unoptimized={imagenPreview.startsWith("data:")}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition-all">
                                <span className="text-white opacity-0 hover:opacity-100 font-medium z-20">
                                  Cambiar foto
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-center font-medium">
                              Foto de perfil
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nombre de usuario debajo de la imagen */}
                    <div className="mt-3 text-center">
                      <h4 className="font-bold text-lg">{usuario.nombre}</h4>
                      <p className="text-gray-500">@{usuario.username}</p>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />

                  <div className="space-y-2 w-full">
                    <button
                      type="button"
                      onClick={handleImageClick}
                      className="w-full px-4 py-2 bg-primary text-white rounded hover:bg-secondary"
                    >
                      Cambiar Imagen
                    </button>

                    {imagenPreview &&
                      imagenPreview !== ImageStorage.DEFAULT_IMAGE && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="w-full px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50"
                        >
                          Eliminar Imagen
                        </button>
                      )}

                    {/* Botón para ver imágenes guardadas */}
                    <button
                      type="button"
                      onClick={viewUploadedImages}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 mt-2 flex items-center justify-center"
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
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8h16"
                        />
                      </svg>
                      Galería de Imágenes ({storedImages.length})
                    </button>

                    {/* Botón para ver información de almacenamiento */}
                    <button
                      type="button"
                      onClick={viewStorageInfo}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center justify-center"
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
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Almacenamiento ({ImageStorage.formatSize(storageUsed)})
                    </button>
                  </div>

                  <div className="mt-4 text-sm text-gray-500 text-center">
                    <p>Tamaño máximo: 5MB</p>
                    <p>Formatos: JPG, PNG, GIF</p>
                    <p className="mt-2 text-xs">
                      Las imágenes se guardan en localStorage del navegador.
                    </p>
                  </div>
                </div>

                {/* Información personal */}
                <div className="md:col-span-2">
                  <h4 className="text-lg font-semibold mb-4">
                    Información Personal
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="uppercase text-xs font-bold text-black block mb-2">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        className="bg-slate-100 border-0 focus:ring-0 w-full p-2 rounded text-black"
                        required
                      />
                    </div>

                    <div>
                      <label className="uppercase text-xs font-bold text-black block mb-2">
                        Nombre de Usuario
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="bg-slate-100 border-0 focus:ring-0 w-full p-2 rounded text-black"
                        required
                      />
                    </div>

                    <div>
                      <label className="uppercase text-xs font-bold text-black block mb-2">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="bg-slate-100 border-0 focus:ring-0 w-full p-2 rounded text-black"
                        required
                      />
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-lg font-semibold mb-4">
                        Cambiar Contraseña
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <label className="uppercase text-xs font-bold text-black block mb-2">
                            Contraseña Actual
                          </label>
                          <input
                            type="password"
                            name="passwordActual"
                            value={formData.passwordActual}
                            onChange={handleInputChange}
                            className="bg-slate-100 border-0 focus:ring-0 w-full p-2 rounded text-black"
                          />
                        </div>

                        <div>
                          <label className="uppercase text-xs font-bold text-black block mb-2">
                            Nueva Contraseña
                          </label>
                          <input
                            type="password"
                            name="passwordNuevo"
                            value={formData.passwordNuevo}
                            onChange={handleInputChange}
                            className="bg-slate-100 border-0 focus:ring-0 w-full p-2 rounded text-black"
                          />
                        </div>

                        <div>
                          <label className="uppercase text-xs font-bold text-black block mb-2">
                            Confirmar Nueva Contraseña
                          </label>
                          <input
                            type="password"
                            name="passwordConfirmar"
                            value={formData.passwordConfirmar}
                            onChange={handleInputChange}
                            className="bg-slate-100 border-0 focus:ring-0 w-full p-2 rounded text-black"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center pt-4">
                      <span className="text-sm text-gray-500 mr-2">
                        Miembro desde:{" "}
                        {new Date(usuario.createdAt).toLocaleDateString()}
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {usuario.rol}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || compressing}
                  className={`px-6 py-2 bg-primary text-white rounded hover:bg-secondary ${
                    loading || compressing
                      ? "opacity-70 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {loading
                    ? "Guardando..."
                    : compressing
                    ? "Procesando imagen..."
                    : "Guardar Cambios"}
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

      {/* Modal para ver imágenes guardadas */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Galería de Imágenes</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-grow">
              {storedImages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay imágenes guardadas. Sube una imagen para comenzar tu
                  galería.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {storedImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <div
                        onClick={() => selectImage(image)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${
                          image.isSelected
                            ? "border-primary"
                            : "border-gray-200 hover:border-primary"
                        }`}
                      >
                        <Image
                          src={image.dataUrl}
                          alt={`Imagen ${image.fileName}`}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          style={{ objectFit: "cover" }}
                          unoptimized
                        />

                        {/* Marca de seleccionada */}
                        {image.isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Información de la imagen */}
                      <div className="mt-1 text-xs text-gray-500">
                        <p className="truncate" title={image.fileName}>
                          {image.fileName}
                        </p>
                        <p>
                          {ImageStorage.formatSize(image.size)} •{" "}
                          {new Date(image.created).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Botón eliminar */}
                      <button
                        onClick={() => deleteStoredImage(image.id)}
                        className="absolute top-2 left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar imagen"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-between">
              <span className="text-sm text-gray-500">
                {storedImages.length} imágenes •{" "}
                {ImageStorage.formatSize(storageUsed)} usados
              </span>
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para información de almacenamiento */}
      {storageInfoOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full flex flex-col">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">
                Información de Almacenamiento
              </h3>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Espacio utilizado:
                  </p>
                  <p className="text-2xl font-bold">
                    {ImageStorage.formatSize(storageUsed)}
                  </p>

                  <div className="mt-2 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${Math.min(
                          (storageUsed / (5 * 1024 * 1024)) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Los navegadores suelen tener un límite de 5-10MB para
                    localStorage
                  </p>
                </div>

                <div className="pt-4">
                  <p className="text-sm font-medium text-gray-700">
                    Imágenes guardadas:
                  </p>
                  <p className="text-2xl font-bold">{storedImages.length}</p>
                </div>

                <div className="pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Acerca del almacenamiento local:
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      • Las imágenes se guardan en el localStorage del navegador
                    </li>
                    <li>
                      • Solo están disponibles en este navegador y dispositivo
                    </li>
                    <li>• Si limpias los datos del navegador, se perderán</li>
                    <li>
                      • Las imágenes se comprimen para ocupar menos espacio
                    </li>
                  </ul>
                </div>

                <div className="pt-4">
                  <button
                    onClick={clearAllImages}
                    className="w-full px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50 flex items-center justify-center"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Eliminar Todas las Imágenes
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setStorageInfoOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
