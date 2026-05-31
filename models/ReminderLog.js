const mongoose = require("mongoose");

const ReminderLogModel = mongoose.model("reminderLog", new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    status: { type: String, enum: ["running", "sent", "failed"], default: "running" },
    recipients: { type: Number, default: 0 },
    error: { type: String },
    sentAt: { type: Date },
}, { timestamps: true }));

module.exports.createIfNotExists = async function (key) {
    const existing = await ReminderLogModel.findOne({ key });
    if (existing?.status === "sent" || existing?.status === "running") {
        return { log: existing, created: false };
    }

    if (existing?.status === "failed") {
        existing.status = "running";
        existing.error = undefined;
        await existing.save();
        return { log: existing, created: true };
    }

    const log = await ReminderLogModel.create({ key, status: "running" });
    return { log, created: true };
};

module.exports.markSent = async function (key, recipients) {
    await ReminderLogModel.updateOne(
        { key },
        { status: "sent", recipients, sentAt: new Date(), $unset: { error: "" } }
    );
};

module.exports.markFailed = async function (key, error) {
    await ReminderLogModel.updateOne(
        { key },
        { status: "failed", error: String(error).slice(0, 1000) }
    );
};
