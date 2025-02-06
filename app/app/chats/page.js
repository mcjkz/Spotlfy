"use client";

import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

const socket = io("http://localhost:4000");

export default function ChatPage() {
  const { userData } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentRoom, setCurrentRoom] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (!userData) return;
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data.filter(u => u.id !== userData.id));
        }
      } catch (error) {
        console.error("Błąd przy pobieraniu użytkowników:", error);
      }
    }
    fetchUsers();
  }, [userData]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    const roomId = [userData.id, user.id].sort().join("-");
    setCurrentRoom(roomId);
    setMessages([]);
    setUnreadCounts((prev) => ({ ...prev, [user.id]: 0 }));
    socket.emit("joinRoom", roomId);
  };

  useEffect(() => {
    if (!currentRoom) return;
    const handleChatHistory = (history) => {
      setMessages(history);
    };
    socket.on("chatHistory", handleChatHistory);
    return () => {
      socket.off("chatHistory", handleChatHistory);
    };
  }, [currentRoom]);

  useEffect(() => {
    if (!currentRoom) return;
    const handlePrivateMessage = (msgData) => {
      if (msgData.room === currentRoom) {
        setMessages((prev) => [...prev, msgData]);
      } else {
        if (msgData.sender !== userData.id) {
          setUnreadCounts((prev) => ({
            ...prev,
            [msgData.sender]: (prev[msgData.sender] || 0) + 1,
          }));
        }
      }
    };
    socket.on("privateMessage", handlePrivateMessage);
    return () => {
      socket.off("privateMessage", handlePrivateMessage);
    };
  }, [currentRoom, userData.id]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() === "") return;
    const msgData = {
      room: currentRoom,
      sender: userData.id,
      content: message,
      timestamp: Date.now(),
    };
    socket.emit("privateMessage", msgData);
    setMessage("");
  };

  const renderMessage = (msg) => {
    const style = getMessageStyle(msg);
    const timeString = new Date(msg.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return (
      <div key={msg.timestamp + msg.sender} style={style}>
        <div style={styles.messageHeader}>
          <span style={styles.senderName}>
            {msg.sender === userData.id ? "Ty" : selectedUser?.name || "Nieznany"}
          </span>
          <span style={styles.timestamp}>{timeString}</span>
        </div>
        <div style={styles.messageContent}>{msg.content}</div>
      </div>
    );
  };

  const getMessageStyle = (msg) => {
    if (msg.sender === userData.id) {
      return { ...styles.message, ...styles.myMessage };
    } else {
      return { ...styles.message, ...styles.otherMessage };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2>Użytkownicy</h2>
        {users.map((user) => (
          <div
            key={user.id}
            style={styles.userItem}
            onClick={() => handleUserSelect(user)}
          >
            {user.name}
            {unreadCounts[user.id] > 0 && (
              <span style={styles.badge}>{unreadCounts[user.id]}</span>
            )}
          </div>
        ))}
      </div>
      <div style={styles.chatContainer}>
        <h2>
          Chat {selectedUser ? `z ${selectedUser.name}` : " – wybierz użytkownika"}
        </h2>
        <div style={styles.chatBox} ref={chatBoxRef}>
          {messages.length === 0 ? (
            <p style={styles.noMessage}>Brak wiadomości</p>
          ) : (
            messages.map((msg) => renderMessage(msg))
          )}
        </div>
        {selectedUser && (
          <form onSubmit={handleSendMessage} style={styles.form}>
            <input
              type="text"
              placeholder="Napisz wiadomość..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.button}>
              Wyślij
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100%",
    fontFamily: "sans-serif",
  },
  sidebar: {
    width: "250px",
    borderRight: "1px solid #ccc",
    padding: "20px",
    overflowY: "auto",
    position: "relative",
  },
  userItem: {
    padding: "10px",
    cursor: "pointer",
    borderBottom: "1px solid #eee",
    position: "relative",
  },
  badge: {
    backgroundColor: "orange",
    borderRadius: "50%",
    padding: "4px 8px",
    color: "#000",
    fontWeight: "bold",
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
  },
  chatContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "20px",
  },
  chatBox: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "10px",
    overflowY: "auto",
    marginBottom: "20px",
    backgroundColor: "black",
  },
  noMessage: {
    textAlign: "center",
    color: "#888",
  },
  message: {
    padding: "8px",
    margin: "4px 0",
    borderRadius: "4px",
    display: "inline-block",
    maxWidth: "60%",
  },
  messageHeader: {
    fontSize: "12px",
    marginBottom: "4px",
    color: "#555",
    display: "flex",
    justifyContent: "space-between",
  },
  senderName: {
    fontWeight: "bold",
  },
  timestamp: {
    fontSize: "10px",
    color: "#888",
  },
  messageContent: {
    fontSize: "14px",
  },
  myMessage: {
    backgroundColor: "#fff",
    color: "#000",
    alignSelf: "flex-end",
  },
  otherMessage: {
    backgroundColor: "#1ED760",
    color: "#000",
    alignSelf: "flex-start",
  },
  form: {
    display: "flex",
  },
  input: {
    flex: 1,
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px 0 0 4px",
    outline: "none",
  },
  button: {
    padding: "10px 20px",
    border: "none",
    backgroundColor: "#0070f3",
    color: "#fff",
    borderRadius: "0 4px 4px 0",
    cursor: "pointer",
  },
};
