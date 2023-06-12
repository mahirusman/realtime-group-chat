const { ResponseObject } = require("../../utils/helper");
const MessageModel = require("./model");
const ChatHeadModel = require("../chatHeads/model");

const { mongo } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const socketApi = require("../../socket");

class Controller {
  setter(obj) {
    const keys = Object.keys(obj);

    keys.map((key) => (this[key] = obj[key]));
  }

  async create(req, res) {
    try {
      const { chatHead, medias, body } = req.body;
      const { userId } = req.payload;

      const records = await ChatHeadModel.findById(chatHead).populate(
        "participant"
      );

      console.log("records", records);

      const receiver =
        records.participant[
          records.participant.findIndex((data) => data._id != userId)
        ]._id;
      console.log("receiver", receiver);
      const createdResults = (
        await MessageModel.create({
          chatHead,
          sentBy: userId,
          receivedBy: receiver,
          medias,
          seenBy: [userId],
          body,
        })
      ).toObject();

      console.log("sending", `${receiver}-message`.toString());
      socketApi.io.emit(`${receiver}-message`.toString(), {
        ...createdResults,
        userData: records,
      });

      this.setter({
        status: 200,
        success: true,
        msg: messages.success,
        data: { ...createdResults, userData: records },
      });
    } catch (error) {
      console.log(error, "error");
      this.setter({
        status: 500,
        success: false,
        msg: messages.serverErr,
        data: {},
      });
    }

    return ResponseObject(res, {
      status: this.status,
      success: this.success,
      message: this.msg,
      data: this.data,
    });
  }

