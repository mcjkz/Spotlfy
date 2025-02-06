import { promises as fs } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'playlists.json');

async function readPlaylistsFile() {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function writePlaylistsFile(data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export async function POST(request) {
  try {
    const { playlistId, trackId, remove } = await request.json();
    if (!playlistId || !trackId) {
      return new Response('Nieprawidłowe dane', { status: 400 });
    }
    const playlistsData = await readPlaylistsFile();

    let playlistFound = false;
    for (const userId in playlistsData) {
      const playlists = playlistsData[userId];
      const playlist = playlists.find(pl => pl.id === playlistId);
      if (playlist) {
        if (remove) {
          playlist.trackIds = playlist.trackIds.filter(id => id !== trackId);
        } else {
          if (!playlist.trackIds.includes(trackId)) {
            playlist.trackIds.push(trackId);
          }
        }
        playlistFound = true;
        break;
      }
    }
    if (!playlistFound) {
      return new Response('Nie znaleziono playlisty', { status: 404 });
    }

    await writePlaylistsFile(playlistsData);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Error updating track in playlist:", error);
    return new Response('Błąd serwera', { status: 500 });
  }
}
