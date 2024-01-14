import mongoose from "mongoose";
import { Like } from "../models/like.model.js";

const toggleVideoLike = async (req, res) => {
    const { videoId } = req.params;
    //TODO: toggle like on video

    const isExist = await Like.findOne({ video: videoId });

    if (isExist) {
        await Like.findByIdAndDelete(isExist._id);
    } else {
        await Like.create({ video: videoId, likedBy: req.user._id });
    }

    const isLiked = await Like.findOne({ video: videoId });

    return res.status(200).json({ message: "Success!", data: isLiked });
};

const toggleCommentLike = async (req, res) => {
    const { commentId } = req.params;
    //TODO: toggle like on comment
    const isExist = await Like.findOne({ comment: commentId });

    if (isExist) {
        await Like.findByIdAndDelete(isExist._id);
    } else {
        await Like.create({ comment: commentId, likedBy: req.user._id });
    }

    const isLiked = await Like.findOne({ comment: commentId });

    return res.status(200).json({ message: "Success!", data: isLiked });
};

const toggleTweetLike = async (req, res) => {
    const { tweetId } = req.params;
    //TODO: toggle like on tweet
    const isExist = await Like.findOne({ tweet: tweetId });

    if (isExist) {
        await Like.findByIdAndDelete(isExist._id);
    } else {
        await Like.create({ tweet: tweetId, likedBy: req.user._id });
    }

    const isLiked = await Like.findOne({ tweet: tweetId });

    return res.status(200).json({ message: "Success!", data: isLiked });
};

const getLikedVideos = async (req, res) => {
    //TODO: get all liked videos
    const videos = await Like.aggregate([
        {
            $match: {
                $and: [
                    {
                        likedBy: new mongoose.Types.ObjectId(req.user._id),
                        video: { $exists: true },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
            },
        },
        {
            $addFields: {
                video: {
                    $first: "$video",
                },
            },
        },
    ]);

    return res
        .status(200)
        .json({ message: "Liked videos fetched successfully", data: videos });
};

export { toggleCommentLike, toggleVideoLike, toggleTweetLike, getLikedVideos };
