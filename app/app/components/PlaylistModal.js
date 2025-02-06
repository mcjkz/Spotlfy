'use client';

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './Okienko.css';
import Error from '../icons/Error';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

const socket = io("http://localhost:4000");


export default function PlaylistModal({ mode, playlist, onClose, onSubmit }) {
  const { userData } = useAuth();
  const [newName, setNewName] = useState(playlist.name);
  const [mutualUsers, setMutualUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userData) return;
    socket.emit("joinRoom", userData.id);

    return () => {
      socket.emit("leaveRoom", userData.id);
    };
  }, [userData?.id]);

  useEffect(() => {
    if (mode !== 'share') return;

    async function fetchMutualUsers() {
      try {
        setLoading(true);
        const usersRes = await fetch('/api/users');
        if (!usersRes.ok) {
          console.error('Błąd pobierania użytkowników');
          setLoading(false);
          return;
        }
        const usersData = await usersRes.json();

        const followersRes = await fetch('/api/followers');
        if (!followersRes.ok) {
          console.error('Błąd pobierania followersów');
          setLoading(false);
          return;
        }
        const followersData = await followersRes.json();

        const mutual = usersData.filter(u => {
          if (u.id === userData.id) return false;
          const isFollowing = followersData.some(
            item => item.followerId === userData.id && item.followedId === u.id
          );
          const isFollowed = followersData.some(
            item => item.followerId === u.id && item.followedId === userData.id
          );
          return isFollowing && isFollowed;
        });
        setMutualUsers(mutual);
      } catch (error) {
        console.error("Błąd przy pobieraniu użytkowników wzajemnych:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMutualUsers();
  }, [mode, userData]);

  const handleCheckboxChange = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'edit') {
      onSubmit(newName);
    } else if (mode === 'delete') {
      onSubmit();
    } else if (mode === 'share') {
      const playlistLink = window.location.href;
      const message = {
        playlistId: playlist.id,
        playlistName: playlist.name,
        link: playlistLink,
        recipients: selectedUsers,
        sender: userData.id,
      };

      socket.emit("playlist_share", message);

      onSubmit(selectedUsers);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {mode === 'edit' && (
          <>
            <h2>Edytuj playlistę</h2>
            <form onSubmit={handleSubmit}>
              <input
                className="tekst"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <div className="modal-buttons">
                <button className="zapisz" type="submit">Zapisz</button>
                <button className="anuluj" type="button" onClick={onClose}>Anuluj</button>
              </div>
            </form>
          </>
        )}

        {mode === 'delete' && (
          <>
            <h2>Usuń playlistę</h2>
            <p className="p-delete">
              <Error /> Czy na pewno chcesz usunąć playlistę?
            </p>
            <div className="modal-buttons">
              <button className="usun" onClick={handleSubmit}>Usuń</button>
              <button className="anuluj" onClick={onClose}>Anuluj</button>
            </div>
          </>
        )}

        {mode === 'share' && (
          <>
            <h2>Udostępnij playlistę</h2>
            <p className='p-ok'>Wybierz użytkowników</p>
            {loading ? (
              <Loading />
            ) : mutualUsers.length > 0 ? (
              <ul className="playlist-list">
                {mutualUsers.map(user => (
                  <div key={user.id}>
                    <li>
                      <label>
                        <input
                          type="checkbox"
                          value={user.id}
                          onChange={() => handleCheckboxChange(user.id)}
                          checked={selectedUsers.includes(user.id)}
                        />
                        {user.name}
                      </label>
                    </li>
                    <hr />
                  </div>
                ))}
              </ul>
            ) : (
              <p>Brak użytkowników spełniających kryteria wzajemnego obserwowania.</p>
            )}
            <div className="modal-buttons">
              <button className="zapisz" onClick={handleSubmit}>Udostępnij</button>
              <button className="anuluj" onClick={onClose}>Anuluj</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
