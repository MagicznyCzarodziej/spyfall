const express = require('express');
const app = express();
const path = require('path');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const User = require('./User.js');
const Room = require('./Room.js');
const Location = require('./Location.js');

const users = [];
const rooms = [];

function deleteRoom(room) {
  const roomIndex = rooms.indexOf(room);
  rooms.splice(roomIndex, 1);
}

io.on('connection', (socket) => {
  console.log(`User connected - ID: ${socket.id}`);
  const user = new User(socket.id);
  users.push(user);

  let myRoom = null;

  // Register user
  socket.on('username', (username) => {
    user.setUsername(username);
    console.log(`Username set - ID: ${socket.id} : ${username}`);
  });

  socket.on('join-room', (roomId) => {
    if (myRoom !== null) return;
    for (let room of rooms) {
      if (room.getId() === roomId) {
        room.addUser(user);
        socket.join(roomId);
        const usersInRoom = room.getUsers();
        const usersList = usersInRoom.map((user) => ({userId: user.id, username: user.username}));
        myRoom = room;
        socket.emit('joined-room', usersList);
        socket.broadcast.to(roomId).emit('user-joined', {userId: socket.id, username: user.getUsername()});
        return;
      }
    }
    socket.emit('join-failed');
  });

  socket.on('create-room', () => {
    myRoom = new Room(user);
    rooms.push(myRoom);
    const roomId = myRoom.getId();
    socket.join(roomId);
    socket.emit('room-created', roomId);
    socket.broadcast.emit('new-room', roomId);
  });

  socket.on('close-room', () => {
    //TODO: Check if myRoom != null and if user is admin
    const roomId = myRoom.getId();
    deleteRoom(myRoom);
    myRoom = null;
    socket.leave(roomId);
    socket.broadcast.emit('closed-room', roomId);
  });

  socket.on('show-rooms', () => {
    myRoom = null;
    const roomsIds = rooms.map((room) => (room.getId()));
    socket.emit('rooms-list', roomsIds);
  });

  socket.on('leave-room', () => {
    if (myRoom === null) return;
    const roomId = myRoom.getId();
    myRoom.removeUser(user);
    myRoom = null;
    io.to(roomId).emit('user-left', socket.id);
    socket.leave(roomId);
  });

  socket.on('start-game', (data) => {
    if (myRoom.getAdminId() !== socket.id) return;
    const roomId = myRoom.getId();
    const {time, locationsPack} = data;
    const location = new Location(locationsPack);
    const locationName = location.getName();

    const usersInRoom = myRoom.getUsers();
    const usersCount = usersInRoom.length;

    // Choose spy
    const spyIndex = Math.floor(Math.random() * usersCount);
    const spyId = usersInRoom.splice(spyIndex, 1)[0].getId();
    io.sockets.to(spyId).emit('game-started', {isSpy: true, time: time, locationsPack: locationsPack});

    // Choose roles for the rest of the players
    for (let player of usersInRoom) {
      const userId = player.getId();
      const role = location.getRandomRole();

      io.sockets.to(userId).emit('game-started', {isSpy: false, location: locationName, role: role, time: time, locationsPack: locationsPack});
      io.sockets.connected[userId].leave(roomId);
    }

    deleteRoom(myRoom);
    socket.broadcast.emit('closed-room', roomId);
  });

  socket.on('disconnect', () => {
    // Leave room
    if (myRoom !== null) {
      myRoom.removeUser(user);
      const roomId = myRoom.getId();
      io.to(roomId).emit('user-left', socket.id);

      // Close room
      if (myRoom.getAdminId() === socket.id) {
        socket.broadcast.emit('closed-room', roomId);
        deleteRoom(myRoom);
      }
    }

    const userIndex = users.indexOf(user);
    users.splice(userIndex, 1);
    console.log(`User disconnected - ID: ${socket.id}`);
  });

});

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log("listening");
});
