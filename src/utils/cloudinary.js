import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

import fs from "fs";
dotenv.config({ path: "./.env" });

// cloudinary.config({
//     cloud_name: "baibhavmalaviya",
//     api_key: "945755228842995",
//     api_secret: "avLHGM9mtPvIYxsDlZs3F1Ok2Jg",
// });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); //if upload fails then it will delete the file from server
        return null;
    }
};

const deleteFromCloudinary = async (url) => {
    try {
        const publicId = url.split("/").pop().split(".")[0]; // Extract public ID from Cloudinary URL
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted from Cloudinary: ${publicId}`);
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        throw error; // Propagate the error if needed
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
