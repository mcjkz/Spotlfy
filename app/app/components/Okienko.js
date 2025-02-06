'use client';

import { useEffect, useState } from 'react';
import './Okienko.css';
import Loading from './Loading';

export default function AddToPlaylistModal({ trackId, userId, onClose, onTrackUpdate }) {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    async function fetchPlaylists() {
      setLoading(true);
      try {
        const response = await fetch(`/api/playlist?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setPlaylists(data);
          const preSelected = new Set();
          data.forEach((playlist) => {
            if (playlist.trackIds.includes(trackId)) {
              preSelected.add(playlist.id);
            }
          });
          setSelectedPlaylists(preSelected);
        } else {
          setError('Nie udało się pobrać playlist.');
        }
      } catch (err) {
        setError('Błąd podczas pobierania playlist.');
      }
      setLoading(false);
    }
    fetchPlaylists();
  }, [userId, trackId]);

  const handleTogglePlaylist = (playlistId) => {
    setSelectedPlaylists((prevSelected) => {
      const newSet = new Set(prevSelected);
      if (newSet.has(playlistId)) {
        newSet.delete(playlistId);
      } else {
        newSet.add(playlistId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    for (const playlist of playlists) {
      const isSelected = selectedPlaylists.has(playlist.id);
      const alreadyContains = playlist.trackIds.includes(trackId);
      if (isSelected && !alreadyContains) {
        await fetch('/api/playlist/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playlistId: playlist.id,
            trackId,
            remove: false
          })
        });
      } else if (!isSelected && alreadyContains) {
        await fetch('/api/playlist/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playlistId: playlist.id,
            trackId,
            remove: true
          })
        });
      }
    }
    onTrackUpdate && onTrackUpdate(Array.from(selectedPlaylists));
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Wybierz playlisty</h2>
        {loading ? (
          <Loading />
        ) : error ? (
          <p>{error}</p>
        ) : (
          <>
            {playlists.length > 0 ? (
              <ul className="playlist-list">
                {playlists.map((playlist) => (
                    <div key={playlist.id}>
                  <li key={playlist.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedPlaylists.has(playlist.id)}
                        onChange={() => handleTogglePlaylist(playlist.id)}
                      />
                      {playlist.name}
                    </label>
                    
                  </li>
                  <hr />
                  </div>
                ))}
              </ul>
            ) : (
              <p>Brak utworzonych playlist.</p>
            )}
          </>
        )}
        <div className="modal-buttons">
          <button className="zapisz" onClick={handleSubmit}>Zapisz</button>
          <button className="anuluj" onClick={onClose}>Anuluj</button>
        </div>
      </div>
    </div>
  );
}
