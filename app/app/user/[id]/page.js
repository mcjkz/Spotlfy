"use client";

import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import "./User.css";
import Loading from "@/app/components/Loading";

const socket = io("http://localhost:4000");


export default function UserPage() {
  const { id } = useParams();
  const { userData } = useAuth();
  const [user, setUser] = useState(null);
  const [followed, setFollowed] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (!userData) return;

    socket.emit("joinRoom", userData.id);

    return () => {
      socket.emit("leaveRoom", userData.id);
    };
  }, [userData?.id]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          const foundUser = data.find((u) => u.id === id);
          setUser(foundUser);
        } else {
          console.error("Błąd pobierania użytkownika:", res.status);
        }
      } catch (error) {
        console.error("Błąd pobierania użytkownika:", error);
      }
    }
    fetchUser();
  }, [id]);

  useEffect(() => {
    async function fetchCounts() {
      if (!user) return;
      try {
        const res = await fetch("/api/followers");
        if (res.ok) {
          const data = await res.json();
          const followers = data.filter((item) => item.followedId === user.id);
          const following = data.filter((item) => item.followerId === user.id);
          setFollowersCount(followers.length);
          setFollowingCount(following.length);
        } else {
          console.error("Błąd pobierania followersów:", res.status);
        }
      } catch (error) {
        console.error("Błąd pobierania followersów:", error);
      }
    }
    fetchCounts();
  }, [user]);

  useEffect(() => {
    async function checkFollowStatus() {
      if (!userData || !user) return;
      try {
        const res = await fetch("/api/followers");
        if (res.ok) {
          const data = await res.json();
          const exists = data.some(
            (item) =>
              item.followerId === userData.id && item.followedId === user.id
          );
          setFollowed(exists);
        } else {
          console.error("Błąd pobierania obserwacji:", res.status);
        }
      } catch (error) {
        console.error("Błąd sprawdzania statusu obserwacji:", error);
      }
    }
    checkFollowStatus();
  }, [userData, user]);

  useEffect(() => {
    if (!user) return;
  
    const handleFollowersUpdate = (followersData) => {  
      if (!followersData || typeof followersData !== "object") {
        console.error("Błąd: followersData nie jest obiektem", followersData);
        return;
      }
  
      const { followerId, followedId, action } = followersData;

      if (followedId === user.id) {
        setFollowersCount((prev) => (action === "follow" ? prev + 1 : prev > 0 ? prev - 1 : 0));
      }

      if (followerId === user.id) {
        setFollowingCount((prev) => (action === "follow" ? prev + 1 : prev > 0 ? prev - 1 : 0));
      }
    };
  
    socket.on("followers_update", handleFollowersUpdate);
  
    return () => {
      socket.off("followers_update", handleFollowersUpdate);
    };
  }, [user?.id]);

  const handleToggleFollow = async () => {
    if (!userData || !user) return;
    try {
      let res;
      let actionType = followed ? "unfollow" : "follow";

      let eventData = {
        followerId: userData.id,
        followedId: user.id,
        action: actionType, 
      };

      if (!followed) {
        res = await fetch("/api/followers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        });
      } else {
        res = await fetch("/api/followers", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        });
      }

      if (res.ok) {
        setFollowed(!followed);
        socket.emit("followers_update", eventData);
      } else {
        console.error("Błąd przełączania follow/unfollow:", res.status);
      }
    } catch (error) {
      console.error("Błąd przełączania follow/unfollow:", error);
    }
  };

  if (!user) {
    return <Loading />;
  }

  return (
    <div className="konto-container">
      <div className="konto-nav">
        <div className="konto-detail">
          <h1>{user.name}</h1>
          <p>Data urodzenia: {user.dateOfBirth}</p>
          <div className="followers-info">
            <p>Obserwujących: {followersCount}</p>
            <p>Obserwowanych: {followingCount}</p>
          </div>
        </div>
        {userData && userData.id !== user.id && (
          <div className="przycisk-follow">
            <button
              onClick={handleToggleFollow}
              className={followed ? "unfollow-button" : "follow-button"}
            >
              {followed ? "Obserwujesz" : "Obserwuj"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
