'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { useState, createContext, useContext, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const SpotifyContext = createContext();

export function useSpotify() {
  return useContext(SpotifyContext);
}

export function SpotifyProvider({ children }) {
  const [query, setQuery] = useState('');
  return (
    <SpotifyContext.Provider value={{ query, setQuery }}>
      {children}
    </SpotifyContext.Provider>
  );
}

export default function SearchBar() {
  const { query, setQuery } = useSpotify();
  const [isInputNotEmpty, setIsInputNotEmpty] = useState(query !== '');
  const [isActive, setIsActive] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsInputNotEmpty(value.trim() !== '');
  };

  const handleFocus = () => {
    setIsActive(true);
  };

  const handleBlur = () => {
    setIsActive(false);
  };

  useEffect(() => {
    if (!isActive) return;
    
    const currentQuery = searchParams.get("query");

    if (query && query !== currentQuery) {
      router.push(`/?query=${encodeURIComponent(query)}`, { shallow: true });
    } else if (!query && currentQuery) {
      router.push(`/`, { shallow: true });
    }
  }, [query, router, searchParams, isActive]);

  return (
    <div className="input-container">
      <button className="szukaj">
        <FontAwesomeIcon className="icon-search" icon={faMagnifyingGlass} />
      </button>
      <label
        htmlFor="search"
        className={`floating-label ${isInputNotEmpty ? 'hidden' : ''}`}
      >
        Czego chcesz posłuchać?
      </label>
      <input
        id="search"
        className="wyszukiwarka"
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </div>
  );
}
