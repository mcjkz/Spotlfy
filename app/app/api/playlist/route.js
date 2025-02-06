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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const playlistsData = await readPlaylistsFile();

  let responseData;
  if (userId) {
    responseData = playlistsData[userId] || [];
  } else {
    responseData = playlistsData;
  }
  return new Response(JSON.stringify(responseData), { status: 200 });
}

export async function POST(request) {
  try {
    const { userId, playlistName, trackIds } = await request.json();
    if (!userId || !playlistName) {
      return new Response('Nieprawidłowe dane', { status: 400 });
    }
    const playlistsData = await readPlaylistsFile();
    if (!playlistsData[userId]) {
      playlistsData[userId] = [];
    }
    const newPlaylist = {
      id: Date.now().toString(),
      name: playlistName,
      trackIds: trackIds || []
    };
    playlistsData[userId].push(newPlaylist);
    await writePlaylistsFile(playlistsData);
    return new Response(JSON.stringify(newPlaylist), { status: 201 });
  } catch (error) {
    console.error('Błąd przy tworzeniu playlisty:', error);
    return new Response('Błąd serwera', { status: 500 });
  }
}
