import querystring from "querystring";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

let accessToken = null;

export async function getSpotifyAccessToken() {
  if (accessToken) return accessToken;

  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: querystring.stringify({
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd pobierania tokena: ${response.status} - ${response.statusText} | ${errorText}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    return accessToken;
  } catch (error) {
    console.error("Błąd w getSpotifyAccessToken:", error.message);
    return null;
  }
}

export async function searchSpotifyTracks(query) {
  try {
    const token = await getSpotifyAccessToken();
    if (!token) throw new Error("Brak tokena dostępu do Spotify");

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=4`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Błąd API Spotify: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data.tracks.items;
  } catch (error) {
    console.error("Błąd w searchSpotifyTracks:", error.message);
    return [];
  }
}

export async function getPopularArtists() {
  try {
    const token = await getSpotifyAccessToken();
    if (!token) throw new Error("Brak tokena dostępu do Spotify");

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=a&type=artist&limit=6`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Błąd Spotify API (artists):", errorText);
      return [];
    }

    const data = await response.json();
    
    const sortedArtists = data.artists.items.sort((a, b) => b.popularity - a.popularity);
    const topArtists = sortedArtists.slice(0, 10);
    return topArtists;
  } catch (error) {
    console.error("Błąd w getPopularArtists:", error.message);
    return [];
  }
}


export async function getPopularAlbums() {
  try {
    const token = await getSpotifyAccessToken();
    if (!token) throw new Error("Brak tokena dostępu do Spotify");

    const response = await fetch(
      `https://api.spotify.com/v1/browse/new-releases?country=PL&limit=6`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Błąd Spotify API (albums):", errorText);
      return [];
    }

    const data = await response.json();
    return data.albums.items.slice(0, 10);
  } catch (error) {
    console.error("Błąd w getPopularAlbums:", error.message);
    return [];
  }
}

export async function getPopularTracks() {
  try {
    const token = await getSpotifyAccessToken();
    if (!token) throw new Error("Brak tokena dostępu do Spotify");

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=a&type=track&limit=6`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Błąd Spotify API (tracks):", errorText);
      return [];
    }

    const data = await response.json();
    const sortedTracks = data.tracks.items.sort((a, b) => b.popularity - a.popularity);
    const topTracks = sortedTracks.slice(0, 10);
    return topTracks;
  } catch (error) {
    console.error("Błąd w getPopularTracks:", error.message);
    return [];
  }
}
