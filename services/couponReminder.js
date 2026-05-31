const Buyer = require("../models/Buyer");
const ReminderLog = require("../models/ReminderLog");
const MailService = require("./mailService");

const IST_TIME_ZONE = "Asia/Kolkata";
const CHECK_INTERVAL_MS = 60 * 1000;

let schedulerStarted = false;
let schedulerRunning = false;

function getISTParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: IST_TIME_ZONE,
        weekday: "long",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        hourCycle: "h23",
    }).formatToParts(date);

    const value = {};
    for (const part of parts) value[part.type] = part.value;

    return {
        weekday: value.weekday.toLowerCase(),
        dateKey: `${value.year}-${value.month}-${value.day}`,
        hour: Number(value.hour),
        minute: Number(value.minute),
    };
}

function shouldRunScheduledReminder(date = new Date()) {
    const parts = getISTParts(date);
    return parts.weekday === "sunday" && parts.hour === 0;
}

async function sendWeeklyCouponReminder(options = {}) {
    const force = Boolean(options.force);
    const parts = getISTParts();
    const reminderKey = force
        ? `weekly-coupon-reminder:manual:${new Date().toISOString()}`
        : `weekly-coupon-reminder:${parts.dateKey}`;

    if (!MailService.isMailConfigured()) {
        throw new Error("Mail is not configured. Set MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS and MAIL_FROM.");
    }

    if (!force) {
        const reservation = await ReminderLog.createIfNotExists(reminderKey);
        if (!reservation.created) {
            return { skipped: true, reason: "Reminder already processed for this week", recipients: 0 };
        }
    }

    try {
        const users = await Buyer.usersMissingNextWeekCoupon();

        for (const user of users) {
            await MailService.sendCouponReminder({
                to: user.email,
                name: user.displayName,
            });
        }

        if (!force) await ReminderLog.markSent(reminderKey, users.length);
        return { skipped: false, recipients: users.length };
    } catch (error) {
        if (!force) await ReminderLog.markFailed(reminderKey, error.message || error);
        throw error;
    }
}

function startCouponReminderScheduler() {
    if (schedulerStarted) return;
    schedulerStarted = true;

    const tick = async () => {
        if (schedulerRunning || !shouldRunScheduledReminder()) return;
        schedulerRunning = true;

        try {
            const result = await sendWeeklyCouponReminder();
            if (!result.skipped) {
                console.log(`Coupon reminder sent to ${result.recipients} users`);
            }
        } catch (error) {
            console.error("Coupon reminder failed:", error);
        } finally {
            schedulerRunning = false;
        }
    };

    setInterval(tick, CHECK_INTERVAL_MS);
    tick();
}

module.exports = {
    sendWeeklyCouponReminder,
    startCouponReminderScheduler,
};
