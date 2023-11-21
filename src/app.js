import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    }),
);

app.use(express.json({ limit: "16kb" })); //used to convert the json data into js objects and vise-versa.
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //After using this middleware, We don't need to use body-parser
app.use(express.static("public")); //for serving the static file
app.use(cookieParser());

//routes import

import userRouter from "./routes/user.route.js";
//routes declarations
app.use("/api/v1/users", userRouter);

export { app };
