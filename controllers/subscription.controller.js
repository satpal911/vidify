import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const subscriberId = req.user?._id

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID")
    }

    if (channelId === subscriberId?.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId
    })

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id)
        return res.status(200).json(new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully"))
    } else {
        await Subscription.create({
            subscriber: subscriberId,
            channel: channelId
        })
        return res.status(200).json(new ApiResponse(200, { subscribed: true }, "Subscribed successfully"))
    }
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params 

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid Subscriber/Channel ID")
    }

    const subscriberList = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails"
            }
        },
        {
            $unwind: "$subscriberDetails"
        },
        {
            $project: {
                _id: "$subscriberDetails._id",
                username: "$subscriberDetails.username",
                email: "$subscriberDetails.email",
                fullName: "$subscriberDetails.fullName",
                avatar: "$subscriberDetails.avatar"
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, { subscribers: subscriberList }, "Subscribers fetched successfully"))
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel/Subscriber ID")
    }

    const channelList = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $project: {
                _id: "$channelDetails._id",
                username: "$channelDetails.username",
                email: "$channelDetails.email",
                fullName: "$channelDetails.fullName",
                avatar: "$channelDetails.avatar"
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, { subscribedChannels: channelList }, "Subscribed channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
