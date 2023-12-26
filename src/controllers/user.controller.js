import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import Jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }); // This is because we are saving on refresh token so all the require field is not saving then it will show error
        return { accessToken, refreshToken };
    } catch (error) {
        return res
            .status(500)
            .json({ error: error?.message || "Something went wrong" });
    }
};

const registerUser = async (req, res) => {
    const { userName, fullName, email, password } = req.body;
    //!check all the required fields exists or not
    if (
        [userName, fullName, email, password].some(
            (field) => field === undefined || field === "",
        )
    ) {
        return res.status(403).json({ message: "All the fields are required" });
    }

    //! check if the user already exists or not
    const existedUser = await User.findOne({ $or: [{ userName }, { email }] });

    if (existedUser) {
        return res.status(403).json({
            message: `User with email ${existedUser.email} or username ${userName} already registered`,
        });
    }
    //! For localPath of uploaded files

    const avatarLocalPath = req.files?.avatar?.[0].path;
    const coverImageLocalPath = req.files?.coverImage?.[0].path;

    if (!avatarLocalPath) {
        return res.status(403).json({ message: "Upload avatar failed 1." });
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
        return res.status(403).json({ message: "Upload avatar failed 2." });
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    const user = await User.create({
        userName: userName.toLowerCase(),
        fullName,
        email,
        password,
        avatar: avatar?.url,
        coverImage: coverImage?.url || "",
    });
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken",
    );

    if (!createdUser) {
        return res.status(403).json({
            message: "Something went wrong in registering the user.",
        });
    }

    return res.status(201).send(createdUser);
};

const loginUser = async (req, res) => {
    //! find from req.body

    const { userName, email, password } = req.body;
    //! check required credentials

    if (!userName && !email) {
        return res
            .status(403)
            .json({ message: "Username or email is required." });
    }
    //! check if user exists or not

    const user = await User.findOne({ $or: [{ userName }, { email }] });

    if (!user) {
        return res.status(403).json({ message: "User is not registered " });
    }

    //! check for password correction
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
    }
    //! access and refresh token

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
        user._id,
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken",
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    //! return response

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json({
            message: "Logged in successfully",
            loggedInUser,
            accessToken,
            refreshToken,
        });
};

const logoutUser = async (req, res) => {
    //delete refreshToken from database

    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: undefined } },
        { new: true }, // It will return the value after updating the refreshToken
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    //delete cookies from frontend
    res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json({ message: "User logged out successfully" });
};

const refreshAccessToken = async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        return res.status(401).json({ message: "unauthorized request" });
    }

    try {
        const decodedToken = Jwt.verify(
            (incomingRefreshToken, process.env.ACCESS_REFRESH_TOKEN),
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            return res.status(401).json({
                message: "Refresh token is expired  or used",
            });
        }

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshToken(user._id);

        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken)
            .cookie("refreshToken", refreshToken)
            .json({
                message: "Access and refresh token regenerated successfully",
                data: { accessToken, refreshToken },
            });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
};

const changeCurrentPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?.id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        return res.status(403).json({ message: "Invalid password" });
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({ message: "Password changed successfully" });
};

const getCurrentUser = async (req, res) => {
    return res.status(200).json({
        message: "Current user fetched successfully",
        data: req.user,
    });
};

const updateAccountDetails = async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName && !email) {
        return res.status(404).json({ message: "Anyone of then is required" });
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
            },
        },
        { new: true },
    ).select(" -password");

    return res
        .status(200)
        .json({ message: "User updated successfully", data: user });
};

const updateUserAvatar = async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        return res.status(400).json({ message: "Avatar file not found" });
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        return res
            .status(404)
            .json({ message: "Error in uploading avatar on cloudinary" });
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { avatar: avatar.url },
        },
        { new: true },
    ).select("-password");

    return res
        .status(200)
        .json({ message: "User avatar successfully updated", data: user });
};

const updateUserCoverImage = async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        return res.status(400).json({ message: "Cover image not found" });
    }

    const coverImage = await uploadOnCloudinary(coverImage);

    if (!coverImage.url) {
        return res
            .status(404)
            .json({ message: "Error in uploading cover image" });
    }

    const user = await User.findByIdAndRemove(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
            },
        },
        { new: true },
    ).select("-password");

    return res
        .status(200)
        .json({ message: "Cover image successfully updated", data: user });
};

const getUserChannelProfile = async (req, res) => {
    const { userName } = req.params;

    if (!userName?.trim()) {
        return res.status(400).json({ message: "User name is missing" });
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            },
        },
    ]);

    if (!channel?.length) {
        return res.status(404).json({ message: "Channel does not exist" });
    }

    return res.status(200).json({
        message: "Channel detail fetched successfully",
        data: channel[0], //Because aggregate always return array
    });
};

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
};
