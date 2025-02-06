'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Loading from '../../components/Loading';
import PlaylistModal from '../../components/PlaylistModal';
import './Playlist.css';
import { usePlaylists } from '../../contexts/PlaylistsContext';
import { useAuth } from "../../contexts/AuthContext";
import Kosz from '../../icons/Kosz';

export default function PlaylistPage() {
  const { id: playlistId } = useParams();
  const router = useRouter();
  const { playlists, setPlaylists } = usePlaylists();

  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState(null);
  const [playlistUserId, setPlaylistUserId] = useState(null);

  const { userData } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState(null);

  useEffect(() => {
    if (!playlistId) return;

    async function fetchPlaylistData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/playlist/${playlistId}`);
        if (!response.ok) {
          console.error('Błąd przy pobieraniu danych playlisty');
          setPlaylist(null);
          setLoading(false);
          return;
        }
        const data = await response.json();
        setPlaylist(data);

        if (data.trackIds && data.trackIds.length > 0) {
          const tracksData = await Promise.all(
            data.trackIds.map(async (trackId) => {
              try {
                const trackResponse = await fetch(`/api/track/${trackId}`);
                if (!trackResponse.ok) {
                  console.error(`Błąd przy pobieraniu utworu o linku ${trackId}`);
                  return null;
                }
                return trackResponse.json();
              } catch (error) {
                console.error(`Błąd przy pobieraniu utworu o linku ${trackId}:`, error);
                return null;
              }
            })
          );
          setTracks(tracksData.filter((track) => track !== null));
        }

        const allPlaylistsResponse = await fetch(`/api/playlist`);
        if (allPlaylistsResponse.ok) {
          const allPlaylists = await allPlaylistsResponse.json();
          let derivedUserId = null;
          for (const key in allPlaylists) {
            if (allPlaylists[key].find(pl => pl.id === playlistId)) {
              derivedUserId = key;
              break;
            }
          }
          if (derivedUserId) {
            setPlaylistUserId(derivedUserId);
          } else {
            console.error("Nie udało się ustalić właściciela playlisty");
          }
        } else {
          console.error("Błąd przy pobieraniu wszystkich playlist");
        }
      } catch (error) {
        console.error('Błąd przy pobieraniu playlisty:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlaylistData();
  }, [playlistId]);

  useEffect(() => {
    if (!playlists || !playlistId) return;
    const updatedPlaylist = playlists.find(pl => pl.id === playlistId);
    if (updatedPlaylist) {
      setPlaylist(updatedPlaylist);
      if (updatedPlaylist.trackIds && updatedPlaylist.trackIds.length > 0) {
        (async function updateTracks() {
          try {
            const tracksData = await Promise.all(
              updatedPlaylist.trackIds.map(async (trackId) => {
                try {
                  const trackResponse = await fetch(`/api/track/${trackId}`);
                  if (!trackResponse.ok) {
                    console.error(`Błąd przy pobieraniu utworu o linku ${trackId}`);
                    return null;
                  }
                  return trackResponse.json();
                } catch (error) {
                  console.error(`Błąd przy pobieraniu utworu o linku ${trackId}:`, error);
                  return null;
                }
              })
            );
            setTracks(tracksData.filter((track) => track !== null));
          } catch (error) {
            console.error(error);
          }
        })();
      } else {
        setTracks([]);
      }
    }
  }, [playlists, playlistId]);

  useEffect(() => {
    if (!playlistUserId) return;

    async function fetchUser() {
      try {
        const usersResponse = await fetch(`/api/users`);
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const foundUser = usersData.find(u => u.id === playlistUserId);
          setUser(foundUser);
        } else {
          console.error("Błąd przy pobieraniu użytkowników");
        }
      } catch (error) {
        console.error("Błąd przy pobieraniu użytkowników:", error);
      }
    }

    fetchUser();
  }, [playlistUserId]);

  const updateGlobalPlaylists = async (userId) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/playlist?userId=${userId}`);
      if (response.ok) {
        const updatedPlaylists = await response.json();
        setPlaylists(updatedPlaylists);
      }
    } catch (error) {
      console.error('Błąd przy aktualizacji globalnych playlist:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleModalSubmit = async (newName) => {
    if (modalMode === 'edit') {
      try {
        setUpdating(true);
        const response = await fetch(`/api/playlist/${playlistId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: newName })
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Status: ${response.status}, Błąd: ${errorText}`);
          throw new Error('Błąd przy aktualizacji playlisty');
        }
        const updatedPlaylist = await response.json();
        setPlaylist(updatedPlaylist);
        await updateGlobalPlaylists(userData.id);
      } catch (error) {
        console.error('Błąd przy aktualizacji playlisty:', error);
      } finally {
        setUpdating(false);
        closeModal();
      }
    } else if (modalMode === 'delete') {
      try {
        setUpdating(true);
        const response = await fetch(`/api/playlist/${playlistId}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Status: ${response.status}, Błąd: ${errorText}`);
          throw new Error('Błąd przy usuwaniu playlisty');
        }
        await updateGlobalPlaylists(userData.id);
        router.push('/');
      } catch (error) {
        console.error('Błąd przy usuwaniu playlisty:', error);
      } finally {
        setUpdating(false);
        closeModal();
      }
    }
  };

  const handleShareDummy = () => {
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMode(null);
  };

  const handleTrackClick = (trackLink) => {
    if(userData){
      const parts = trackLink.split("/track/");
      if (parts.length > 1) {
        const trackId = parts[1];
        localStorage.setItem("selectedTrackId", trackId);
      } else {
        console.error("Link nie zawiera oczekiwanego formatu:", trackLink);
      }
    }
  };

  const handleRemoveTrack = async (trackIdToRemove) => {
    const parts = trackIdToRemove.split("/track/");
    const trackId = parts[1];
    try {
      setUpdating(true);
      const response = await fetch('/api/playlist/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistId: playlistId,
          trackId: trackId,
          remove: true
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Błąd przy usuwaniu utworu z playlisty:', error);
        throw new Error('Błąd przy usuwaniu utworu z playlisty');
      }
      const updatedTrackIds = playlist.trackIds.filter(id => id !== trackId);
      const updatedPlaylist = { ...playlist, trackIds: updatedTrackIds };
      setPlaylist(updatedPlaylist);
      await updateGlobalPlaylists(userData.id);
      const updatedTracks = tracks.filter(track => track.id !== trackId);
      setTracks(updatedTracks);
    } catch (error) {
      console.error('Błąd przy usuwaniu utworu z playlisty:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading || updating) {
    return <Loading />;
  }

  if (!playlist) {
    return <div>Nie znaleziono playlisty.</div>;
  }

  return (
    <div className="playlist-detail">
      <div className="album-detail">
        <img
          src={tracks[0]?.image || '/album-icon.png'}
          alt={playlist.name}
          className="album-image"
        />
        <div className="album-name">
          <p>Playlista</p>
          <h2>{playlist.name}</h2>
          {user && (
            <p>
              {user.name} • Liczba utworów: {playlist.trackIds ? playlist.trackIds.length : 0}
            </p>
          )}
        </div>
        {playlistUserId === userData?.id && (
          <div className="album-buttons">
            <button 
              className="udostepnij" 
              onClick={() => { 
                setModalMode('share'); 
                setShowModal(true); 
              }}
            >
              Udostępnij
            </button>
            <button 
              className="edytuj" 
              onClick={() => { 
                setModalMode('edit'); 
                setShowModal(true); 
              }}
            >
              Edytuj playlistę
            </button>
            <button 
              className="usun" 
              onClick={() => { 
                setModalMode('delete'); 
                setShowModal(true); 
              }}
            >
              Usuń playlistę
            </button>
          </div>
        )}
      </div>
      <div className="tracks-container">
        <div className="track-nav">
          <div className="numer">#</div>
          <div className="track-info">
            <p className="track-title">Tytuł</p>
            <p className="track-artist">Wykonawca</p>
          </div>
          <div className="track-year">Data wydania</div>
        </div>
        <hr />
        {tracks.length > 0 ? (
          tracks.map((track, index) => (
            <div
              key={index}
              className="track-item"
              onClick={() => handleTrackClick(track.link)}
            >
              <div className="numer">
                <span className="track-number">{index + 1}</span>
                <span className="track-play">▶</span>
              </div>
              <img
                src={track.image || '/default-track.png'}
                alt={track.title}
                className="track-image"
              />
              <div className="track-info">
                <p className="track-title">{track.title}</p>
                <p className="track-artist">{track.artist}</p>
              </div>
              <div className="track-year">
                <p>{new Date(track.date).getFullYear()}</p>
              </div>
              <div className="track-usun">
              {playlistUserId === userData?.id && (
                <button
                  className="remove-track-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTrack(track.link);
                  }}
                >
                  <Kosz />
                </button>)}
              </div>
            </div>
          ))
        ) : (
          <p>Brak utworów w tej playliście.</p>
        )}
      </div>
      {showModal && (
        <PlaylistModal
          mode={modalMode}
          playlist={playlist}
          onClose={closeModal}
          onSubmit={modalMode === 'share' ? handleShareDummy : handleModalSubmit}
        />
      )}
    </div>
  );
}
