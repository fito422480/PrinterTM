"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import logo1 from "../img/moneyA.png";
import logo2 from "../img/moneyB.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggler from "@/components/ThemeToggler";
import { useTheme } from "next-themes";
import { Bell } from "lucide-react";
// Importamos nuestro componente UserAvatar mejorado
import UserAvatar from "./userAvatar";

const Navbar = () => {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now()); // Clave para forzar re-renderizado

  useEffect(() => {
    setMounted(true);

    // Configurar un oyente para detectar cambios en el perfil
    const handleProfileUpdate = () => {
      // Forzar re-renderizado del avatar cambiando su key
      setAvatarKey(Date.now());
    };

    // Añadir oyentes para eventos
    window.addEventListener("profileUpdated", handleProfileUpdate);

    // Verificar cambios en localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "active_profile_image" ||
        e.key === "profile_last_updated"
      ) {
        handleProfileUpdate();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  if (!mounted) return null;

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <div className="bg-primary text-white py-2 px-5 flex justify-between">
      <Link href="/">
        <Image
          src={currentTheme === "dark" ? logo1 : logo2}
          alt="PrinterMoney"
          width={185}
        />
      </Link>

      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none mr-4">
            <div className="relative">
              <Bell className="h-5 w-5 text-primary-foreground/90 hover:text-white transition-colors cursor-pointer" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              <DropdownMenuItem className="cursor-pointer flex flex-col items-start gap-1 p-3">
                <div className="font-semibold text-sm">Bienvenido</div>
                <div className="text-xs text-muted-foreground">
                  Sistema actualizado a v0.1.0
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer flex flex-col items-start gap-1 p-3">
                <div className="font-semibold text-sm">Alerta de Sistema</div>
                <div className="text-xs text-muted-foreground">
                  Revisar documentos rechazados recientemente.
                </div>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center justify-center text-xs text-muted-foreground cursor-pointer">
              Marcar todas como leídas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggler />
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            {/* 
              Usamos key={avatarKey} para forzar el re-renderizado cuando 
              se actualiza la imagen de perfil
            */}
            <UserAvatar
              key={avatarKey}
              size="md"
              className="border-2 border-white"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/profile" className="w-full">
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/settings" className="w-full">
                Configuración
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/auth" className="w-full">
                Salir
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Navbar;
