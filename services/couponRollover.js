const Buyer = require("../models/Buyer");
const ReminderLog = require("../models/ReminderLog");

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

function shouldRunScheduledRollover(date = new Date()) {
    const parts = getISTParts(date);
    return parts.weekday === "monday" && parts.hour === 0;
}

async function rolloverWeeklyCoupons(options = {}) {
    const force = Boolean(options.force);
    const parts = getISTParts();
    const rolloverKey = force
        ? `weekly-coupon-rollover:manual:${new Date().toISOString()}`
        : `weekly-coupon-rollover:${parts.dateKey}`;

    if (!force) {
        const reservation = await ReminderLog.createIfNotExists(rolloverKey);
        if (!reservation.created) {
            return { skipped: true, reason: "Coupon rollover already processed for this week", buyers: 0 };
        }
    }

    try {
        const buyers = await Buyer.rolloverWeek();
        if (!force) await ReminderLog.markSent(rolloverKey, buyers);
        return { skipped: false, buyers };
    } catch (error) {
        if (!force) await ReminderLog.markFailed(rolloverKey, error.message || error);
        throw error;
    }
}

function startCouponRolloverScheduler() {
    if (schedulerStarted) return;
    schedulerStarted = true;

    const tick = async () => {
        if (schedulerRunning || !shouldRunScheduledRollover()) return;
        schedulerRunning = true;

        try {
            const result = await rolloverWeeklyCoupons();
            if (!result.skipped) {
                console.log(`Coupon week rollover completed for ${result.buyers} buyers`);
            }
        } catch (error) {
            console.error("Coupon week rollover failed:", error);
        } finally {
            schedulerRunning = false;
        }
    };

    setInterval(tick, CHECK_INTERVAL_MS);
    tick();
}

module.exports = {
    rolloverWeeklyCoupons,
    startCouponRolloverScheduler,
};
