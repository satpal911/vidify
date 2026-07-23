import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "You must be logged in to toggle likes")
    }

    const searchCriteria = {
        video: new mongoose.Types.ObjectId(videoId),
        likedBy: new mongoose.Types.ObjectId(req.user._id)
    }

    const like = await Like.findOne(searchCriteria)

    if (like) {
        await Like.deleteOne({ _id: like._id })
        
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Video unliked successfully")
        )
    } else {
        await Like.create(searchCriteria)
        
        return res.status(200).json(
            new ApiResponse(200, { isLiked: true }, "Video liked successfully")
        )
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID format")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "You must be logged in to toggle likes")
    }

    const searchCriteria = {
        comment: new mongoose.Types.ObjectId(commentId),
        likedBy: new mongoose.Types.ObjectId(req.user._id)
    }

    const like = await Like.findOne(searchCriteria)

    if (like) {
        await Like.deleteOne({ _id: like._id })
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Comment unliked successfully")
        )
    } else {
        await Like.create(searchCriteria)
        return res.status(200).json(
            new ApiResponse(200, { isLiked: true }, "Comment liked successfully")
        )
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID format")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "You must be logged in to toggle likes")
    }

    const searchCriteria = {
        tweet: new mongoose.Types.ObjectId(tweetId),
        likedBy: new mongoose.Types.ObjectId(req.user._id)
    }

    const like = await Like.findOne(searchCriteria)

    if (like) {
        await Like.deleteOne({ _id: like._id })
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Tweet unliked successfully")
        )
    } else {
        await Like.create(searchCriteria)
        return res.status(200).json(
            new ApiResponse(200, { isLiked: true }, "Tweet liked successfully")
        )
    }
})

// const getLikedVideos = asyncHandler(async (req, res) => {
//     const userId = req.user?._id

//     if (!userId) {
//         throw new ApiError(401, "Unauthorized request")
//     }

//     const likedVideos = await Like.find({ 
//         likedBy: new mongoose.Types.ObjectId(userId), 
//         video: { $exists: true } 
//     }).populate("video")

    const getLikedVideos = asyncHandler(async (req, res) => {
    if (!req.user?._id) throw new ApiError(401, "Unauthorized request")

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true, $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $unwind: {
                path: "$videoDetails",
                preserveNullAndEmptyArrays: false 
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "videoDetails.owner",
                foreignField: "_id",
                as: "creatorDetails"
            }
        },
        {
            $unwind: "$creatorDetails"
        },
        {
            $project: {
                _id: 1,
                likedAt: "$createdAt",
                video: {
                    _id: "$videoDetails._id",
                    videoFile: "$videoDetails.videoFile",
                    thumbnail: "$videoDetails.thumbnail",
                    title: "$videoDetails.title",
                    duration: "$videoDetails.duration",
                    views: "$videoDetails.views",
                    owner: {
                        _id: "$creatorDetails._id",
                        username: "$creatorDetails.username",
                        avatar: "$creatorDetails.avatar"
                    }
                }
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    )
})

export { 
    toggleCommentLike, 
    toggleTweetLike, 
    toggleVideoLike, 
    getLikedVideos 
}


