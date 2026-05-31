const express = require("express");
const router = express.Router();


const Menu = require('../models/Menu');
const Time = require('../models/Time');
const Buyer = require('../models/Buyer');
const DishRating = require('../models/DishRating');
const CouponReminder = require('../services/couponReminder');
const CouponRollover = require('../services/couponRollover');


router.post(
    "/setTime",
    async (req, res) => {
        await Time.setTimes(req.body.times);
        res.send();
    }
);


router.post(
    "/setMenu",
    async (req, res) => {
        await Menu.setMenus(req.body.menus);
        res.send();
    }
);


router.post(
    "/meals",
    async (req, res) => {
        const buyers = await Buyer.allBuyers();
        let data = {
            monday: { breakfast: 0, lunch: 0, dinner: 0 },
            tuesday: { breakfast: 0, lunch: 0, dinner: 0 },
            wednesday: { breakfast: 0, lunch: 0, dinner: 0 },
            thursday: { breakfast: 0, lunch: 0, dinner: 0 },
            friday: { breakfast: 0, lunch: 0, dinner: 0 },
            saturday: { breakfast: 0, lunch: 0, dinner: 0 },
            sunday: { breakfast: 0, lunch: 0, dinner: 0 }
        }
        for (let buyer of buyers) {
            let meals = buyer[req.body.week];
            for (const [day, val] of Object.entries(meals)) {
                data[day]["breakfast"] += val.breakfast;
                data[day]["lunch"] += val.lunch;
                data[day]["dinner"] += val.dinner;
            }
        }
        const processed = [
            { day: "monday", breakfast: data.monday.breakfast, lunch: data.monday.lunch, dinner: data.monday.dinner },
            { day: "tuesday", breakfast: data.tuesday.breakfast, lunch: data.tuesday.lunch, dinner: data.tuesday.dinner },
            { day: "wednesday", breakfast: data.wednesday.breakfast, lunch: data.wednesday.lunch, dinner: data.wednesday.dinner },
            { day: "thursday", breakfast: data.thursday.breakfast, lunch: data.thursday.lunch, dinner: data.thursday.dinner },
            { day: "friday", breakfast: data.friday.breakfast, lunch: data.friday.lunch, dinner: data.friday.dinner },
            { day: "saturday", breakfast: data.saturday.breakfast, lunch: data.saturday.lunch, dinner: data.saturday.dinner },
            { day: "sunday", breakfast: data.sunday.breakfast, lunch: data.sunday.lunch, dinner: data.sunday.dinner }
        ]
        res.send(processed);
    }
);

router.get(
    "/dishRatings",
    async (req, res) => {
        try {
            const date = req.query?.date || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
            const ratings = await DishRating.getRatingsForDate(date);

            const summary = {
                breakfast: { count: 0, average: 0 },
                lunch: { count: 0, average: 0 },
                dinner: { count: 0, average: 0 }
            };
            for (const row of ratings) {
                summary[row.meal].count += 1;
                summary[row.meal].average += row.rating;
            }
            for (const meal of Object.keys(summary)) {
                if (summary[meal].count) {
                    summary[meal].average = Number((summary[meal].average / summary[meal].count).toFixed(2));
                }
            }

            res.send({ date, summary, ratings });
        } catch (e) {
            console.error(e);
            res.status(500).send({ error: "Failed to fetch dish ratings" });
        }
    }
);

router.post(
    "/sendCouponReminder",
    async (req, res) => {
        try {
            const result = await CouponReminder.sendWeeklyCouponReminder({ force: true });
            res.send(result);
        } catch (e) {
            console.error(e);
            res.status(500).send({ error: "Failed to send coupon reminder" });
        }
    }
);

router.post(
    "/rolloverCoupons",
    async (req, res) => {
        try {
            const result = await CouponRollover.rolloverWeeklyCoupons({ force: true });
            res.send(result);
        } catch (e) {
            console.error(e);
            res.status(500).send({ error: "Failed to rollover coupons" });
        }
    }
);

module.exports = router;
