const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let MessageSchema = new Schema(
  {
    chatHead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chat_heads",
      required: true,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    medias: [
      {
        name: { type: String },
        ext: { type: String },
        size: { type: Number },
        url: { type: String },
      },
    ], // to store media files links
    body: {
      type: String,
    },

    deletedByUsers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "users", default: [] },
    ],
    seenBy: [
      { type: mongoose.Schema.Types.ObjectId, ref: "users", default: [] },
    ],
  },

  { timestamps: true }
);

const Message = mongoose.model("message", MessageSchema);
module.exports = Message;
