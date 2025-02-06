import { NextResponse } from "next/server";
import { readUsersFromJson } from "@/helpers/jsonDb";
import srp from "secure-remote-password/server";
import { readSessionsFromJson, writeSessionsToJson } from "@/helpers/jsonSessions";

const ephemeralCache = {};

export async function POST(request) {
  try {
    const { email, clientPublicKey, clientProof } = await request.json();
    const users = await readUsersFromJson();
    const user = users.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json({ error: "Nie znaleziono użytkownika" }, { status: 401 });
    }

    if (!clientProof) {
      const serverEphemeral = srp.generateEphemeral(user.verifier);
      ephemeralCache[email] = {
        serverSecret: serverEphemeral.secret,
        createdAt: Date.now(),
      };

      return NextResponse.json({
        salt: user.salt,
        serverEphemeral: serverEphemeral.public,
      });
    }

    const ephemeralData = ephemeralCache[email];
    if (!ephemeralData) {
      return NextResponse.json({ error: "Sesja SRP wygasła. Spróbuj ponownie." }, { status: 401 });
    }

    const { serverSecret } = ephemeralData;
    const serverSession = srp.deriveSession(
      serverSecret,
      clientPublicKey,
      user.salt,
      email,
      user.verifier,
      clientProof
    );

    delete ephemeralCache[email];

    const sessionToken = serverSession.key;

    const sessions = readSessionsFromJson();
    sessions[sessionToken] = {
      email: user.email,
      loginAt: new Date().toISOString(),
    };
    writeSessionsToJson(sessions);

    const response = NextResponse.json({
      message: "Logowanie powiodło się!",
      serverProof: serverSession.proof,
    });

    response.cookies.set("sessionToken", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 60 * 60 * 24,
    });
    return response;
  } catch (error) {
    console.error("Błąd logowania SRP:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
