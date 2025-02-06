import { NextResponse } from "next/server";
import { readUsersFromJson, writeUsersToJson } from "@/helpers/jsonDb";
import crypto from "crypto";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, dateOfBirth, gender} = body
    
    if (!email || !password || !name || !dateOfBirth || !gender) {
      return NextResponse.json(
        { error: "Wszystkie pola są wymagane" },
        { status: 400 }
      );
    }
    const users = await readUsersFromJson();

    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return NextResponse.json(
        { error: "Użytkownik o tym emailu już istnieje" },
        { status: 400 }
      );
    }
    const srp = require('secure-remote-password/client')
    const salt = srp.generateSalt()

    const privateKey = srp.derivePrivateKey(salt, email, password);
    const verifier = srp.deriveVerifier(privateKey);

    const newUser = {
      id: crypto.randomUUID(),
      email,
      salt,
      verifier,
      name,
      dateOfBirth,
      gender,
    };


    users.push(newUser);
    await writeUsersToJson(users);

    return NextResponse.json(
      { message: "Rejestracja powiodła się!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Błąd rejestracji:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
