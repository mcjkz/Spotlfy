"use client";

import "./globals.css";
import React, { Suspense, lazy, useState } from "react";
import Providers from "./components/Providers";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SpotifyProvider, useSpotify } from "./components/SearchBar";
import { PlaylistsProvider } from "./contexts/PlaylistsContext";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpotify } from "@fortawesome/free-brands-svg-icons";
import { faHouse } from "@fortawesome/free-solid-svg-icons";

import { usePathname, useRouter } from "next/navigation";

const SearchBar = lazy(() => import("./components/SearchBar"));
const LoginButtons = lazy(() => import("./components/LoginButtons"));
const Biblioteka = lazy(() => import("./components/Biblioteka"));
const Stopka = lazy(() => import("./components/Stopka"));

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <SpotifyProvider>
            <AuthProvider>
              <PlaylistsProvider>
                <LayoutContent>{children}</LayoutContent>
              </PlaylistsProvider>
            </AuthProvider>
          </SpotifyProvider>
        </Providers>
      </body>
    </html>
  );
}

function LayoutContent({ children }) {
  const { isAuthLoading, userData } = useAuth();
  const { query } = useSpotify();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  if (isAuthLoading) return null;
  
  if (pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  return (
    <>
      <header>
        <div className="icon-spotify">
          <FontAwesomeIcon icon={faSpotify} style={{ width: "40px", height: "40px" }} />
        </div>
        <div className="pole-wyszukiwania">
          <div className="icon-home" onClick={() => router.push("/")}>
            <FontAwesomeIcon icon={faHouse} style={{ width: "22px", height: "22px" }} />
          </div>
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>
        <Suspense>
          <LoginButtons userData={userData} />
        </Suspense>
      </header>
      <main>
        <div className="lewy-panel">
          <Suspense>
            <Biblioteka onSelectPlaylist={setSelectedPlaylistId} userData={userData} />
          </Suspense>
        </div>
        <div className="main-section">
          {children}
        </div>
      </main>
      <footer>
        <Suspense>
          <Stopka userData={userData} />
        </Suspense>
      </footer>
    </>
  );
}
