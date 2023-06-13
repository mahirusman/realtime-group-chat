var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();
const { queryParser } = require("express-query-parser");
require("./utils/database");
const cors = require("cors");
var cron = require("node-cron");
const chatheadsRoutes = require("./app/chatHeads/route");
const messageRoutes = require("./app/message/route");
const socketApi = require("./socket");

var app = express();

// view engine setup
// app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "jade");
const whitelist = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://dev.hutfin.com",
  "https://stag.hutfin.com",
  "https://hutfin.com",
  "*hutfin.com",
  "https://dev-sso.hutfin.com",
  "http://localhost:6066",
  "https://dev-list.hutfin.com",
  "https://stg-list.hutfin.com",
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
// app.use(cors());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  queryParser({
    parseNull: true,
    parseUndefined: true,
    parseBoolean: true,
    parseNumber: true,
  })
);

app.use("/chatheads", chatheadsRoutes);
app.use("/messages", messageRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

socketApi.io.on("connection", (socket) => {
  console.log("Client socket is connected to the server");
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ error: err });
});

module.exports = app;
