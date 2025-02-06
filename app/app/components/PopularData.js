"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import Error from "../icons/Error";
import Loading from './Loading'
import "./PopularData.css";

export default function PopularData() {
  const [popularData, setPopularData] = useState({
    artists: [],
    albums: [],
    tracks: [],
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchPopularData = async () => {
      try {
        const res = await fetch("/api/popular");

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch popular data");
        }

        const data = await res.json();
        
        if (!data.artists?.length && !data.albums?.length && !data.tracks?.length) {
          setError("API zwróciło niepełne dane.");
          return;
        }
        setPopularData({
          artists: data.artists,
          albums: data.albums,
          tracks: data.tracks,
        });
      } catch (err) {
        console.error("Error fetching popular data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularData();
  }, []);
  if (loading) return <Loading />
  if (error) return (
      <div className="error">
        <Error />
        <p>Coś poszło nie tak.</p>
        <p>Poszukać czegoś innego?</p>
      </div>
    )

  return (
    <div className="main-section-scroll">
      <div className="section">
        <h2>Popularni wykonawcy</h2>
        <div className="grid">
          {popularData.artists.map((artist) => (
            <button key={artist.id} className="card">
              {artist.images && artist.images.length > 0 ? (
                <img src={artist.images[0].url} alt={artist.name} className="wykonawcy-image" />
              ) : (
                <div className="placeholder">No Image</div>
              )}
              <p className="name">{artist.name}</p>
              <p className="description">Wykonawca</p>
              <div className='play-icon'><FontAwesomeIcon icon={faPlay} /></div>
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Popularne albumy</h2>
        <div className="grid">
          {popularData.albums.map((album) => (
            <div key={album.id} className="card">
              {album.images && album.images.length > 0 ? (
                <img src={album.images[0].url} alt={album.name} className="image" />
              ) : (
                <div className="placeholder">No Image</div>
              )}
              <p className="name">{album.name}</p>
              <p className="description">{album.artists.map((a) => a.name).join(", ")}</p>
              <div className='play-icon'><FontAwesomeIcon icon={faPlay} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Popularne single</h2>
        <div className="grid">
          {popularData.tracks.map((track) => (
            <div key={track.id} className="card">
              {track.album.images && track.album.images.length > 0 ? (
                <img src={track.album.images[0].url} alt={track.name} className="image" />
              ) : (
                <div className="placeholder">No Image</div>
              )}
              <p className="name">{track.name}</p>
              <p className="description">{track.artists.map((a) => a.name).join(", ")}</p>
              <div className='play-icon'><FontAwesomeIcon icon={faPlay} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
