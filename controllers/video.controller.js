import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const videos = await Video.find(query ? {title: {$regex: query, $options: "i"}} : {})
        .sort(sortBy ? {[sortBy]: sortType === "desc" ? -1 : 1} : {})
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate("owner", "-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"))

    
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    const videoFile = req.files?.videoFile?.[0]?.path
    const thumbnail = req.files?.thumbnail?.[0]?.path

    if (!videoFile || !thumbnail) {
        throw new ApiError(400, "Video file and thumbnail are required")
    }

    const videoFileCloud = await uploadOnCloudinary(videoFile)
    const thumbnailCloud = await uploadOnCloudinary(thumbnail)

    if (!videoFileCloud || !thumbnailCloud) {
        throw new ApiError(500, "Failed to upload video or thumbnail to cloudinary")
    }

    const video = await Video.create({
        videoFile: videoFileCloud.url,
        thumbnail: thumbnailCloud.url,
        title,
        description,
        duration: req.body.duration || 0,
        owner: req.user._id
    })

    return res.status(201).json(new ApiResponse(201, video, "Video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId).populate("owner", "-password -refreshToken")
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description, thumbnail} = req.body
    const video = await Video.findByIdAndUpdate(videoId, {title, description, thumbnail}, {new: true})
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findByIdAndDelete(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    return res.status(200).json(new ApiResponse(200, video, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    video.isPublished = !video.isPublished
    await video.save({ validateBeforeSave: false })
    return res.status(200).json(new ApiResponse(200, video, "Video publish status updated successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}