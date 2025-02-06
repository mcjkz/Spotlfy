import { NextResponse } from "next/server";
import { searchSpotifyTracks } from "@/helpers/spotify";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const tracks = await searchSpotifyTracks(query);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Error fetching Spotify tracks:", error);
    return NextResponse.json({ error: "Error fetching Spotify tracks" }, { status: 500 });
  }
}
