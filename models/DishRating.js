const mongoose = require("mongoose");

const DishRatingSchema = mongoose.model("dishrating", new mongoose.Schema({
    email: { type: String, required: true },
    day: { type: String, required: true, enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
    meal: { type: String, required: true, enum: ["breakfast", "lunch", "dinner"] },
    dish: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    date: { type: String, required: true }
}, { timestamps: true }));

module.exports.saveRating = async function ({ email, day, meal, dish, rating, date }) {
    await DishRatingSchema.findOneAndUpdate(
        { email, date, meal },
        { email, day, meal, dish, rating, date },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

module.exports.getRatingsForDate = async function (date) {
    const rows = await DishRatingSchema.find({ date }).select({ _id: 0, email: 1, day: 1, meal: 1, dish: 1, rating: 1, updatedAt: 1 }).sort({ meal: 1, updatedAt: -1 });
    return rows;
};

module.exports.getUserRatingsForDate = async function (email, date) {
    return DishRatingSchema.find({ email, date }).select({ _id: 0, meal: 1, rating: 1 });
};
