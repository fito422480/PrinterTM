import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Si el usuario no está autenticado y no está en la página de /auth, lo rediriges
  const isAuthenticated = false; // Cambia esto con tu lógica de autenticación

  if (!isAuthenticated && pathname !== "/auth") {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"], // Aplica el middleware en la página principal o ajusta el matcher según tus necesidades
};
