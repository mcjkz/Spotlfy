'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import BibliotekaIcon from "../icons/BibliotekaIcon";
import PlusIcon from "../icons/PlusIcon";
import './Biblioteka.css';
import Loading from './Loading';
import { usePlaylists } from '../contexts/PlaylistsContext';
import Error from "../icons/Error";

function PlaylistCard({ playlist, active, onClick }) {
  const [imageUrl, setImageUrl] = useState('/album-icon.png');

  useEffect(() => {
    if (playlist.trackIds && playlist.trackIds.length > 0) {
      const trackId = playlist.trackIds[0];
      fetch(`/api/track/${trackId}`)
        .then(response => {
          if (!response.ok) {
            console.error('Błąd przy pobieraniu danych utworu');
            return null;
          }
          return response.json();
        })
        .then(data => {
          if (data && data.image) {
            setImageUrl(data.image);
          } else {
            setImageUrl('/album-icon.png');
          }
        })
        .catch(error => {
          console.error("Błąd przy pobieraniu obrazka utworu:", error);
          setImageUrl('/album-icon.png');
        });
    } else {
      setImageUrl('/album-icon.png');
    }
  }, [playlist.trackIds]);

  const cardStyle = {
    cursor: 'pointer',
    backgroundColor: active && '#2A2A2A',
  };

  return (
    <div className="playlist-card" style={cardStyle} onClick={onClick}>
      <img src={imageUrl} alt={playlist.name} className="playlist-image" />
      <div className="playlist-name-container">
        <p>{playlist.name}</p>
        <p>Playlista • Liczba utworów: {playlist.trackIds ? playlist.trackIds.length : 0}</p>
      </div>
    </div>
  );
}

export default function Biblioteka({ userData }) {
  const { playlists, setPlaylists } = usePlaylists();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  let activePlaylistId = null;
  if (pathname.startsWith('/playlist/')) {
    activePlaylistId = pathname.split('/')[2];
  }

  const fetchPlaylists = async () => {
    if (!userData || !userData.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/playlist?userId=${userData.id}`);
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data);
      } else {
        console.error("Błąd przy pobieraniu playlist:", response.status);
        setError("Błąd przy pobieraniu playlist:");
      }
    } catch (error) {
      console.error("Błąd przy pobieraniu playlist:", error);
      setError("Błąd przy pobieraniu playlist:");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [userData]);

  const handleCreatePlaylist = async () => {
    if  (!userData){
        return
    }
    const playlistName = `Moja Playlista #${playlists.length + 1}`;
    try {
      const response = await fetch('/api/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          playlistName,
          trackIds: []
        })
      });
      if (!response.ok) {
        console.error("Błąd przy tworzeniu playlisty:", response.status);
        return;
      }
      const newPlaylist = await response.json();
      setPlaylists(prev => [...prev, newPlaylist]);
    } catch (error) {
      console.error("Błąd przy tworzeniu playlisty:", error);
    }
  };

  const handlePlaylistClick = (playlistId) => {
    router.push(`/playlist/${playlistId}`);
  };

  return (
    <div className="left-section-scroll">
      <div className="biblioteka-container">
        <button className="biblioteka-button">
          <div className="biblioteka-icon">
            <BibliotekaIcon />
          </div>
          <h2>Biblioteka</h2>
        </button>
        <button className="biblioteka-dodaj" onClick={handleCreatePlaylist}>
          <PlusIcon />
        </button>
      </div>

      <div className="playlista">
        {userData ? (
          error ? (
            <div className="error">
              <Error />
              <p>Coś poszło nie tak.</p>
              <p>Poszukać czegoś innego?</p>
            </div>
          ) : loading ? (
            <Loading />
          ) : (
            <div className="playlists-container">
              {playlists && playlists.length > 0 ? (
                playlists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    active={playlist.id === activePlaylistId}
                    onClick={() => handlePlaylistClick(playlist.id)}
                  />
                ))
              ) : (
                <div className="playlista-brak">
                  <p>Utwórz swoją pierwszą playlistę</p>
                  <p>To proste, pomożemy Ci</p>
                  <button onClick={handleCreatePlaylist}>Utwórz playlistę</button>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="playlists-container">
            <div className="playlista-brak">
              <p>Utwórz swoją pierwszą playlistę</p>
              <p>To proste, pomożemy Ci</p>
              <button onClick={handleCreatePlaylist}>Utwórz playlistę</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
