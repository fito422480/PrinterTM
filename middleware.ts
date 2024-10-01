import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Obtener la cookie de autenticación (si es que la has guardado en una cookie después de iniciar sesión con Azure AD)
  const isAuthenticated = request.cookies.get("isAuthenticated");

  // Si el usuario no está autenticado y no está en la página de /auth, lo rediriges
  if (!isAuthenticated && pathname !== "/auth") {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Si el usuario está autenticado, permite que continúe
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard", "/protected"], // Aplica el middleware en las rutas protegidas
};