  async getMessages(req, res) {
    try {
      const { chatHead } = req.params;
      const { userId } = req.payload;

      console.log("userId", userId);

      let matchQuery = {
        chatHead: ObjectId(chatHead),
        deletedByUsers: { $nin: [ObjectId(userId)] },
      };

      const records = await MessageModel.aggregate([
        {
          $match: {
            ...matchQuery,
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $lookup: {
            from: "users",
            let: {
              sentBy: "$sentBy",
              receivedBy: "$receivedBy",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$_id", "$$sentBy"] },
                      { $eq: ["$_id", "$$receivedBy"] },
                    ],
                  },
                },
              },

              {
                $project: {
                  firstName: 1,
                  lastName: 1,
                  email: 1,
                  avatar: 1,
                  _id: 1,
                  defaultProfileRole: 1,
                  creProfileRole: 1,
                },
              },
            ],

            as: "userData",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            chat: {
              $push: "$$ROOT",
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

      await MessageModel.updateMany(
        {
          chatHead,
        },
        {
          $addToSet: {
            seenBy: userId,
          },
        },
        { new: true }
      );

      this.setter({
        status: 200,
        success: true,
        msg: messages.success,
        data: records,
      });
    } catch (error) {
      console.log(error, "error");
      this.setter({
        status: 500,
        success: false,
        msg: messages.serverErr,
        data: {},
      });
    }

    return ResponseObject(res, {
      status: this.status,
      success: this.success,
      message: this.msg,
      data: this.data,
    });
  }

  async delete_message(req, res, next) {
    try {
      const { userId } = req.payload;

      const results = await MessageModel.findOneAndUpdate(
        {
          _id: req.params.chatId,
          deletedByUsers: { $nin: [userId] },
          sentBy: userId,
        },
        { $push: { deletedByUsers: userId } },
        { new: true }
      );

      this.setter({
        status: 200,
        success: true,
        msg: messages.success,
        data: results,
      });
    } catch (error) {
      console.log(error, "ERROR");
      this.setter({
        status: 500,
        success: false,
        msg: messages.typeError,
        data: {},
      });
    }

    return ResponseObject(res, {
      status: this.status,
      success: this.success,
      message: this.msg,
      data: this.data,
    });
  }

  async seen_message(req, res, next) {
    try {
      const { userId } = req.payload;
      await MessageModel.updateMany(
        { _id: req.params.message },
        { $addToSet: { seenBy: userId } }
      );

      // await ChatHeadModel.updateOne(
      //   { _id: req.params.chatHead },
      //   { lastMessage: "" }
      // );

      this.setter({
        status: 200,
        success: true,
        msg: messages.success,
        data: {},
      });
    } catch (error) {
      console.log(error, "ERROR");
      this.setter({
        status: 500,
        success: false,
        msg: messages.typeError,
        data: {},
      });
    }

    return ResponseObject(res, {
      status: this.status,
      success: this.success,
      message: this.msg,
      data: this.data,
    });
  }

  async un_readMessageCount(req, res, next) {
    try {
      const { userId } = req.payload;
      console.log("userId12", userId);
      const unReadMessagesCount = await MessageModel.find({
        receivedBy: userId,
        sentBy: { $ne: userId },
        deletedByUsers: { $nin: [userId] },
        seenBy: { $nin: [userId] },
      }).count();

      console.log("unReadMessagesCount", unReadMessagesCount);

      this.setter({
        status: 200,
        success: true,
        msg: messages.success,
        data: unReadMessagesCount,
      });
    } catch (error) {
      console.log(error, "ERROR");
      this.setter({
        status: 500,
        success: false,
        msg: messages.typeError,
        data: {},
      });
    }

    return ResponseObject(res, {
      status: this.status,
      success: this.success,
      message: this.msg,
      data: this.data,
    });
  }

  // async getAllRooms(req, res, next) {
  //   try {
  //     const { userId } = req.payload;
  //     let { searchQuery } = req.query;
  //     const query = {
  //       $and: [
  //         {
  //           deletedByUser: {
  //             $nin: [new mongo.ObjectId(userId)],
  //           },
  //         },
  //         {
  //           isDeleted: false,
  //           // isGroupMessage: true,
  //         },
  //         {
  //           $or: [
  //             { users: { $in: [new mongo.ObjectId(userId)] } },
  //             { createdBy: new mongo.ObjectId(userId) },
  //           ],
  //         },
  //       ],
  //     };
  //     const search = [];
  //     if (searchQuery) {
  //       search.push({
  //         $match: {
  //           "users.name": { $regex: searchQuery, $options: "i" },
  //         },
  //       });
  //     }
  //     const allRooms = await Room.aggregate([
  //       {
  //         $lookup: {
  //           from: "messages",
  //           localField: "lastMessage",
  //           foreignField: "_id",
  //           as: "lastMessage",
  //         },
  //       },
  //       {
  //         $match: query,
  //       },
  //       {
  //         $lookup: {
  //           from: "users",
  //           localField: "users",
  //           foreignField: "_id",
  //           as: "users",
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: "users",
  //           localField: "createdBy",
  //           foreignField: "_id",
  //           as: "createdBy",
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: "groups",
  //           localField: "group",
  //           foreignField: "_id",
  //           as: "group",
  //         },
  //       },
  //       ...search,
  //       { $sort: { "lastMessage.createdAt": -1 } },
  //       {
  //         $project: {
  //           lastMessage: {
  //             _id: 1,
  //             body: 1,
  //             sentBy: 1,
  //             receivedBy: 1,
  //           },
  //           mutedMembers: 1,
  //           isGroupMessage: 1,
  //           isClosed: 1,
  //           users: {
  //             _id: 1,
  //             name: 1,
  //             avatar: 1,
  //             email: 1,
  //           },
  //           mute: 1,
  //           createdBy: {
  //             _id: 1,
  //             name: 1,
  //             avatar: 1,
  //             email: 1,
  //           },
  //           group: {
  //             $let: {
  //               vars: {
  //                 firstUser: {
  //                   $arrayElemAt: ["$group", 0],
  //                 },
  //               },
  //               in: {
  //                 title: "$$firstUser.title",
  //                 admin: "$$firstUser.admin",
  //                 groupImage: "$$firstUser.groupImage",
  //                 _id: "$$firstUser._id",
  //               },
  //             },
  //           },
  //         },
  //       },
  //     ]);
  //     // get unseen messages count from all the room by above query
  //     const promises = [];
  //     allRooms.forEach((room) => {
  //       promises.push(
  //         Message.find({
  //           $and: [{ seenBy: { $nin: userId } }, { roomId: room._id }],
  //         }).count()
  //       );
  //     });
  //     const unseenCountOfRooms = await Promise.all(promises);
  //     for (let i = 0; i < allRooms.length; i++) {
  //       allRooms[i] = {
  //         ...allRooms[i],
  //         unSeenCount: unseenCountOfRooms[i],
  //       };
  //     }
  //     this.setter({
  //       status: 200,
  //       success: true,
  //       msg: messages.success,
  //       data: allRooms,
  //     });
  //     // unSeenCount: unseenCountOfRooms,
  //     // totalRooms: allRooms[0]?.paginationInfo[0]?.roomsCount,
  //     // page,
  //     // resPerPage
  //     // }
  //   } catch (error) {
  //     console.log(error);
  //     this.setter({
  //       status: 500,
  //       success: false,
  //       msg: messages.typeError,
  //       data: {},
  //     });
  //   }
  //   return ResponseObject(res, {
  //     status: this.status,
  //     success: this.success,
  //     message: this.msg,
  //     data: this.data,
  //   });
  // }

  // async get_all_messages_of_room(req, res, next) {
  //   try {
  //     const { userId } = req.payload;
  //     let { page, resPerPage, search, roomId } = req.query;
  //     let query = [];

  //     query.push({ roomId: roomId, deletedByUser: { $nin: [userId] } });

  //     // search message from chat
  //     if (search) {
  //       let context = new RegExp(search, "i");
  //       query.push({ body: context });
  //     }

  //     const [messages, messagesCount] = await Promise.all([
  //       Message.find({ $and: [...query] })
  //         .populate("sentBy", "avatar name email")
  //         .populate("receivedBy", "avatar name email")
  //         .skip(resPerPage * page - resPerPage)
  //         .limit(resPerPage),
  //       // .sort({ createdAt: -1 }),
  //       Message.find({ $and: [...query] }).count(),
  //     ]);

  //     const respObj = {
  //       messages: messages,
  //       current_page: page,
  //       pages: Math.ceil(messagesCount / resPerPage),
  //       total_messages: messagesCount,
  //       per_page: resPerPage,
  //     };
  //     this.setter({
  //       status: 200,
  //       success: true,
  //       msg: messages.success,
  //       data: respObj,
  //     });
  //   } catch (error) {
  //     console.log(error, "ERROR");
  //     this.setter({
  //       status: 500,
  //       success: false,
  //       msg: messages.typeError,
  //       data: {},
  //     });
  //   }

  //   return ResponseObject(res, {
  //     status: this.status,
  //     success: this.success,
  //     message: this.msg,
  //     data: this.data,
  //   });
  // }
}

module.exports = new Controller();
