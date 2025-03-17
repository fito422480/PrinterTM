// components/UserAvatar.tsx
"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Clave para guardar directamente la imagen de perfil activa
const ACTIVE_PROFILE_IMAGE_KEY = "active_profile_image";
const USER_DATA_KEY = "user_data";

// Clase utilitaria para gestionar la imagen del perfil
class ProfileImageStorage {
  static DEFAULT_IMAGE = "/placeholder-avatar.jpg";

  // Obtener la imagen de perfil activa directamente de localStorage
  static getActiveProfileImage(): string | null {
    try {
      if (typeof window === "undefined") return null;

      // Intentar obtener la imagen activa directamente
      const activeImage = localStorage.getItem(ACTIVE_PROFILE_IMAGE_KEY);
      if (activeImage) return activeImage;

      // Si no hay imagen activa guardada, usar la imagen predeterminada
      return this.DEFAULT_IMAGE;
    } catch (e) {
      console.error("Error al recuperar imagen de perfil:", e);
      return this.DEFAULT_IMAGE;
    }
  }

  // Obtener iniciales del nombre de usuario
  static getUserInitials(): string {
    try {
      if (typeof window === "undefined") return "U";

      // Intentar obtener el nombre de usuario del localStorage
      const userData = localStorage.getItem(USER_DATA_KEY);
      if (!userData) return "U";

      const user = JSON.parse(userData);
      if (!user.nombre) return "U";

      // Extraer iniciales
      const nameParts = user.nombre.split(" ");
      if (nameParts.length === 1) {
        return nameParts[0].charAt(0).toUpperCase();
      } else {
        return (
          nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
        ).toUpperCase();
      }
    } catch (e) {
      return "U";
    }
  }

  // Establecer una imagen como la imagen de perfil activa
  static setActiveProfileImage(imageDataUrl: string): void {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(ACTIVE_PROFILE_IMAGE_KEY, imageDataUrl);
      }
    } catch (e) {
      console.error("Error al guardar imagen de perfil activa:", e);
    }
  }
}

interface UserAvatarProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  onClickAvatar?: () => void;
}

const UserAvatar = ({
  className = "",
  size = "md",
  onClickAvatar,
}: UserAvatarProps) => {
  // Estado para la imagen de perfil
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [initials, setInitials] = useState<string>("U");
  const [isClient, setIsClient] = useState(false);

  // Tamaños de avatar
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };

  // Cargar imagen de perfil
  const loadProfileImage = () => {
    const image = ProfileImageStorage.getActiveProfileImage();
    setProfileImage(image);

    const userInitials = ProfileImageStorage.getUserInitials();
    setInitials(userInitials);
  };

  // Escuchar cambios en el localStorage para actualizar el avatar
  useEffect(() => {
    setIsClient(true);

    // Cargar la imagen inicial
    loadProfileImage();

    // Función para manejar cambios en el almacenamiento
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === ACTIVE_PROFILE_IMAGE_KEY ||
        e.key === USER_DATA_KEY ||
        e.key === "profile_images" ||
        e.key === "profile_last_updated"
      ) {
        loadProfileImage();
      }
    };

    // Función para manejar eventos personalizados
    const handleProfileUpdate = () => {
      loadProfileImage();
    };

    // Añadir oyentes para eventos
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("profileUpdated", handleProfileUpdate);

    // Verificar cambios cada 2 segundos (solución alternativa)
    const intervalId = setInterval(loadProfileImage, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("profileUpdated", handleProfileUpdate);
      clearInterval(intervalId);
    };
  }, []);

  // Para prevenir errores de hidratación
  if (!isClient) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarFallback className="bg-primary text-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar
      className={`${sizeClasses[size]} ${className} ${
        onClickAvatar ? "cursor-pointer" : ""
      }`}
      onClick={onClickAvatar}
    >
      {profileImage && profileImage !== ProfileImageStorage.DEFAULT_IMAGE ? (
        <AvatarImage
          src={profileImage}
          alt="Foto de perfil"
          width={96}
          height={96}
        />
      ) : null}

      <AvatarFallback className="bg-primary text-primary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
