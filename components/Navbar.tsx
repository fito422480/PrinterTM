import Image from "next/image";
import Link from "next/link";
import logo from "../img/money.png";
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
// import ThemeToggler from "@/components/ThemeToggler";

const Navbar = () => {
  return (
    <div className="bg-primary dark:bg-slate-700 text-white py-2 px-5 flex justify-between">
      <Link href="/">
        <Image src={logo} alt="PrinterMoney" width={185} />
      </Link>

      <div className="flex items-center">
        {/* <ThemeToggler /> */}
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Avatar>
              {/* <AvatarImage src="/img/profile.png" alt="@shadcn" /> */}
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
