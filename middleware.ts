import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Middleware para proteger las rutas
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Obtener la cookie de autenticación
  const isAuthenticated = request.cookies.get("isAuthenticated");

  // Si el usuario no está autenticado y no está en la página de /auth
  // lo redirige a la página de /auth o cualquier otra página que desees
  if (
    !isAuthenticated &&
    pathname !== "/auth" &&
    !pathname.startsWith("/api")
  ) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Si el usuario está autenticado, permite que continúe
  return NextResponse.next();
}

// Configuración del middleware para las rutas protegidas
export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/protected",
    "/profile/:id", // Usando un parámetro dinámico para /profile/:id
  ],
};
