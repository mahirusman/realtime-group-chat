const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let ChatHeadSchema = new Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "listings",
      required: true,
    },
    participant: [
      { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    ],

    deletedByUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    lastMessage: { type: String },
    userPine: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    userMute: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  },

  { timestamps: true }
);
mongoose.model("users", new Schema());

const ChatHead = mongoose.model("chat_heads", ChatHeadSchema);
module.exports = ChatHead;
