import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/jwt";

const PROTECTED = ["/dashboard", "/finanzas", "/presupuestos", "/metas",
  "/deudas", "/tarjetas", "/negocio", "/asistente", "/reportes", "/ajustes"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const token = req.cookies.get("wf_session")?.value;
  const session = token ? await verifySession(token) : null;

  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if ((pathname === "/login" || pathname === "/register") && session) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
