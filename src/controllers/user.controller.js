import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

    const loggedInUser = await user
        .findById(User._id)
        .select("-password -refreshToken");

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

export { registerUser, loginUser, logoutUser };
