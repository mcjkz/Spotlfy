'use client';

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';
import "./Stopka.css";
import VolumeIcon from "../icons/VolumeIcon";
import VolumeMuteIcon from "../icons/VolumeMuteIcon";
import PoprzedniIcon from "../icons/PoprzedniIcon";
import DalejIcon from "../icons/DalejIcon";
import UlubDodajIcon from "../icons/UlubDodajIcon";
import AddToPlaylistModal from "./Okienko";
import UlubIcon from "../icons/UlubIcon";
import { usePlaylists } from "../contexts/PlaylistsContext";

export default function Stopka({ userData }) {
  const router = useRouter();
  const { playlists, setPlaylists } = usePlaylists();

  const [trackId, setTrackId] = useState(
    typeof window !== "undefined" ? localStorage.getItem("selectedTrackId") : null
  );
  const [trackDetails, setTrackDetails] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);

  const audioRef = useRef(new Audio());
  const abortControllerRef = useRef(null);
  const isInitialMount = useRef(true);

  const [showModal, setShowModal] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState("");

  const [prevPlaylistNames, setPrevPlaylistNames] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);

  const scrollingContainerRef = useRef(null);
  const scrollingTextRef = useRef(null);
  const [scrollDistance, setScrollDistance] = useState("0px");

  const updateGlobalPlaylists = async (userId) => {
    try {
      const response = await fetch(`/api/playlist?userId=${userId}`);
      if (response.ok) {
        const updatedPlaylists = await response.json();
        setPlaylists(updatedPlaylists);
        setUserPlaylists(updatedPlaylists);
      }
    } catch (error) {
      console.error("Błąd przy aktualizacji globalnych playlist:", error);
    }
  };

  useEffect(() => {
    const storedTrackId = localStorage.getItem("selectedTrackId");
    if (storedTrackId) {
      setTrackId(storedTrackId);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const storedTrackId = localStorage.getItem("selectedTrackId");
      if (storedTrackId !== trackId) {
        setTrackId(storedTrackId);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [trackId]);

  useEffect(() => {
    if (!trackId) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    const fetchTrackDetails = async () => {
      try {
        const response = await fetch(`/api/track/${trackId}`, { signal });
        if (!response.ok) throw new Error("Błąd pobierania utworu");
        const data = await response.json();
        if (data.audio) {
          setTrackDetails(data);

          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current.load();

          audioRef.current.src = data.audio;
          audioRef.current.load();

          audioRef.current.onloadedmetadata = () => {
            setDuration(audioRef.current.duration);
            const storedPlayback = localStorage.getItem("playbackData");
            if (storedPlayback) {
              const { trackId: storedId, time: storedTime } = JSON.parse(storedPlayback);
              if (storedId === trackId) {
                audioRef.current.currentTime = storedTime;
                setCurrentTime(storedTime);
                setProgress((storedTime / audioRef.current.duration) * 100);
              } else {
                audioRef.current.currentTime = 0;
                localStorage.setItem(
                  "playbackData",
                  JSON.stringify({ trackId, time: 0 })
                );
              }
            } else {
              localStorage.setItem(
                "playbackData",
                JSON.stringify({ trackId, time: 0 })
              );
            }
          };

          audioRef.current.onended = () => {
            if (isLooping) {
              audioRef.current.play();
            } else {
              setIsPlaying(false);
              setProgress(0);
              setCurrentTime(0);
            }
          };

          audioRef.current.ontimeupdate = () => {
            const cTime = audioRef.current.currentTime;
            setCurrentTime(cTime);
            setProgress((cTime / audioRef.current.duration) * 100);
            localStorage.setItem(
              "playbackData",
              JSON.stringify({ trackId, time: cTime })
            );
          };

          audioRef.current.volume = volume;
          if (isInitialMount.current) {
            isInitialMount.current = false;
            setIsPlaying(false);
          } else {
            audioRef.current.play().then(() => {
              setIsPlaying(true);
            });
          }
        } else {
          setTrackDetails(null);
          setIsPlaying(false);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Błąd pobierania szczegółów utworu:", error);
        }
      }
    };

    fetchTrackDetails();
  }, [trackId]);

  useEffect(() => {
    if (!userData || !userData.id || !trackId) return;
    async function fetchUserPlaylists() {
      try {
        const response = await fetch(`/api/playlist?userId=${userData.id}`);
        if (response.ok) {
          const playlistsData = await response.json();
          setUserPlaylists(playlistsData);
          const names = playlistsData
            .filter(playlist => playlist.trackIds.includes(trackId))
            .map(playlist => playlist.name);
          setPrevPlaylistNames(names);
        }
      } catch (error) {
        console.error("Błąd sprawdzania utworu w playlistach:", error);
      }
    }
    fetchUserPlaylists();
  }, [userData, trackId, showModal]);

  useEffect(() => {
    if (!trackId) return;
    if (playlists && playlists.length > 0) {
      const names = playlists
        .filter(playlist => playlist.trackIds.includes(trackId))
        .map(playlist => playlist.name);
      setPrevPlaylistNames(names);
    } else {
      setPrevPlaylistNames([]);
    }
  }, [playlists, trackId]);

  const artistText = trackDetails ? trackDetails.artist.replace(" & ", ", ") : "";
  useEffect(() => {
    if (artistText.length > 50 && scrollingContainerRef.current && scrollingTextRef.current) {
      const containerWidth = scrollingContainerRef.current.offsetWidth;
      const textWidth = scrollingTextRef.current.offsetWidth;
      const totalDistance = containerWidth + textWidth;
      setScrollDistance(`${textWidth-containerWidth}px`);
    }
  }, [artistText]);

  const togglePlay = () => {
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
    audioRef.current.loop = !isLooping;
  };

  const handleProgressChange = (e) => {
    const newTime = (e.target.value / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setProgress(e.target.value);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!isMuted) {
      setPreviousVolume(volume);
      setVolume(0);
      audioRef.current.volume = 0;
      setIsMuted(true);
    } else {
      setVolume(previousVolume);
      audioRef.current.volume = previousVolume;
      setIsMuted(false);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleOpenModal = () => {
    if (playlists.length > 0) {
      setShowModal(true);
    } else {
      setMessageText("Musisz utworzyć playlistę, aby dodać utwór do ulubionych.");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
  };

  const handleTrackUpdate = async (newPlaylistData) => {
    let newPlaylistNames = [];

    if (userPlaylists.length > 0 && userPlaylists.some(p => p.id === newPlaylistData[0])) {
      newPlaylistNames = newPlaylistData.map(id => {
        const pl = userPlaylists.find(p => p.id === id);
        return pl ? pl.name : id;
      });
    } else {
      newPlaylistNames = newPlaylistData;
    }

    let newMessage = "";
    if (newPlaylistNames.length > 0 && prevPlaylistNames.length === 0) {
      newMessage = `Dodano utwór do playlisty: ${newPlaylistNames.join(', ')}.`;
    } else if (newPlaylistNames.length > 0 && prevPlaylistNames.length > 0 && newPlaylistNames.toString() !== prevPlaylistNames.toString()) {
      newMessage = `Zaktualizowano playlistę: ${newPlaylistNames.join(', ')}.`;
    } else if (newPlaylistNames.length === 0 && prevPlaylistNames.length > 0) {
      newMessage = `Usunięto utwór z playlisty: ${prevPlaylistNames.join(', ')}.`;
    }
    setMessageText(newMessage);
    setPrevPlaylistNames(newPlaylistNames);
    setShowModal(false);

    if (userData && userData.id) {
      await updateGlobalPlaylists(userData.id);
    }
    
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  const handlePrev = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setProgress(0);
      localStorage.setItem("playbackData", JSON.stringify({ trackId, time: 0 }));
    }
  };

  const handleNext = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = duration;
      setCurrentTime(duration);
      setProgress(100);
      localStorage.setItem("playbackData", JSON.stringify({ trackId, time: duration }));
    }
  };

  if (userData) {
    return (
      <div className="stopka">
        {showMessage && (
          <div className="komunikat-utwor">
            {messageText}
          </div>
        )}
        <div className="odtwarzacz">
          <div className="track-container">
            {trackDetails && trackDetails.image?.length > 0 ? (
              <div className="okładka">
                <img 
                  src={trackDetails.image} 
                  alt={`Okładka albumu ${trackDetails.title}`} 
                />
              </div>
            ) : ""}
            <div className="track-name">
              <p>{trackDetails ? trackDetails.title : ""}</p>
              {artistText.length > 50 ? (
                <p className="scrolling-text-container" ref={scrollingContainerRef}>
                  <span 
                    ref={scrollingTextRef} 
                    style={{
                      "--scroll-distance": scrollDistance,
                    }}
                  >
                    {artistText}
                  </span>
                </p>
              ) : (
                <p>{artistText}</p>
              )}
            </div>
            {trackDetails && (
              <button className={prevPlaylistNames.length > 0 ? "dodaj-ulub klik" : "dodaj-ulub"} onClick={handleOpenModal}>
                { prevPlaylistNames.length > 0 
                  ? <UlubIcon style={{ color: '#1ED760' }} />
                  : <UlubDodajIcon /> 
                }
              </button>
            )}
          </div>
          <div className="odtwarzacz-container">
            <div className="przyciski-container">
              <button className="zmiana" onClick={handlePrev} disabled={!trackDetails}><PoprzedniIcon /></button>
              <button className={isPlaying ? 'play' : 'pause'} onClick={togglePlay} disabled={!trackDetails}>
                {isPlaying ? <FontAwesomeIcon icon={faPause} /> : <FontAwesomeIcon icon={faPlay} />}
              </button>
              <button className="zmiana" onClick={handleNext} disabled={!trackDetails}><DalejIcon /></button>
            </div>
            <div className="progress-container">
              <span>{trackDetails ? formatTime(currentTime) : "-:--"}</span>
              <div className="progress-wrapper">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                {trackDetails && (
                  <div 
                    className="progress-thumb" 
                    style={{ left: `calc(${progress}% - 7px)` }}
                  ></div>
                )}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleProgressChange}
                  disabled={!trackDetails}
                />
              </div>
              <span>{trackDetails ? formatTime(duration) : "-:--"}</span>
            </div>
          </div>
          <div className="volume-container">
            <button onClick={toggleMute}>
              {isMuted || volume === 0 ? <VolumeMuteIcon /> : <VolumeIcon />}
            </button>
            <div className="volume-wrapper">
              <div className="volume-fill" style={{ width: `${volume * 100}%` }}></div>
              <div 
                className="volume-thumb" 
                style={{ left: `calc(${volume * 100}% - 7px)` }}
              ></div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
              />
            </div>
          </div>
          {showModal && (
            <AddToPlaylistModal
              trackId={trackDetails?.id || localStorage.getItem("selectedTrackId")}
              userId={userData.id}
              onClose={() => setShowModal(false)}
              onTrackUpdate={handleTrackUpdate}
            />
          )}
        </div>
      </div>
    );
  } else {
    const register = () => {
      router.push("/register");
    };

    return (
      <div className="stopka">
        <div className="info" onClick={register}>
          <div className="description">
            <p>Podgląd Spotify</p>
            <p>Zarejestruj się, aby słuchać utworów i podcastów przerywanych sporadycznie reklamami. Nie wymagamy podania numeru karty kredytowej.</p>
          </div>
          <button className="register">
            Zarejestruj się za darmo
          </button>
        </div>
      </div>
    );
  }
}
