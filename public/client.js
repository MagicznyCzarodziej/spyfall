$(() => {
  const socket = io();
  let username = 'Anonim';
  let isAdmin = false;
  let myRoomId = null;
  let tryingToJoin = false;

  function changePage(page) {
    $('.page').hide();
    $('#' + page).show();

    switch(page) {
      case 'home': break;
      case 'lobby':
        $('#players-list').html(''); // Clear players list
        if (isAdmin) {
          $('.admin').show();
          $('.not-admin').hide();
        } else {
          $('.admin').hide();
          $('.not-admin').show();
        }
        break;
      case 'game':
        $('.location').removeClass('selected'); // Clear selections from last game
        break;
    }
  }

  // Create lobby
  $('#create').on('click', () => {
    username = $('#username-input').val();
    if(username.length < 3) return; // Change this to show error

    socket.emit('username', username);
    socket.emit('create-room');
  });

  socket.on('room-created', (roomId) => {
    isAdmin = true;
    myRoomId = roomId;
    changePage('lobby');
    $('#players-list').html(`<div class="player" data-user_id="admin">${username}</div>`)
  });

  // Close lobby
  $('#cancel-lobby').on('click', () => {
    if (isAdmin) {
      socket.emit('close-room');
      isAdmin = false;
    } else socket.emit('leave-room');
    myRoomId = null;
    changePage('home');
  });

  // Show rooms list
  $('#show-rooms').on('click', () => {
    username = $('#username-input').val();
    if(username.length < 3) return; // Change this to show error
    socket.emit('username', username);
    socket.emit('show-rooms');
    changePage('rooms');
  });

  socket.on('rooms-list', (rooms) => {
    if (rooms.length === 0) $('#rooms-label').text('Brak pokoi');
    else {
      $('#rooms-label').text('Wybierz pokój:');
      $('#rooms-list').html('');
    }
    rooms.forEach((room) => {
      $('#rooms-list').append(`<div class="room" data-id=${room}>${room}</div>`);
    });
  });

  // Close rooms list
  $('#cancel-rooms').on('click', () => {
    tryingToJoin = false;
    myRoomId = null;
    changePage('home')
  });

  // Join lobby
  $('#rooms-list').on('click', '.room', function () {
    const roomId = $(this).data('id');
    tryingToJoin = true;
    myRoomId = roomId;
    socket.emit('join-room', roomId);
  });

  socket.on('join-failed', () => {
    myRoomId = null;
    console.log('Dołączanie nieudane');
  });

  socket.on('joined-room', (users) => {
    if (!tryingToJoin) return;
    isAdmin = false;
    tryingToJoin = false;

    changePage('lobby');
    console.log(users);
    users.forEach((user) => {
      $('#players-list').append(`<div class="player" data-user_id=${user.userId}>${user.username}</div>`)
    });
  });

  // User joined
  socket.on('user-joined', (user) => {
    $('#players-list').append(`<div class="player" data-user_id=${user.userId}>${user.username}</div>`)
  });

  // User left
  socket.on('user-left', (userId) => {
    $(`.player[data-user_id=${userId}]`).fadeOut(500, function () {
      $(this).remove();
    });
  });

  // New room
  socket.on('new-room', (roomId) => {
    $('#rooms-list').fadeOut(300, function () {
      $(this).prepend(`<div class="room" data-id=${roomId}>${roomId}</div>`).fadeIn(200);
    });
  });

  // Room closed
  socket.on('closed-room', (roomId) => {
    if (roomId === myRoomId) {
      socket.emit('leave-room');
      myRoomId = null;
      changePage('home');
    }

    $(`.room[data-id=${roomId}]`).fadeOut(500, function () {
      $(this).remove();
    });
  });

  // Start game
  $('#start').on('click', () => {
    const time = $('input[name="time-input"]').val();
    socket.emit('start-game', time);
  });

  socket.on('game-started', (data) => {
    myRoomId = null;
    changePage('game');
    $('#player-name').html(`${username}`);
    const isSpy = data.isSpy;
    const time = data.time;
    $('#time-left').html(time + ':00');
    // Start clock
    let minutes = time;
    let seconds = 0;
    const clock = setInterval(() => {
      if (minutes == 0 && seconds == 0) {
        $('#time-left').html('Koniec czasu!').css('color', 'red');
        clearInterval(clock);
        return;
      }
      if (seconds < 0) {
        seconds = 59;
        minutes--;
      }
      $('#time-left').html(minutes + ':' + ('0' + seconds).slice(-2));
      seconds--;
    }, 1000);

    if (isSpy) {
      $('#player-role').html('<span>Jesteś</span> szpiegiem');
      $('#player-location').html('');
      $('#player-location').hide();
    } else {
      const role = data.role;
      const location = data.location;
      const imageUrl = data.imageUrl;
      $('#player-role').html(`Postać: <span>${role}</span>`);
      $('#player-location').show().css('background-image', `url("${imageUrl}")`);
      $('#player-location').html(`Miejsce: <span>${location}</span>`);
    }
  });

  // Check location
  $('.location').on('click', function() {
    $(this).toggleClass('selected');
  });
}); //DOM Ready
