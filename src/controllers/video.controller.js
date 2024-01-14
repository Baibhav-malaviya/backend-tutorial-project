import mongoose, { mongo } from "mongoose";
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination

    var regexPattern = new RegExp(query, "i");

    const aggregate = Video.aggregate([
        {
            $match: {
                $and: [
                    { _id: new mongoose.Types.ObjectId(userId) },
                    {
                        title: {
                            $regex: regexPattern,
                        },
                    },
                ],
            },
        },
        { $sort: { createdAt: -1 } },
    ]);

    const videos = await Video.mongooseAggregatePaginate(aggregate);
};

const publishAVideo = async (req, res) => {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video

    if (!title || !description)
        return res
            .status(403)
            .json({ message: "title and description are required" });

    //TODO if title already exists in this user's video list-------

    const videoFileLocalPath = req.files?.videoFile?.[0].path;

    const thumbnailLocalPath = req.files?.thumbnail?.[0].path;

    if (!thumbnailLocalPath || !videoFileLocalPath)
        return res
            .status(403)
            .json({ message: "Thumbnail and video file must required" });

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);

    if (!videoFile)
        return res
            .status(400)
            .json({ message: "Error in uploading video file on cloudinary" });

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail)
        return res
            .status(400)
            .json({ message: "Error in uploading thumbnail on cloudinary" });

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile?.url || "",
        thumbnail: thumbnail?.url || "",
        duration: videoFile?.duration,
        owner: req.user._id,
    });

    return res
        .status(200)
        .json({ message: "video published successfully", data: video });
};

const getVideoById = async (req, res) => {
    //TODO: get video by id
    const { videoId } = req.params;
    if (!videoId)
        return res.status(403).json({ message: "videoId must be provided" });
    const video = await Video.findById(videoId);

    return res
        .status(200)
        .json({ message: "Video fetched successfully", data: video });
};

const updateVideo = async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail
    if (!videoId)
        return res.status(403).json({ message: "videoId must be provided" });

    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath && !title && !description)
        return res.status(403).json({
            message: "There is nothing to update, required some field",
        });

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                ...(thumbnail && { thumbnail: thumbnail.url }), //first it will check if thumbnail exists or not
            },
        },
        { new: true },
    );

    return res
        .status(200)
        .json({ message: "Video updated successfully", data: updatedVideo });
};

const deleteVideo = async (req, res) => {
    const { videoId } = req.params;
    //TODO: delete video
    if (!videoId)
        return res.status(403).json({ message: "videoId must be provided" });

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json({ message: "video deleted successfully" });
};

const togglePublishStatus = async (req, res) => {
    const { videoId } = req.params;
    if (!videoId)
        return res.status(403).json({ message: "videoId must be provided" });

    const video = await Video.findById(videoId);

    if (video.isPublished) {
        await Video.findByIdAndUpdate(videoId, {
            $set: { isPublished: false },
        });
    } else {
        await Video.findByIdAndUpdate(videoId, {
            $set: { isPublished: true },
        });
    }

    return res.status(200).json({ message: "Video toggled successfully" });
};

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
