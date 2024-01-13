import { Tweet } from "../models/tweet.model.js";

const createTweet = async (req, res) => {
    const { content } = req.body;

    if (!content)
        return res
            .status(403)
            .json({ message: "Tweet must require a content" });

    const tweet = await Tweet.create({
        content,
        owner: req.user._id,
    });

    const createdTweet = await Tweet.findById(tweet._id);

    res.status(200).json({
        message: "Tweet created successfully",
        data: createdTweet,
    });
};

const getUserTweets = async (req, res) => {
    const { userId } = req.params;

    if (!userId)
        return res.status(403).json({ message: "UserId must require" });

    const tweets = await Tweet.find({ owner: userId });

    if (!tweets) return res.status(404).json({ message: "No tweet found" });

    return res
        .status(200)
        .json({ message: "Tweets fetched successfully", data: tweets });
};

const updateTweet = async (req, res) => {
    const { content } = req.body;
    const { tweetId } = req.params;

    if (!tweetId || !content)
        return res
            .status(403)
            .json({ message: "tweetId and content are required" });

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: { content },
        },
        { new: true },
    );

    return res
        .status(200)
        .json({ message: "tweet updated successfully", data: updatedTweet });
};

const deleteTweet = async (req, res) => {
    const { tweetId } = req.params;

    if (!tweetId)
        return res
            .status(403)
            .json({ message: "tweetId and content are required" });

    await Tweet.findByIdAndDelete(tweetId);

    return res.status(200).json({ message: "Tweet deleted successfully" });
};

export { createTweet, getUserTweets, updateTweet, deleteTweet };
