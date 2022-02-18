const msgQueue = [];
let sending = false;

function getter(server) {
  sending = true;

  const msg = msgQueue.shift();

  server.send(msg[0], msg[1], () => {
    if (msgQueue.length) {
      getter(server);
    } else {
      sending = false;
    }
  });
}

function setter(msg, server) {
  const closed = !sending && msgQueue.length === 0;
  msgQueue.push(msg);

  if (closed) {
    getter(server);
  }
}

module.exports = setter;
