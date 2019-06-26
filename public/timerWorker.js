let minutes;
let seconds = 0;

let clock;

this.onmessage = function (event) {
  let ended = false;
  minutes = event.data;
  clock = setInterval(() => { 
    if (minutes <= 0 && seconds <= 0) {
      postMessage({minutes: 0, seconds: 0, ended: true});
      clearInterval(clock);
      return;
    }
    if (seconds < 0) {
      seconds = 59;
      minutes--;
    }
    postMessage({minutes, seconds, ended: false});
    seconds--;
  }, 1000);
};