//TEAMWORK WITH KATHRIN REIßNER
import express = require('express');
import path = require('path');
import http = require('http');
import sio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = sio(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, '/client')));



const port = 8080;
app.listen(port, () => console.log(`Server is now listening on port ${port}...`));

// Handle the connection of new websocket clients
io.on('connection', function (socket) {
  // Handle an ArrowKey event

});

io.on('connection', function (socket) {
  let addedPlayer = false;

  socket.on('add player', function (newPlayer) {
    addedPlayer = true;

    socket.emit('login');

    socket.broadcast.emit('player joined');
  });
  socket.on('ArrowKey', function (code) {
    console.log(`${code} pressed`);

    // Broadcast the event to all connected clients except the sender
    socket.broadcast.emit('ArrowKey', code);
  });

  socket.on('disconnect', function () {
    if (addedPlayer) {
      socket.broadcast.emit('player left');
    }
  });
});

