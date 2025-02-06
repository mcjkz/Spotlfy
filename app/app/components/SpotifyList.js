import { useSpotify } from "./SearchBar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./SpotifyList.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import Loading from "./Loading";
import { useAuth } from "../contexts/AuthContext";

export default function SpotifyList() {
  const { query } = useSpotify();
  const router = useRouter();
  const [tracks, setTracks] = useState([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const { userData } = useAuth();
  const [selectedTrackId, setSelectedTrackId] = useState(
    localStorage.getItem("selectedTrackId") || null
  );

  const getTruncatedArtists = (artists) => {
    const names = artists.map((artist) => artist.name).join(", ");
    if (names.length > 50) {
      return names.slice(0, 50) + '...';
    }
    return names;
  };

  useEffect(() => {
    const fetchTracks = async () => {
      setTracksLoading(true);
      try {
        const response = await fetch(
          `/api/spotify/search?query=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        setTracks(data.tracks || []);
      } catch (error) {
        console.error("Błąd pobierania listy utworów z Spotify:", error);
        setTracks([]);
      }
      setTracksLoading(false);
    };

    fetchTracks();
  }, [query]);

  useEffect(() => {
    if (!tracksLoading) {
      const fetchUsers = async () => {
        try {
          const usersRes = await fetch("/api/users");
          if (!usersRes.ok) {
            console.error("Błąd pobierania użytkowników");
            return;
          }
          const data = await usersRes.json();
          const filtered = data.filter((user) =>
            user.name.toLowerCase().includes(query.toLowerCase())
          );
          setUsers(filtered);
        } catch (error) {
          console.error("Błąd pobierania użytkowników:", error);
        }
      };

      fetchUsers();
    }
  }, [query, tracksLoading]);

  const handleTrackSelect = (trackId) => {
    if(userData){
      setSelectedTrackId(trackId);
      localStorage.setItem("selectedTrackId", trackId);
    }
  };

  const handleUserClick = (userId) => {
    router.push(`/user/${userId}`);
  };

  if (!query) {
    return null;
  }
  if (tracksLoading) {
    return <Loading />;
  }

  return (
    <div className="list-section">
      <div className="track-container">
        <div className="best-result-nav">
          <h2>Najlepszy wynik</h2>
          {tracks.length > 0 && (
            <div className="best-result" onClick={() => handleTrackSelect(tracks[0].id)}> 
              <div className="best-track">
                <img src={tracks[0].album.images[0]?.url} alt={tracks[0].name} />
                <div>
                  <p>{tracks[0].name}</p>
                  <p>{getTruncatedArtists(tracks[0].artists)}</p>
                  <div className='play-icon'>
                    <FontAwesomeIcon icon={faPlay} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="track-list-nav">
          <h2>Utwory</h2>
          <ul className="track-list">
            {tracks.map((track) => (
              <li key={track.id} onClick={() => handleTrackSelect(track.id)}>
                <img src={track.album.images[0]?.url} alt={track.name} />
                <div>
                  <p>{track.name}</p>
                  <p>{getTruncatedArtists(track.artists)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {users.length > 0 && (
      <div className="users-list">
        <h2>Użytkownicy</h2>
          <div className="grid">
            {users.map((user) => (
              <div
                className="card"
                key={user.id}
                onClick={() => handleUserClick(user.id)}
              >
                <div className="user-avatar">
                  {user.name.charAt(0)}
                </div>
                <p className="user-name">{user.name}</p>
                <p className="description">Profil</p>
              </div>
            ))}
          </div>
      </div>
      )}
    </div>
  );
}
