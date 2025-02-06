'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const PlaylistsContext = createContext();

export function PlaylistsProvider({ children }) {
  const [playlists, setPlaylists] = useState([]);
    
  return (
    <PlaylistsContext.Provider value={{ playlists, setPlaylists }}>
      {children}
    </PlaylistsContext.Provider>
  );
}

export function usePlaylists() {
  return useContext(PlaylistsContext);
}
