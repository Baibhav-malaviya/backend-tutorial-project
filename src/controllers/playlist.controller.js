import { Playlist } from "../models/playlist.model.js";

const createPlaylist = async (req, res) => {
    const { name, description } = req.body;

    //TODO: create playlist

    if (!name || !description)
        return res
            .status(403)
            .json({ message: "Name and description must require" });

    const playList = await Playlist.create({
        name,
        description,
        owner: req.user._id,
    });

    const createdPlaylist = await Playlist.findById(playList._id);

    return res.status(200).json({
        message: "Playlist created successfully",
        data: createdPlaylist,
    });
};

const getUserPlaylists = async (req, res) => {
    const { userId } = req.params;
    //TODO: get user playlists

    if (!userId)
        return res.status(403).json({ message: " userId must required " });

    const playlists = await Playlist.find({ owner: userId });

    return res
        .status(200)
        .json({ message: " playlists fetched successfully", data: playlists });
};

const getPlaylistById = async (req, res) => {
    const { playlistId } = req.params;
    //TODO: get playlist by id

    if (!playlistId)
        return res.status(403).json({ message: "playlistId must required" });

    const playlist = await Playlist.findById(playlistId);

    if (!playlist)
        return res.status(404).json({
            message: "Incorrect playlistId as it can't fetched playlist",
        });

    return res
        .status(200)
        .json({ message: " playlist fetched successfully", data: playlist });
};

const addVideoToPlaylist = async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!playlistId || !videoId)
        return res
            .status(403)
            .json({ message: " playlistId and videoId must required" });

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $push: { videos: videoId } },
        { new: true },
    );

    return res.status(200).json({
        message: "video added successfully",
        data: updatedPlaylist,
    });
};

const removeVideoFromPlaylist = async (req, res) => {
    const { playlistId, videoId } = req.params;
    // TODO: remove video from playlist

    if (!playlistId || !videoId)
        return res
            .status(403)
            .json({ message: " playlistId and videoId must required" });

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } },
        { new: true },
    );

    return res.status(200).json({
        message: "video removed successfully",
        data: updatedPlaylist,
    });
};

const deletePlaylist = async (req, res) => {
    const { playlistId } = req.params;
    // TODO: delete playlist
    if (!playlistId)
        return res.status(403).json({ message: " playlistId is required" });

    await Playlist.findByIdAndDelete(playlistId);

    return res.status(200).json({ message: " playlist deleted successfully" });
};

const updatePlaylist = async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    //TODO: update playlist

    if (!playlistId)
        return res.status(403).json({ message: "playlistId is required" });

    if (!name && !description)
        return res.status(403).json({
            message: "Name or description anyone of them is required",
        });
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: { name, description },
        },
        { new: true },
    );

    return res.status(200).json({
        message: " playlist updated successfully",
        data: updatedPlaylist,
    });
};

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
