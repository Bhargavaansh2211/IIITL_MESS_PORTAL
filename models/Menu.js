const mongoose = require("mongoose");

const MenuSchema = mongoose.model("menuitem", new mongoose.Schema({
    day: { type: String, required: true, enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
    breakfast: { type: String, required: true },
    lunch: { type: String, required: true },
    dinner: { type: String, required: true }
}));

// Get the weekly menu
module.exports.getMenu = async function () {
    const menuItems = await MenuSchema.find({})
        .select({ _id: 0 });
    return menuItems;
}

// Set the weekly menu
module.exports.setMenus = async function (menus) {
    await MenuSchema.deleteMany({});
    await MenuSchema.insertMany(menus);
}

// Auto-populate default menu data if collection is empty
mongoose.connection.once('open', async () => {
    try {
        const count = await MenuSchema.countDocuments();
        if (count === 0) {
            const defaultMenus = [
    { 
        day: "monday", 
        breakfast: "Pav Bhaji, Milk and Bread", 
        lunch: "Chole, Puri, Dahi, Rice", 
        dinner: "Aloo Palwal, Arhar Dal, Rice, Roti, Salad" 
    },
    { 
        day: "tuesday", 
        breakfast: "Medu Vada with Sambhar, Milk and Bread", 
        lunch: "Rajma, Rice, Roti", 
        dinner: "Masala Bhindi, Arhar Dal, Rice, Roti, Salad" 
    },
    { 
        day: "wednesday", 
        breakfast: "Aloo Parantha with Curd, Milk and Bread", 
        lunch: "Black Chana, Rice, Roti, Salad", 
        dinner: "Kadhai Paneer, Rice, Roti, Salad, Halwa" 
    },
    { 
        day: "thursday", 
        breakfast: "Uttapam with Sambhar, Milk and Bread", 
        lunch: "Punjabi Kadhi, Rice, Roti, Salad", 
        dinner: "Lauki Kofta, Tehri, Roti, Salad" 
    },
    { 
        day: "friday", 
        breakfast: "Poha, Milk and Bread", 
        lunch: "Masala Bhindi, Arhar Dal, Rice, Roti, Salad", 
        dinner: "Aloo Matar Sabzi, Masoor Dal, Rice, Roti, Salad" 
    },
    { 
        day: "saturday", 
        breakfast: "Paratha with White Matar, Milk and Bread", 
        lunch: "Chole Bhature, Rice, Boondi Raita", 
        dinner: "Mix Veg, Arhar Dal, Rice, Roti, Salad" 
    },
    { 
        day: "sunday", 
        breakfast: "Idli with Sambhar, Milk and Bread", 
        lunch: "Dal Makhni, Veg Biryani, Paratha, Salad", 
        dinner: "Paneer Butter Masala, Rice, Roti, Salad, Ice Cream" 
    }
];
            await MenuSchema.insertMany(defaultMenus);
            console.log("Default menu data inserted");
        }
    } catch (err) {
        console.error("Error populating default menu data", err);
    }
});
