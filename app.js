const express = require('express');
const app = express();
const path = require('path');
const http = require('http').Server(app);
const io = require('socket.io')(http);

const rooms = {};
const users = {}; // {userId:roomId/null}

// Game
const locations = [{place: 'Szpital', roles: ['Pięlęgniarka', 'Lekarz', 'Chirurg', 'Kierownik oddziału', 'Salowa', 'Pacjent'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Restauracja', roles: ['Szef kuchni', 'Kucharz', 'Właściciel', 'Magda Gessler', 'Gość', 'Gość', 'Bloger kulinarny'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Statek pasażerski', roles: ['Kucharz', 'Pasażer', 'Pasażer', 'Kapitan', 'Członek załogi', 'Mechanik'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Zoo', roles: ['Zwiedzający', 'Dyrektor', 'Karmiciel zwierząt', 'Sprzątacz', 'Przewodnik', 'Kierownik ochrony'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Łódź podwodna', roles: ['Kapitan', 'Żołnierz', 'Nawigator', 'Radiowec', 'Mechanik', 'Członek załogi'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Szkoła', roles: ['Uczeń', 'Uczeń', 'Nauczyciel', 'Nauczyciel', 'Sprzątaczka', 'Dyrektor', 'Kierownik', 'Konserwator', 'Psycholog'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Stacja kosmiczna', roles: ['Astronauta', 'Kosmonauta', 'Astronauta', 'Kosmonauta','Astronauta', 'Tajkonauta'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Teatr', roles: ['Aktor', 'Aktor', 'Aktor', 'Reżyser', 'Scenarzysta', 'Charakteryzator', 'Oświetleniowiec', 'Widz'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Ambasada', roles: ['Kierownik ochrony', 'Sprzątaczka', 'Pracownik', 'Konsul', 'Księgowa', 'Sekretarz'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Samolot', roles: ['Pasażer', 'Pasażer', 'Stewardessa', 'Pilot', 'Drugi pilot', 'Tajny ochroniarz'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Bank', roles: ['Kasjer', 'Ochroniarz', 'Klient', 'Konwojent', 'Rabuś'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Kościół', roles: ['Ksiądz', 'Ministrant', 'Kościelny', 'Organista', 'Biskup', 'Wierny'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Namiot cyrkowy', roles: ['Klaun', 'Treser zwierząt', 'Człowiek guma', 'Widz', 'Połykacz ostrzy', 'Żongler'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Korporacja', roles: ['Prezes', 'Korposzczur', 'Sprzątaczka', 'Sekretarka', 'Manager', 'Dyrektor', 'Specjalista PR'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Stacja polarna', roles: ['Naukowiec', 'Naukowiec', 'Lekarz', 'Badacz', 'Klimatolog', 'Geolog'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Supermarket', roles: ['Kasjerka', 'Ochroniarz', 'Klient', 'Prezes', 'Kierownik', 'Sprzątaczka'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Komisariat', roles: ['Policjant', 'Komendant', 'Aspirant', 'Porucznik', 'Ojciec Mateusz', 'Detektyw', 'Konfident'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Plan filmowy', roles: ['Reżyser', 'Scenarzysta', 'Scenograf', 'Charakteryzator', 'Aktor', 'Operator kamery'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Baza wojskowa', roles: ['Żołnierz', 'Czołgista', 'Snajper', 'Podporucznik', 'Szeregowy', 'Pułkownik'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Kasyno', roles: ['Gracz', 'Kierownik ochrony', 'Prezes', 'Krupier', 'Hostessa', 'Pokerzysta'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Pociąg pasażerski', roles: ['Konduktor', 'Pasażer', 'Maszynista', ''], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Statek piratów', roles: ['Pirat', 'Bosman', 'Czarnobrody', 'Majtek', 'Żółtodziób', 'Kpt. Jack Sparrow'], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Hotel', roles: ['Gość', 'Gość', 'Recepcjonistka', 'Sprzątaczka', ''], imageUrl: 'http://via.placeholder.com/300x150'},
{place: 'Plaża', roles: ['Plażowicz', 'Plażowicz', 'Sprzedawca hotdogów', 'Nudysta', 'Ratownik', 'Polak z parawanem'], imageUrl: 'http://via.placeholder.com/300x150'}];

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('IO | User connected');
  let addedUser = false;

  // Register user
  socket.on('username', (username) => {
    if (addedUser) return;

    socket.username = username;
    users[socket.id] = null;
    addedUser = true;
    console.log(`IO | User nickname: ${username} ${socket.id}`);
  });

  // Room created
  socket.on('create-room', () => {
    const roomId = socket.username.slice(0,3) + '_' + Math.round(Math.random()*999999+100000);
    console.log(`IO | Room ${roomId} created by: ${socket.username} (${socket.id})`);
    rooms[roomId] = {adminId: socket.id, users: [{userId: socket.id, username: socket.username}]};

    users[socket.id] = roomId;
    socket.join(roomId);
    socket.emit('room-created', roomId);
    socket.broadcast.emit('new-room', roomId);
  });

  // Room closed
  socket.on('close-room', () => {
    const userRoom = users[socket.id];
    if (userRoom !== null && rooms[userRoom].adminId === socket.id) {
      delete rooms[userRoom];
      users[socket.id] = null;
      socket.leave(userRoom);
      socket.broadcast.emit('closed-room', userRoom); //Tell all users about closed room
      console.log(`IO | Room closed: ${userRoom}`);
    }
  });

  // Show rooms
  socket.on('show-rooms', () => {
    socket.emit('rooms-list', Object.keys(rooms));
  });

  // Leave room
  socket.on('leave-room', () => {
    const userRoom = users[socket.id];
    if (userRoom in rooms) {
      const userIndex = rooms[userRoom].users.map(function(e) { return e.userId; }).indexOf(socket.id);
      rooms[userRoom].users.splice(userIndex, 1);
      io.to(userRoom).emit('user-left', socket.id);
    }
    users[socket.id] = null;
    socket.leave(userRoom);
  });

  // Join lobby
  socket.on('join-room', (roomId) => {
    if (roomId in rooms) {
      socket.join(roomId);
      users[socket.id] = roomId;
      rooms[roomId].users.push({userId: socket.id, username: socket.username});
      socket.emit('joined-room', rooms[roomId].users)
      socket.broadcast.to(roomId).emit('user-joined', {userId: socket.id, username: socket.username});
    } else socket.emit('join-failed');
  });
  // Start game
  socket.on('start-game', (time) => {
    const userRoom = users[socket.id];
    if (rooms[userRoom].adminId !== socket.id) return;

    // Choose random location
    const location = locations[Math.floor(Math.random()*locations.length)];
    const locationName = location.place;
    const locationImage = location.imageUrl;
    const roles = location.roles;

    const usersIds = rooms[userRoom].users.map((user) => user.userId);
    const usersNumber = usersIds.length;
    // Choose spy
    const spyIndex = Math.floor(Math.random()*usersNumber);
    const spyId = usersIds.splice(spyIndex, 1);
    console.log("Spy index: " + spyIndex + ", spyId: " + spyId);
    io.sockets.to(spyId).emit('game-started', {isSpy: true, time: time});

    // Choose roles for the rest of the players
    usersIds.forEach((userId) => {
      const roleIndex = Math.floor(Math.random()*roles.length);
      const role = roles.splice(roleIndex, 1);

      io.sockets.to(userId).emit('game-started', {isSpy: false, location: locationName, role: role, imageUrl: locationImage, time: time});
      io.sockets.connected[userId].leave(userRoom);
      users[userId] = null;
    });

    //Close room
    delete rooms[userRoom];
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (!addedUser) return;
    // Leave room
    const userRoom = users[socket.id];
    if (userRoom in rooms) {
      const userIndex = rooms[userRoom].users.map(function(e) { return e.userId; }).indexOf(socket.id);
      rooms[userRoom].users.splice(userIndex, 1);
      io.to(userRoom).emit('user-left', socket.id);
    }

    socket.leave(userRoom);

    // Close room
    if (userRoom !== null && rooms[userRoom].adminId === socket.id) { // <- Cousing error on leaving game
      delete rooms[userRoom];
      socket.broadcast.emit('closed-room', userRoom); //Tell all users about closed room
      console.log(`IO | Room closed: ${userRoom}`);
    }
    users[socket.id] = null;

    console.log(`IO | User disconnected: ${socket.username}`);
  });
});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log("listening");
});
