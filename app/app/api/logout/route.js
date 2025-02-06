import { NextResponse } from "next/server";
import { sessions } from "@/helpers/sessions";

export async function POST(request) {
  try {
    const cookieStore = request.cookies;
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (sessionToken) {
      delete sessions[sessionToken];
    }

    const response = NextResponse.json({ message: "Wylogowano pomyślnie!" });
    response.cookies.delete("sessionToken");

    return response;
  } catch (error) {
    console.error("Błąd w /api/logout:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
