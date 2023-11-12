import express, { Schema, model } from "express";
import { Aggregate } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String, // cloudinary url
            required: true,
        },
        thumbnail: {
            type: String, // cloudinary url
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {
            type: Number, // Cloudinary duration
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            debugger: true,
        },
        owner: {
            type: Schema.Types.objectId,
            ref: "User",
        },
    },
    { timestamps: true }, // This will automatically add the two fields (createdAt and updatedAt)
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = model("Video", videoSchema);
