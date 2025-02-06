import { NextResponse } from "next/server";
import { readUsersFromJson } from "@/helpers/jsonDb";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email jest wymagany." },
        { status: 400 }
      );
    }

    const users = await readUsersFromJson();
    const existingUser = users.find((u) => u.email === email);

    if (existingUser) {
      return NextResponse.json(
        { exists: true, message: "Ten email jest już zarejestrowany." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { exists: false, message: "Email jest dostępny." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Błąd sprawdzania e-maila:", error);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
