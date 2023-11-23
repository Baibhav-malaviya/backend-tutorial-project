import multer from "multer";

//*Multer is used to upload the files to the folder(eg. ./public/temp) from local System and cloudinary uses this path to upload on the cloudinary cloud.

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp"); //? Destination directory
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); //!original name means the name of the file uploaded by the user. It can we same for the two users, so that to avoid this we can append something to the original file to make it unique. `${new Date()}-${file.originalname}`
    },
});

export const upload = multer({ storage: storage });
