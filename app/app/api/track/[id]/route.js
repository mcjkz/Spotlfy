import { NextResponse } from "next/server";
import fetch from "node-fetch";
import spotifyUrlInfo from "spotify-url-info";

const { getPreview } = spotifyUrlInfo(fetch);

export async function GET(req, {params}) {
  const {id} = await params;
  if (!id) {
    return NextResponse.json({ error: "Brak ID utworu" }, { status: 400 });
  }

  try {
    const trackUrl = `https://open.spotify.com/track/${id}`;
    const trackData = await getPreview(trackUrl);
    return NextResponse.json(trackData);
  } catch (error) {
    return NextResponse.json(
      { error: "Błąd pobierania danych z Spotify", details: error.message },
      { status: 500 }
    );
  }
}
