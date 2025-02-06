const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"]
  }
});

const messagesFilePath = path.join(__dirname, 'messages.json');

let messagesData = {};
if (fs.existsSync(messagesFilePath)) {
  try {
    const data = fs.readFileSync(messagesFilePath);
    messagesData = JSON.parse(data);
  } catch (err) {
    console.error("Błąd przy odczytywaniu pliku messages.json:", err);
  }
} else {
  messagesData = {};
}

function saveMessagesData() {
  fs.writeFile(messagesFilePath, JSON.stringify(messagesData, null, 2), (err) => {
    if (err) console.error("Błąd przy zapisie pliku messages.json:", err);
  });
}

io.on('connection', (socket) => {
  console.log('Nowy klient połączony:', socket.id);

  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} dołączył do pokoju: ${room}`);
    if (messagesData[room]) {
      socket.emit('chatHistory', messagesData[room]);
    }
  });

  socket.on('privateMessage', (msgData) => {
    console.log(`Otrzymano wiadomość od ${msgData.sender} do pokoju ${msgData.room}:`, msgData);
    io.to(msgData.room).emit("privateMessage", msgData);
    if (!messagesData[msgData.room]) {
      messagesData[msgData.room] = [];
    }
    messagesData[msgData.room].push(msgData);
    saveMessagesData();
  });

  socket.on('addNewTrack', (track) => {
    console.log('Dodano nowy utwór:', track);
    const message = `Nowy utwór: ${track.title} - ${track.artist}`;
    io.emit("newTrack", { 
      message, 
      trackLink: track.link, 
      trackId: track.id, 
      timestamp: Date.now() 
    });
    console.log("Wysłano powiadomienie o nowym utworze:", message);
  });

  socket.on('followers_update', (data) => {
    console.log("Otrzymano zdarzenie followers_update od klienta:", data);
    io.emit('followers_update', data);
  });

  socket.on('playlist_share', (data) => {
    console.log("Otrzymano zdarzenie playlist_share:", data);
    data.recipients.forEach(recipientId => {
      io.to(recipientId).emit('playlist_share', data);
      console.log(`Wysłano zdarzenie playlist_share do użytkownika ${recipientId}`);
      
      if (!messagesData[recipientId]) {
        messagesData[recipientId] = [];
      }
      messagesData[recipientId].push(data);
    });
    saveMessagesData();
  });

  socket.on('disconnect', () => {
    console.log('Klient rozłączony:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Serwer WebSocket działa na porcie ${PORT}`);
});
