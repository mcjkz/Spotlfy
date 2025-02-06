import { NextResponse } from "next/server";
import { readSessionsFromJson } from "@/helpers/jsonSessions";

export async function GET(request) {
  try {
    const cookieStore = request.cookies;
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Brak sesji" }, { status: 401 });
    }
    const sessions = readSessionsFromJson();
    const sessionData = sessions[sessionToken];
    if (!sessionData) {
      return NextResponse.json({ error: "Nieprawidłowa sesja" }, { status: 401 });
    }
    return NextResponse.json({
      email: sessionData.email,
      loginAt: sessionData.loginAt,
    });
    
  } catch (error) {
    console.error("Błąd w /api/session:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
