"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//TEAMWORK WITH KATHRIN REIßNER
const express = require("express");
const path = require("path");
const http = require("http");
const sio = require("socket.io");
const app = express();
const server = http.createServer(app);
//server.listen(8080);
const io = sio(server);
app.use(express.json());
app.use(express.static(path.join(__dirname, '/client')));
const port = 8080;
app.listen(port, () => console.log(`Server is listening on port ${port}...`));
// Handle the connection of new websocket clients
io.on('connection', function (socket) {
    let addedPlayer = false;
    socket.on('add player', function (newPlayer) {
        addedPlayer = true;
        socket.emit('login');
        socket.broadcast.emit('player joined');
    });
    socket.on('ArrowKey', function (code) {
        console.log(`${code} pressed`);
        socket.broadcast.emit('ArrowKey', code);
    });
    socket.on('disconnect', function () {
        if (addedPlayer) {
            socket.emit('player left');
        }
    });
});
