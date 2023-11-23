import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

export { registerUser };
