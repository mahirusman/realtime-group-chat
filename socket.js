let socketIo = require("socket.io");
const { isValidToken } = require("./utils/helper");
let io = socketIo();
let socketApi = {};

io.use((socket, next) => {
  const { token } = socket.handshake.query;

  if (!isValidToken(token)) {
    return next(new Error("Unauthorized"));
  }

  next();
});

socketApi.io = io;
module.exports = socketApi;
