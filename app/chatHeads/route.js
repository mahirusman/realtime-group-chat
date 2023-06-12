var express = require("express");
const { created_chatHead_validation } = require("./middleware");
var router = express.Router();
const controller = require("./controller");
const { verifyAccessToken, consoleLog } = require("../../utils/helper");

router.get("/", [verifyAccessToken], (req, res, next) => {
  controller.getChatHeads(req, res, next);
});

router.post(
  "/",
  [verifyAccessToken, created_chatHead_validation],
  (req, res, next) => {
    controller.created_heads(req, res, next);
  }
);

router.put("/:chatHead", [verifyAccessToken], (req, res, next) => {
  controller.delete_chat(req, res, next);
});

router.post("/pin/:chatHead", [verifyAccessToken], (req, res, next) => {
  controller.ping_chatHead(req, res, next);
});

module.exports = router;
