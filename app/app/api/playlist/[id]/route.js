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
  return fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function GET(request, { params }) {
    const {id} = await params;

  const playlistsData = await readPlaylistsFile();

  let foundPlaylist = null;
  for (const userId in playlistsData) {
    const playlist = playlistsData[userId].find((pl) => pl.id === id);
    if (playlist) {
      foundPlaylist = playlist;
      break;
    }
  }

  if (!foundPlaylist) {
    return new Response(JSON.stringify({ error: 'Playlist not found' }), { status: 404 });
  }

  return new Response(JSON.stringify(foundPlaylist), { status: 200 });
}

export async function PUT(request, { params}){
  try {
    const {id} = await params;

    const { name } = await request.json();
    if (!name) {
      return new Response(JSON.stringify({ error: 'Missing playlist name' }), { status: 400 });
    }

    const playlistsData = await readPlaylistsFile();

    let updatedPlaylist = null;
    for (const userId in playlistsData) {
      const index = playlistsData[userId].findIndex((pl) => pl.id === id);
      if (index !== -1) {
        playlistsData[userId][index].name = name;
        updatedPlaylist = playlistsData[userId][index];
        break;
      }
    }

    if (!updatedPlaylist) {
      return new Response(JSON.stringify({ error: 'Playlist not found' }), { status: 404 });
    }

    await writePlaylistsFile(playlistsData);

    return new Response(JSON.stringify(updatedPlaylist), { status: 200 });
  } catch (error) {
    console.error('Błąd przy aktualizacji playlisty:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const {id} = await params;

    const playlistsData = await readPlaylistsFile();

    let deletedPlaylist = null;
    for (const userId in playlistsData) {
      const index = playlistsData[userId].findIndex((pl) => pl.id === id);
      if (index !== -1) {
        deletedPlaylist = playlistsData[userId][index];
        playlistsData[userId].splice(index, 1);
        break;
      }
    }

    if (!deletedPlaylist) {
      return new Response(JSON.stringify({ error: 'Playlist not found' }), { status: 404 });
    }

    await writePlaylistsFile(playlistsData);

    return new Response(JSON.stringify({ message: 'Playlist deleted' }), { status: 200 });
  } catch (error) {
    console.error('Błąd przy usuwaniu playlisty:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
