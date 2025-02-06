import { getPopularArtists, getPopularAlbums, getPopularTracks } from "../../../helpers/spotify";

export async function GET(request) {
  try {

    const [artists, albums, tracks] = await Promise.all([
      getPopularArtists(),
      getPopularAlbums(),
      getPopularTracks(),
    ]);

    if (!artists.length && !albums.length && !tracks.length) {
      console.error("API zwróciło niepełne dane.");
      return new Response(JSON.stringify({ error: "API zwróciło niepełne dane." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ artists, albums, tracks }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error fetching popular data:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch popular data" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
