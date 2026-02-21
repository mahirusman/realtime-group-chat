let socketIo = require("socket.io");
const { isValidToken } = require("./utils/helper");
let io = socketIo();
let socketApi = {};

const extractSocketToken = (socket) => {
  const token =
    socket.handshake?.auth?.token ||
    socket.handshake?.headers?.authorization ||
    socket.handshake?.query?.token;

  if (Array.isArray(token)) {
    return token[0];
  }

  return token;
};

io.use((socket, next) => {
  const token = extractSocketToken(socket);
  const payload = isValidToken(token);

  if (!payload || !payload.userId) {
    return next(new Error("Unauthorized"));
  }

  socket.user = {
    userId: payload.userId,
  };

  next();
});

socketApi.io = io;
module.exports = socketApi;
