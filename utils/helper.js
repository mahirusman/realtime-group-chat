const nodemailer = require("nodemailer");
const JWT = require("jsonwebtoken");

const { bufferToHex } = require("ethereumjs-util");
const { recoverPersonalSignature } = require("eth-sig-util");
module.exports = {
  ResponseObject: (res, obj) => {
    return res.status(obj.status).send({
      status: obj.status,
      success: obj.success,
      message: obj.message,
      errors: obj.errors,
      data: obj.data,
    });
  },

  consoleLog: (msg) => {
    process.env.STAGE === "dev" && console.log(msg);
  },

  clearErrorMsg: (msg) => {
    let MSG = msg.split("/").join("");
    MSG = MSG.split('"').join("");
    MSG = MSG.includes("password")
      ? "Must Contain 8 Characters, One Uppercase, One Lowercase, One Number and one special case Character"
      : MSG;
    return MSG;
  },

  verifyAccessToken: (req, res, next) => {
    if (!req.headers["authorization"]) {
      return next(
        res.status(404).send({
          status: 404,
          success: false,
          message: "Token not found",
          data: {},
        })
      );
    }
    const token = req.headers["authorization"];
    let newToken = token.split("Bearer ")[1];
    JWT.verify(newToken, process.env.SECRETKEY, (err, payload) => {
      if (err) {
        return res.status(401).send({
          status: 401,
          success: false,
          message: "Verification Failed",
          data: {},
        });
      }

      req.payload = payload;
      // req.payload.userId = "6440cb1f904e4caf16daaab3";

      next();
    });
  },

  isValidToken: (JWTtoken) => {
    if (!JWTtoken) {
      return false;
    }
    let newToken = JWTtoken.split("Bearer ")[1];
    JWT.verify(newToken, process.env.SECRETKEY, (err, payload) => {
      if (err) {
        return false;
      }

      return payload;
    });
  },

  authentication: (req, res, next) => {
    if (!req.headers["x-web-user"]) {
      return next(
        res.status(404).send({
          status: 404,
          success: false,
          message: "Token not found",
          data: {},
        })
      );
    }
    const userId = req.headers["x-web-user"];
    req.payload = {
      userId,
    };
    next();
  },

  sendEmail: async (email, subject, text) => {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.MAILHOST,
        port: process.env.MAILPORT,
        auth: {
          user: process.env.MAILUSER,
          pass: process.env.MAILPASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SENDEREMAIL,
        to: email,
        subject: subject,
        html: text,
      });

      process.env.STAGE === "dev" && console.log("email sent successfully");
      return true;
    } catch (error) {
      process.env.STAGE === "dev" && console.log("email not sent");
      process.env.STAGE === "dev" && console.log(error);
      return false;
    }
  },
  decodeToken: (token) => {
    return JWT.verify(token, process.env.SECRETKEY, (err, payload) => {
      return payload.userId;
    });
  },
};

Array.prototype.restructureErrors = function () {
  try {
    // const errors = [];
    const errors = {};
    for (const item of this) {
      errors[item.path.shift()] = item.message.replace(/\"/g, "");
      //   errors.push({
      //     field: item.path.shift(),
      //     message: item.message.replaceAll('"', ""),
      //   });
    }
    return errors;
  } catch (error) {
    return false;
  }
};
String.prototype.isSignatureValid = function (signMsg, signature) {
  try {
    const msgBufferHex = bufferToHex(Buffer.from(signMsg, "utf8"));
    const address = recoverPersonalSignature({
      data: msgBufferHex,
      sig: signature,
    });

    return this.toLowerCase() === address.toLocaleLowerCase();
  } catch (error) {
    return false;
  }
};
