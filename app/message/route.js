var express = require("express");
const {
  create_message_validation,
  get_messages_validation,
} = require("./middleware");
var router = express.Router();
const controller = require("./controller");
const { verifyAccessToken } = require("../../utils/helper");

router.post(
  "/",
  [verifyAccessToken, create_message_validation],
  (req, res, next) => {
    controller.create(req, res, next);
  }
);

router.get("/getMessageCount", [verifyAccessToken], (req, res, next) => {
  controller.un_readMessageCount(req, res, next);
});

router.get(
  "/:chatHead",
  [verifyAccessToken, get_messages_validation],
  (req, res, next) => {
    controller.getMessages(req, res, next);
  }
);

router.put(
  "/:chatId",
  [verifyAccessToken, get_messages_validation],
  (req, res, next) => {
    controller.delete_message(req, res, next);
  }
);

router.post(
  "/seenBy/:message",
  [verifyAccessToken, get_messages_validation],
  (req, res, next) => {
    controller.seen_message(req, res, next);
  }
);

module.exports = router;
