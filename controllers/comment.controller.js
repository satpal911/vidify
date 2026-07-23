import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video ID formatting");
    }

    const aggregateResult = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $facet: {
                metadata: [
                    { $count: "totalComments" }
                ],
                paginatedData: [
                    { $skip: skipNum },
                    { $limit: limitNum },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        }
                    },
                    {
                        $unwind: {
                            path: "$ownerDetails",
                            preserveNullAndEmptyArrays: true
                        }
                    },

                    {
                        $project: {
                            _id: 1,
                            content: 1,
                            video: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            owner: {
                                _id: "$ownerDetails._id",
                                username: "$ownerDetails.username",
                                fullName: "$ownerDetails.fullName",
                                avatar: "$ownerDetails.avatar"
                            }
                        }
                    }
                ]
            }
        }
    ]);

    const totalComments = aggregateResult[0]?.metadata[0]?.totalComments || 0;
    const commentsList = aggregateResult[0]?.paginatedData || [];
    const totalPages = Math.ceil(totalComments / limitNum);

    const responseData = {
        comments: commentsList,
        pagination: {
            totalComments,
            totalPages,
            currentPage: pageNum,
            limit: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
        }
    };

    return res
        .status(200)
        .json(new ApiResponse(200, responseData, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video ID formatting");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required to add a comment");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    });

    if (!comment) {
        throw new ApiError(500, "Something went wrong while creating the comment");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid Comment ID formatting");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required to update a comment");
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        { content },
        { new: true }
    );

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid Comment ID formatting");
    }

    const comment = await Comment.findByIdAndDelete(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Comment deleted successfully"));
});
export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};
