import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(request) {
  const protectedPaths = ["/protected"];
  const url = request.nextUrl;

  if (protectedPaths.some((path) => url.pathname.startsWith(path))) {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  return NextResponse.next();
}
