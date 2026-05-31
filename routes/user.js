const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");

const Buyer = require("../models/Buyer");
const Time = require("../models/Time");
const Order = require("../models/Order");
const Menu = require("../models/Menu");
const DishRating = require("../models/DishRating");

const { validatePaymentVerification } = require("razorpay/dist/utils/razorpay-utils");

function toNumber(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function calculateTotalFromSelection(selected, costsByMeal) {
  let total = 0;
  for (const val of Object.values(selected || {})) {
    if (val?.breakfast) total += costsByMeal.breakfast || 0;
    if (val?.lunch)     total += costsByMeal.lunch || 0;
    if (val?.dinner)    total += costsByMeal.dinner || 0;
  }
  return total;
}

router.get("/data", async (req, res) => {
  try { res.send(await Buyer.getBuyer(req.user?.email)); }
  catch (e) { console.error(e); res.status(500).send({ error: "Failed to fetch buyer data" }); }
});

router.get("/resetSecret", async (req, res) => {
  try { res.send(await Buyer.resetSecret(req.user?.email)); }
  catch (e) { console.error(e); res.status(500).send({ error: "Failed to reset secret" }); }
}); 

router.post("/checkCoupon", async (req, res) => {
  try { res.send(await Buyer.checkCoupon(req.body)); }
  catch (e) { console.error(e); res.status(500).send({ error: "Failed to check coupon" }); }
});

router.get("/boughtNextWeek", async (req, res) => {
  try { res.send(await Buyer.boughtNextWeek(req.user?.email)); }
  catch (e) { console.error(e); res.status(500).send({ error: "Failed to fetch next week status" }); }
});


router.post("/createOrder", async (req, res) => {
  try {
    const costs = await Time.getTimes(); 
    const priceByMeal = {};
    for (const c of costs) priceByMeal[c.meal] = toNumber(c.cost, 0);

    const selected = req.body?.selected || {};
    const total = calculateTotalFromSelection(selected, priceByMeal);
    const paise = Math.round(toNumber(total, 0) * 100);
    if (!Number.isFinite(paise) || paise <= 0) {
      return res.status(400).send({ error: "Invalid total amount" });
    }

    const keyId = process.env.PAY_ID;
    const instance = new Razorpay({ key_id: keyId, key_secret: process.env.PAY_SECRET });

    const order = await instance.orders.create({
      amount: paise,
      currency: "INR",
      notes: { source: "IIITL MESS PORTAL" },
    });

    await Order.saveOrder(order.id, selected);

    console.log("createOrder", {
      env: keyId?.startsWith("rzp_test_") ? "TEST" : "LIVE",
      id: order.id, amount: order.amount
    });

    res.send({ id: order.id, amount: order.amount, currency: order.currency, key: keyId });
  } catch (e) {
    console.error("createOrder error:", e);
    res.status(500).send({ error: "Failed to create order" });
  }
});

router.post("/checkOrder", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).send({ ok: false, error: "Missing payment fields" });
    }

    const isValid = validatePaymentVerification(
      { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
      razorpay_signature,
      process.env.PAY_SECRET
    );
    if (!isValid) return res.send(false);

    const orderObj = await Order.getOrder(razorpay_order_id);
    if (!orderObj) return res.status(404).send({ ok: false, error: "Order not found" });

    await Buyer.saveOrder(req.user?.email, orderObj.selected);


    res.send(true);
  } catch (e) {
    console.error("checkOrder error:", e);
    res.status(500).send({ ok: false, error: "Failed to verify order" });
  }
});

function getCurrentISTDateMeta() {
  const now = new Date();
  const day = now.toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Kolkata" }).toLowerCase();
  const date = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return { day, date };
}

router.get("/dishRatings/today", async (req, res) => {
  try {
    const { day, date } = getCurrentISTDateMeta();
    const menu = await Menu.getMenu();
    const dayMenu = menu.find((m) => m.day === day);
    if (!dayMenu) return res.status(404).send({ error: "Menu not found for current day" });

    const ratings = await DishRating.getUserRatingsForDate(req.user?.email, date);
    const ratingsByMeal = {};
    for (const r of ratings) ratingsByMeal[r.meal] = r.rating;

    res.send({ day, date, dayMenu, ratings: ratingsByMeal });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to fetch dish rating data" });
  }
});

router.post("/dishRatings", async (req, res) => {
  try {
    const { meal, rating } = req.body || {};
    const normalizedMeal = String(meal || "").toLowerCase();
    const numericRating = Number(rating);
    if (!["breakfast", "lunch", "dinner"].includes(normalizedMeal) || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).send({ error: "Invalid meal or rating" });
    }

    const { day, date } = getCurrentISTDateMeta();
    const menu = await Menu.getMenu();
    const dayMenu = menu.find((m) => m.day === day);
    if (!dayMenu) return res.status(404).send({ error: "Menu not found for current day" });

    await DishRating.saveRating({
      email: req.user?.email,
      day,
      meal: normalizedMeal,
      dish: dayMenu[normalizedMeal],
      rating: numericRating,
      date
    });
    res.send({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to save rating" });
  }
});

module.exports = router;
