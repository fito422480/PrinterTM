"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import logo1 from "../img/moneyA.png";
import logo2 from "../img/moneyB.png";
import profile from "../img/profile.png";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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

const Navbar = () => {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentTheme = theme === "system" ? systemTheme : theme;

  // Agregar console.log para depurar
  console.log("Tema actual:", currentTheme);

  return (
    <div className="bg-primary text-white py-2 px-5 flex justify-between">
      <Link href="/">
        <Image
          src={currentTheme === "dark" ? logo1 : logo2} // Asegúrate de que coincida con los valores reales
          alt="PrinterMoney"
          width={185}
        />
      </Link>

      <div className="flex items-center">
        <ThemeToggler />
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Avatar>
              <Image
                src={profile}
                alt="TM"
                width={50}
                height={50}
                className="rounded-full"
              />
              <AvatarFallback className="text-black">TM</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/profile">Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/auth">Salir</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Navbar;
