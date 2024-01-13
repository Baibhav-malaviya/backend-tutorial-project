import express, { Schema, model } from "express";

const tweetSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
            i,
        },
        owner: {
            type: Schema.Types.ObjectId,
            required: true,
        },
    },
    { timestamps: true },
);

export const Tweet = model("Tweet", tweetSchema);
