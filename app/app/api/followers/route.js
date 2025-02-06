import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'followers.json');

async function readFollowersFile() {
  try {
    const fileContents = await fs.readFile(dataFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeFollowersFile(data) {
  await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET(request) {
  try {
    const followers = await readFollowersFile();
    return new Response(JSON.stringify(followers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Błąd przy odczycie obserwacji:', error);
    return new Response(
      JSON.stringify({ error: 'Wewnętrzny błąd serwera.' }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { followerId, followedId } = await request.json();

    if (!followerId || !followedId) {
      return new Response(
        JSON.stringify({ error: 'followerId oraz followedId są wymagane.' }),
        { status: 400 }
      );
    }

    const followers = await readFollowersFile();

    const exists = followers.some(
      (item) =>
        item.followerId === followerId && item.followedId === followedId
    );

    if (exists) {
      return new Response(
        JSON.stringify({ message: 'Obserwacja już istnieje.' }),
        { status: 200 }
      );
    }

    followers.push({ followerId, followedId });
    await writeFollowersFile(followers);

    return new Response(
      JSON.stringify({ message: 'Obserwacja została dodana.' }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Błąd w POST /api/followers:', error);
    return new Response(
      JSON.stringify({ error: 'Wewnętrzny błąd serwera.' }),
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { followerId, followedId } = await request.json();

    if (!followerId || !followedId) {
      return new Response(
        JSON.stringify({ error: 'followerId oraz followedId są wymagane.' }),
        { status: 400 }
      );
    }

    const followers = await readFollowersFile();

    const filtered = followers.filter(
      (item) =>
        !(item.followerId === followerId && item.followedId === followedId)
    );

    if (filtered.length === followers.length) {
      return new Response(
        JSON.stringify({ message: 'Nie znaleziono obserwacji do usunięcia.' }),
        { status: 404 }
      );
    }

    await writeFollowersFile(filtered);

    return new Response(
      JSON.stringify({ message: 'Obserwacja została usunięta.' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Błąd w DELETE /api/followers:', error);
    return new Response(
      JSON.stringify({ error: 'Wewnętrzny błąd serwera.' }),
      { status: 500 }
    );
  }
}
