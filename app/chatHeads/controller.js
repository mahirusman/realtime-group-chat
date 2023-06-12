const { ResponseObject } = require("../../utils/helper");
const chatHeads = require("./model");
const messagesModel = require("../message/model");

const { mongo, Types } = require("mongoose");
const { ObjectId } = require("mongoose").Types;

class Controller {
  setter(obj) {
    const keys = Object.keys(obj);

    keys.map((key) => (this[key] = obj[key]));
  }

  async created_heads(req, res) {
    try {
      const { propertyId, propertyOwnerId, pageNumber, pageSize } = req.body;
      const { userId } = req.payload;
      const skip = (pageNumber - 1) * pageSize;
      const limit = pageSize;

      let results = await chatHeads
        .findOne({
          propertyId,
          participant: { $all: [userId, propertyOwnerId] },
        })
        .populate({
          path: "participant",
          model: "users",
          select:
            "firstName lastName email avatar userId _id defaultProfileRole creProfileRole",
        });

      if (!results) {
        results = await chatHeads.create({
          propertyId,
          participant: [ObjectId(userId), ObjectId(propertyOwnerId)],
        });
        results = await chatHeads
          .findOne({
            propertyId,
            participant: { $all: [userId, propertyOwnerId] },
          })
          .populate({
            path: "participant",
            model: "users",
            select:
              "firstName lastName email avatar userId _id defaultProfileRole creProfileRole",
          });
      }

      this.setter({
        status: 200,
        success: true,
        msg: messages.success,
        data: results,
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

  async getChatHeads(req, res) {
    try {
      const { userId } = req.payload;
      const { chatId } = req.query;
      console.log(userId);
      let matchQueryWithIn = [
        { participant: { $in: [ObjectId(userId)] } },
        { deletedByUsers: { $nin: [ObjectId(userId)] } },
        { userPine: { $in: [ObjectId(userId)] } },
      ];

      let matchQueryWithOutIn = [
        { participant: { $in: [ObjectId(userId)] } },
        { deletedByUsers: { $nin: [ObjectId(userId)] } },
        { userPine: { $nin: [ObjectId(userId)] } },
      ];

      if (req.query?.search && req.query?.search != "") {
        matchQueryWithIn.push({
          $or: [
            {
              "participants.firstName": {
                $regex: req.query?.search,
                $options: "i",
              },
            },
            {
              "participants.lastName": {
                $regex: req.query?.search,
                $options: "i",
              },
            },
          ],
        });
        matchQueryWithOutIn.push({
          $or: [
            {
              "participants.firstName": {
                $regex: req.query?.search,
                $options: "i",
              },
            },
            {
              "participants.lastName": {
                $regex: req.query?.search,
                $options: "i",
              },
            },
          ],
        });
      }

      const pinHeads = await chatHeads.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "participant",
            foreignField: "_id",
            as: "participants",
          },
        },
        {
          $lookup: {
            from: "listings",
            localField: "propertyId",
            foreignField: "_id",
            as: "propertyId",
          },
        },
        {
          $match: {
            $and: matchQueryWithIn,
          },
        },
        {
          $lookup: {
            from: "messages",
            let: { chatId: "$_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    {
                      $expr: {
                        $and: [
                          { $eq: ["$chatHead", "$$chatId"] },
                          { $eq: ["$receivedBy", new Types.ObjectId(userId)] },
                        ],
                      },
                    },
                    { deletedByUsers: { $nin: [new Types.ObjectId(userId)] } },
                    { seenBy: { $nin: [new Types.ObjectId(userId)] } },
                  ],
                },
              },
            ],
            as: "unreadMessageCount",
          },
        },
        {
          $lookup: {
            from: "messages",
            let: { chatId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$chatHead", "$$chatId"] },
                },
              },
              { $limit: 1 },
            ],
            as: "messages",
          },
        },
        {
          $match: {
            $or: [
              { messages: { $exists: true, $ne: [] } },
              { _id: new Types.ObjectId(chatId) },
            ],
          },
        },
        {
          $addFields: {
            unreadMessageCount: { $size: "$unreadMessageCount" },
            messagesCount: { $size: "$messages" },
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $project: {
            _id: 1,
            deletedByUsers: 1,
            lastMessage: 1,
            userPine: 1,
            createdAt: 1,
            updatedAt: 1,
            "participants._id": 1,
            "participants.firstName": 1,
            "participants.lastName": 1,
            "participants.email": 1,
            "participants.creProfileRole": 1,
            "participants.defaultProfileRole": 1,
            "participants.avatar": 1,
            "propertyId._id": 1,
            "propertyId.propertyType": 1,
            "propertyId.listingType": 1,
            "propertyId.propertySubCategory": 1,
            "propertyId.propertyName": 1,
            "propertyId.businessModel": 1,
            "propertyId.businessName": 1,
            unreadMessageCount: 1,
          },
        },
      ]);
      const chatHead = await chatHeads.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "participant",
            foreignField: "_id",
            as: "participants",
          },
        },
        {
          $lookup: {
            from: "listings",
            localField: "propertyId",
            foreignField: "_id",
            as: "propertyId",
          },
        },
        {
          $match: {
            $and: matchQueryWithOutIn,
          },
        },
        {
          $lookup: {
            from: "messages",
            let: { chatId: "$_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    {
                      $expr: {
                        $and: [
                          { $eq: ["$chatHead", "$$chatId"] },
                          { $eq: ["$receivedBy", new Types.ObjectId(userId)] },
                        ],
                      },
                    },
                    { deletedByUsers: { $nin: [new Types.ObjectId(userId)] } },
                    { seenBy: { $nin: [new Types.ObjectId(userId)] } },
                  ],
                },
              },
            ],
            as: "unreadMessageCount",
          },
        },
        {
          $lookup: {
            from: "messages",
            let: { chatId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$chatHead", "$$chatId"] },
                },
              },
              { $limit: 1 },
            ],
            as: "messages",
          },
        },
        {
          $match: {
            $or: [
              { messages: { $exists: true, $ne: [] } },
              { _id: new Types.ObjectId(chatId) },
            ],
          },
        },
        {
          $addFields: {
            unreadMessageCount: { $size: "$unreadMessageCount" },
            messagesCount: { $size: "$messages" },
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $project: {
            _id: 1,
            deletedByUsers: 1,
            lastMessage: 1,
            userPine: 1,
            createdAt: 1,
            updatedAt: 1,
            "participants._id": 1,
            "participants.firstName": 1,
            "participants.lastName": 1,
            "participants.email": 1,
            "participants.creProfileRole": 1,
            "participants.defaultProfileRole": 1,
            "participants.avatar": 1,
            "propertyId._id": 1,
            "propertyId.propertyType": 1,
            "propertyId.listingType": 1,
            "propertyId.propertySubCategory": 1,
            "propertyId.businessModel": 1,
            "propertyId.businessName": 1,
            "propertyId.propertyName": 1,
            unreadMessageCount: 1,
          },
        },
      ]);

      this.setter({
        status: 200,
        success: true,
        msg: messages.success,
        data: {
          pinHeads,
          chatHeads: chatHead,
        },
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

  async delete_chat(req, res, next) {
    try {
      const { userId } = req.payload;

      const [deleteHeads, deleteMessages] = await Promise.allSettled([
        chatHeads.findOneAndUpdate(
          { _id: req.params.chatHead, deletedByUsers: { $nin: [userId] } },
          { $push: { deletedByUsers: userId } },
          { new: true }
        ),
        messagesModel.updateMany(
          { chatHead: req.params.chatHead, deletedByUsers: { $nin: [userId] } },
          { $push: { deletedByUsers: userId } },
          { new: true }
        ),
      ]);

      this.setter({
        status: 200,
        success: true,
        msg: messages.success,
        data: { deleteHeads },
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

  async ping_chatHead(req, res, next) {
    try {
      const { status } = req.body;
      const { userId } = req.payload;

      let response;
      if (status) {
        response = await chatHeads.updateOne(
          { _id: req.params.chatHead },
          { $push: { userPine: userId } },
          { new: true }
        );
      } else {
        response = await chatHeads.updateOne(
          { _id: req.params.chatHead },
          { $pull: { userPine: userId } },
          { new: true }
        );
      }

      this.setter({
        status: 200,
        success: true,
        msg: messages.success,
        data: response,
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
}

module.exports = new Controller();
