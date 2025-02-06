import { NextResponse } from "next/server";
import { readUsersFromJson } from "@/helpers/jsonDb";

export async function GET() {
  try {
    const users = await readUsersFromJson();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Błąd podczas odczytu użytkowników:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
