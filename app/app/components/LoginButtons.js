'use client';

import { useRouter } from "next/navigation";
import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import io from "socket.io-client";
import "./LoginButtons.css";
import Powiadomienie from "../icons/Powiadomienie";
import PowiadomienieActive from "../icons/PowiadomienieActive";

const socket = io("http://localhost:4000");


export default function LoginButtons({ userData }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]);
  const [toastNotifications, setToastNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (isDropdownOpen && menuRef.current) {
      menuRef.current.style.zIndex = "1000";
    }
  }, [isDropdownOpen]);

  async function fetchUserNameById(userId) {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const users = await res.json();
        const user = users.find((u) => u.id === userId);
        return user ? user.name : "Nieznany użytkownik";
      }
    } catch (error) {
      console.error("Błąd pobierania użytkownika:", error);
    }
    return "Nieznany użytkownik";
  }

  useEffect(() => {
    if (!userData) {
      return;
    }
    socket.emit("joinRoom", userData.id);

    return () => {
      socket.emit("leaveRoom", userData.id);
    };
  }, [userData]);

  useEffect(() => {
    if (!userData) return;

    const handleNewFollower = async (data) => {
      if (data.followedId === userData.id && data.action === "follow") {
        const followerName = await fetchUserNameById(data.followerId);
        const newNotification = {
          id: Date.now(),
          message: `${followerName} zaobserwował Ciebie!`
        };
        setAllNotifications((prev) => [...prev, newNotification]);
        setToastNotifications((prev) => [...prev, newNotification]);
        setUnreadCount((prev) => prev + 1);

        setTimeout(() => {
          setToastNotifications((prev) =>
            prev.filter((notif) => notif.id !== newNotification.id)
          );
        }, 4000);
      }
    };

    socket.on("followers_update", handleNewFollower);

    return () => {
      socket.off("followers_update", handleNewFollower);
    };
  }, [userData?.id]);

  useEffect(() => {
    if (!userData) return;

    const handlePlaylistShare = async (data) => {
      if (data.sender === userData.id) {
        return;
      }
      const senderName = await fetchUserNameById(data.sender);
      const newNotification = {
        id: Date.now(),
        message: `${senderName} udostępnił/a playlistę: ${data.playlistName}. Kliknij, aby zobaczyć.`,
        link: data.link
      };
      setAllNotifications((prev) => [...prev, newNotification]);
      setToastNotifications((prev) => [...prev, newNotification]);
      setUnreadCount((prev) => prev + 1);

      setTimeout(() => {
        setToastNotifications((prev) =>
          prev.filter((notif) => notif.id !== newNotification.id)
        );
      }, 4000);
    };

    socket.on("playlist_share", handlePlaylistShare);

    return () => {
      socket.off("playlist_share", handlePlaylistShare);
    };
  }, [userData?.id]);

  const handleNotificationClick = (link) => {
    if (link) {
      setIsNotificationsOpen(false);
      router.push(link);
    }
  };

  const menuRozwijaneTouch = (e) => {
    if (menuRef.current &&!menuRef.current.contains(e.relatedTarget)) {
      setIsDropdownOpen(false);
      setIsNotificationsOpen(false);
    }
  };

  const menuRozwijaneKlik = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const toggleNotifications = () => {
    if (!isNotificationsOpen) {
      setUnreadCount(0);
    }
    setIsNotificationsOpen((prev) => !prev);
  };

  const goToProfile = () => {
    router.push(`/user/${userData.id}`);
  };

  const clearNotifications = () => {
    setAllNotifications([]);
    setToastNotifications([]);
    setUnreadCount(0);
  };
  if (userData) {
    return (
      <div className="konto" ref={menuRef} onBlur={menuRozwijaneTouch}>
        <div className="toast-notifications">
          {toastNotifications.map((notif) => (
            <div key={notif.id} className="toast-notification" onClick={() => handleNotificationClick(notif.link)}>
              {notif.message}
            </div>
          ))}
        </div>

        <div className="notifications-container">
          <button className="notification-button" onClick={toggleNotifications}>
            {isNotificationsOpen ? <PowiadomienieActive /> : <Powiadomienie />}
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          {isNotificationsOpen && (
            <div className="notifications-menu" ref={menuRef} tabIndex="0">
              {allNotifications.length > 0 ? (
                allNotifications.map((notif) => (
                  <p
                    key={notif.id}
                    className="notification"
                    onClick={() => handleNotificationClick(notif.link)}
                  >
                    {notif.message}
                  </p>
                ))
              ) : (
                <p className="no-notifications" >Brak powiadomień</p>
              )}
              {allNotifications.length > 0 && (
                <button className="clear-btn" onClick={clearNotifications}>
                  Wyczyść powiadomienia
                </button>
              )}
            </div>
          )}
        </div>

        <div className="profile-container">
          <button className="profile" onClick={menuRozwijaneKlik}>
            {userData.name} {isDropdownOpen ? "▲" : "▼"}
          </button>
          {isDropdownOpen && (
            <div className="menu" ref={menuRef} tabIndex="0">
              <button
                onClick={() => {
                  goToProfile();
                  menuRozwijaneKlik();
                }}
              >
                Profil
              </button>
              <button>Przejdź na Premium</button>
              <button>Ustawienia</button>
              <hr />
              <button onClick={async () => await logout()}>Wyloguj</button>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    return (
      <div className="logowanie">
        <button className="signup" onClick={() => router.push("/register")}>
          Zarejestruj się
        </button>
        <button className="login" onClick={() => router.push("/login")}>
          Zaloguj się
        </button>
      </div>
    );
  }
}
