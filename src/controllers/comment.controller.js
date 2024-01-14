import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";

const getVideoComments = async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!videoId)
        return res.status(403).json({ message: " videoId must required" });

    const aggregate = Comment.aggregate([
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },
        { $sort: { createdAt: -1 } },
    ]);

    const options = {
        page,
        limit,
    };

    const comments = await Comment.aggregatePaginate(aggregate, options);

    return res
        .status(200)
        .json({ message: "Comments fetched successfully", data: comments });
};

const addComment = async (req, res) => {
    // TODO: add a comment to a video

    const { videoId } = req.params;
    const { content } = req.body;

    if (!videoId || !content)
        return res
            .status(403)
            .json({ message: "videoId and content must required" });

    const comment = await Comment.create({
        video: videoId,
        content,
        owner: req.user._id,
    });

    const createdComment = await Comment.findById(comment._id);

    return res.status(200).json({
        message: "Comment created successfully",
        data: createdComment,
    });
};

const updateComment = async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;

    const { content } = req.body;

    if (!commentId)
        return res.status(403).json({ message: "commentId must required" });

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { $set: { content } },
        { new: true },
    );

    return res.status(200).json({
        message: "Comment updated successfully",
        data: updatedComment,
    });
};

const deleteComment = async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    if (!commentId)
        return res.status(403).json({ message: "commentId must required" });

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json({ message: "Comment deleted successfully" });
};

export { getVideoComments, addComment, updateComment, deleteComment };
