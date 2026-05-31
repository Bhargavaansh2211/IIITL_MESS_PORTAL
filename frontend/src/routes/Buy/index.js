// import classes from './index.module.css';
// import { Table, Button, message, Card } from 'antd';
// import { ShoppingCartOutlined } from '@ant-design/icons';
// import { useState, useEffect, useCallback } from 'react';
// import axios from "axios";

// const dayToNum = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };

// const columns = [
//   { title: 'Meal', dataIndex: 'meal', width: 90 },
//   { title: 'Rs', dataIndex: 'cost', width: 50 },
//   { title: 'Menu', dataIndex: 'menu' },
// ];

// async function createOrder(selected) {
//   const { data } = await axios.post(`${window.APIROOT}api/user/createOrder`, { selected });
//   return data; // { id, amount, currency, key }
// }
// async function verifyPayment(resp, setBought) {
//   const { data } = await axios.post(`${window.APIROOT}api/user/checkOrder`, resp);
//   if (data === true) { message.success("Coupons bought!"); setBought(true); }
//   else { message.error("Failed to verify payment!"); }
// }
// function loadRazorpayScript() {
//   return new Promise((resolve, reject) => {
//     if (window.Razorpay) return resolve(true);
//     const s = document.createElement("script");
//     s.src = "https://checkout.razorpay.com/v1/checkout.js?v=" + Date.now(); 
//     s.onload = () => resolve(true);
//     s.onerror = () => reject(new Error("Failed to load Razorpay script"));
//     document.body.appendChild(s);
//   });
// }

// function PayButton({ selected, disabled, cost, setBought }) {
//   const handlePayment = useCallback(async () => {
//     try { await loadRazorpayScript(); }
//     catch { message.error("Error loading Razorpay checkout."); return; }

//     let order;
//     try { order = await createOrder(selected); }
//     catch { message.error("Unable to create order"); return; }

//     if (!order?.id || !order?.key) { message.error("Invalid order from server"); return; }


//     message.info(`order=${order.id} key=${order.key.slice(0,12)}…`, 4);

//     const options = {
//       key: order.key,        
//       order_id: order.id,    
//       name: "IIITL MESS PORTAL",
//       description: "Mess Coupons - Weekly",
//       handler: async (res) => {
//         try { await verifyPayment(res, setBought); }
//         catch { message.error("Failed to verify payment"); }
//       },
//       modal: { ondismiss: () => message.info("Checkout closed") },
//     };

//     try {
//       const rz = new window.Razorpay(options);
//       rz.on("payment.failed", (e) => {
//         const err = e?.error || {};
//         const msg = err.description || err.reason || err.message || err?.details?.message || "Payment failed";
//         message.error(msg);
//       });
//       rz.open();
//     } catch {
//       message.error("Unable to open payment window");
//     }
//   }, [selected, setBought]);

//   return (
//     <Button
//       disabled={disabled || !cost}
//       onClick={handlePayment}
//       className={classes.buy}
//       type='primary'
//       size='large'
//       icon={<ShoppingCartOutlined />}
//     >
//       Continue with Payment
//     </Button>
//   );
// }

// export default function BuyPage() {
//   const [cost, setCost] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [bought, setBought] = useState(false);
//   const [menu, setMenu] = useState([
//     { day: "monday",    breakfast: { text: "", cost: "" }, lunch: { text: "", cost: "" }, dinner: { text: "", cost: "" } },
//     { day: "tuesday",   breakfast: { text: "", cost: "" }, lunch: { text: "", cost: "" }, dinner: { text: "", cost: "" } },
//     { day: "wednesday", breakfast: { text: "", cost: "" }, lunch: { text: "", cost: "" }, dinner: { text: "", cost: "" } },
//     { day: "thursday",  breakfast: { text: "", cost: "" }, lunch: { text: "", cost: "" }, dinner: { text: "", cost: "" } },
//     { day: "friday",    breakfast: { text: "", cost: "" }, lunch: { text: "", cost: "" }, dinner: { text: "", cost: "" } },
//     { day: "saturday",  breakfast: { text: "", cost: "" }, lunch: { text: "", cost: "" }, dinner: { text: "", cost: "" } },
//     { day: "sunday",    breakfast: { text: "", cost: "" }, lunch: { text: "", cost: "" }, dinner: { text: "", cost: "" } },
//   ]);
//   const [selected, setSelected] = useState({
//     monday: { breakfast: false, lunch: false, dinner: false },
//     tuesday: { breakfast: false, lunch: false, dinner: false },
//     wednesday: { breakfast: false, lunch: false, dinner: false },
//     thursday: { breakfast: false, lunch: false, dinner: false },
//     friday: { breakfast: false, lunch: false, dinner: false },
//     saturday: { breakfast: false, lunch: false, dinner: false },
//     sunday: { breakfast: false, lunch: false, dinner: false },
//   });

//   useEffect(() => {
//     let sum = 0;
//     for (const [day, val] of Object.entries(selected)) {
//       if (val.breakfast) sum += Number(menu[dayToNum[day]].breakfast.cost || 0);
//       if (val.lunch)     sum += Number(menu[dayToNum[day]].lunch.cost || 0);
//       if (val.dinner)    sum += Number(menu[dayToNum[day]].dinner.cost || 0);
//     }
//     setCost(sum);
//   }, [menu, selected]);

//   useEffect(() => {
//     (async () => {
//       try {
//         const [menuRes, costRes] = await Promise.all([
//           axios.get(`${window.APIROOT}api/data/menu`),
//           axios.get(`${window.APIROOT}api/data/time`),
//         ]);
//         const price = {};
//         for (const c of costRes.data) price[c.meal] = Number(c.cost);
//         const merged = (menuRes.data || []).map((row) => ({
//           day: row.day,
//           breakfast: { text: row.breakfast, cost: Number(price.breakfast) },
//           lunch:     { text: row.lunch,     cost: Number(price.lunch)     },
//           dinner:    { text: row.dinner,    cost: Number(price.dinner)    },
//         }));
//         setMenu(merged);
//         setLoading(false);
//       } catch {
//         message.error("Failed to fetch menu from server");
//       }
//     })();
//   }, []);

//   useEffect(() => {
//     (async () => {
//       try {
//         const { data } = await axios.get(`${window.APIROOT}api/user/boughtNextWeek`);
//         setBought(data);
//       } catch {
//         message.error("Failed to fetch data from server");
//       }
//     })();
//   }, []);

//   return (
//     <>
//       <div style={{fontSize:12,opacity:.6,marginBottom:8}}>build: v-checkout-fix-2</div>
//       {bought ? (
//         <div className={classes.bought}>
//           <Card title="Coupons Bought" bordered={false} style={{ width: 300 }}>
//             You can buy coupons for a week, the week before. You have already bought coupons for the next week.
//           </Card>
//         </div>
//       ) : (
//         <div className={classes.buyBody}>
//           {menu.map((e) => (
//             <div key={e.day}>
//               <h1>{e.day}</h1>
//               <Table
//                 loading={loading}
//                 className={classes.table}
//                 pagination={false}
//                 rowSelection={{
//                   type: "checkbox",
//                   onChange: (skeys) => {
//                     setSelected((prev) => ({
//                       ...prev,
//                       [e.day]: {
//                         breakfast: skeys.includes("breakfast"),
//                         lunch:     skeys.includes("lunch"),
//                         dinner:    skeys.includes("dinner"),
//                       },
//                     }));
//                   },
//                 }}
//                 columns={columns}
//                 dataSource={[
//                   { key: "breakfast", meal: "Breakfast", menu: e.breakfast.text, cost: e.breakfast.cost },
//                   { key: "lunch",     meal: "Lunch",     menu: e.lunch.text,     cost: e.lunch.cost     },
//                   { key: "dinner",    meal: "Dinner",    menu: e.dinner.text,    cost: e.dinner.cost    },
//                 ]}
//               />
//             </div>
//           ))}

//           <h1>Total Cost: ₹{cost}</h1>
//           <PayButton selected={selected} disabled={loading} cost={cost} setBought={setBought} />
//         </div>
//       )}
//     </>
//   );
import classes from './index.module.css';
import { Table, Button, message, Card, Input } from 'antd';
import { ShoppingCartOutlined, RobotOutlined } from '@ant-design/icons';
import { useState, useEffect, useCallback } from 'react';
import axios from "axios";

const dayToNum = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };

const columns = [
  { title: 'Meal', dataIndex: 'meal', width: 90 },
  { title: 'Rs', dataIndex: 'cost', width: 50 },
  { title: 'Menu', dataIndex: 'menu' },
];

async function createOrder(selected) {
  const { data } = await axios.post(`${window.APIROOT}api/user/createOrder`, { selected });
  return data;
}

async function verifyPayment(resp, setBought) {
  const { data } = await axios.post(`${window.APIROOT}api/user/checkOrder`, resp);
  if (data === true) {
    message.success("Coupons bought!");
    setBought(true);
  } else {
    message.error("Failed to verify payment!");
  }
}

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js?v=" + Date.now();
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.body.appendChild(s);
  });
}

function PayButton({ selected, disabled, cost, setBought }) {
  const handlePayment = useCallback(async () => {
    try {
      await loadRazorpayScript();
    } catch {
      message.error("Error loading Razorpay checkout.");
      return;
    }

    let order;
    try {
      order = await createOrder(selected);
    } catch {
      message.error("Unable to create order");
      return;
    }

    if (!order?.id || !order?.key) {
      message.error("Invalid order from server");
      return;
    }

    message.info(`order=${order.id} key=${order.key.slice(0, 12)}…`, 4);

    const options = {
      key: order.key,
      order_id: order.id,
      name: "IIITL MESS PORTAL",
      description: "Mess Coupons - Weekly",
      handler: async (res) => {
        try {
          await verifyPayment(res, setBought);
        } catch {
          message.error("Failed to verify payment");
        }
      },
      modal: { ondismiss: () => message.info("Checkout closed") },
    };

    try {
      const rz = new window.Razorpay(options);
      rz.on("payment.failed", (e) => {
        const err = e?.error || {};
        const msg = err.description || err.reason || err.message || err?.details?.message || "Payment failed";
        message.error(msg);
      });
      rz.open();
    } catch {
      message.error("Unable to open payment window");
    }
  }, [selected, setBought]);

  return (
    <Button
      disabled={disabled || !cost}
      onClick={handlePayment}
      className={classes.buy}
      type="primary"
      size="large"
      icon={<ShoppingCartOutlined />}
    >
      Continue with Payment
    </Button>
  );
}

export default function BuyPage() {
  const [cost, setCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bought, setBought] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [prefs, setPrefs] = useState("");

  const [menu, setMenu] = useState([
    { day: "monday", breakfast: { text: "", cost: "" }, lunch: { text: "", cost: "" }, dinner: { text: "", cost: "" } },
    { day: "tuesday", breakfast: { text: "", cost: "" }, lunch: { text: "", cost: "" }, dinner: { text: "", cost: "" } },
    { day: "wednesday", breakfast: { text: "", cost: "" }, lunch: { text: "", cost: "" }, dinner: { text: "", cost: "" } },
    { day: "thursday", breakfast: { text: "", cost: "" }, lunch: { text: "", cost: "" }, dinner: { text: "", cost: "" } },
    { day: "friday", breakfast: { text: "", cost: "" }, lunch: { text: "", cost: "" }, dinner: { text: "", cost: "" } },
    { day: "saturday", breakfast: { text: "", cost: "" }, lunch: { text: "", cost: "" }, dinner: { text: "", cost: "" } },
    { day: "sunday", breakfast: { text: "", cost: "" }, lunch: { text: "", cost: "" }, dinner: { text: "", cost: "" } },
  ]);

  const [selected, setSelected] = useState({
    monday: { breakfast: false, lunch: false, dinner: false },
    tuesday: { breakfast: false, lunch: false, dinner: false },
    wednesday: { breakfast: false, lunch: false, dinner: false },
    thursday: { breakfast: false, lunch: false, dinner: false },
    friday: { breakfast: false, lunch: false, dinner: false },
    saturday: { breakfast: false, lunch: false, dinner: false },
    sunday: { breakfast: false, lunch: false, dinner: false },
  });

  useEffect(() => {
    let sum = 0;
    for (const [day, val] of Object.entries(selected)) {
      if (val.breakfast) sum += Number(menu[dayToNum[day]]?.breakfast?.cost || 0);
      if (val.lunch) sum += Number(menu[dayToNum[day]]?.lunch?.cost || 0);
      if (val.dinner) sum += Number(menu[dayToNum[day]]?.dinner?.cost || 0);
    }
    setCost(sum);
  }, [menu, selected]);

  useEffect(() => {
    (async () => {
      try {
        const [menuRes, costRes] = await Promise.all([
          axios.get(`${window.APIROOT}api/data/menu`),
          axios.get(`${window.APIROOT}api/data/time`),
        ]);

        const price = {};
        for (const c of costRes.data) price[c.meal] = Number(c.cost);

        const merged = (menuRes.data || []).map((row) => ({
          day: row.day,
          breakfast: { text: row.breakfast, cost: Number(price.breakfast) },
          lunch: { text: row.lunch, cost: Number(price.lunch) },
          dinner: { text: row.dinner, cost: Number(price.dinner) },
        }));

        setMenu(merged);
        setLoading(false);
      } catch {
        message.error("Failed to fetch menu from server");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${window.APIROOT}api/user/boughtNextWeek`);
        setBought(data);
      } catch {
        message.error("Failed to fetch data from server");
      }
    })();
  }, []);

  const autoSelectMeals = async () => {
    if (!prefs.trim()) {
      message.warning("Enter dietary preferences first");
      return;
    }

    try {
      setAiLoading(true);

      const payloadMenu = menu.map((e) => ({
        day: e.day,
        breakfast: e.breakfast.text,
        lunch: e.lunch.text,
        dinner: e.dinner.text,
      }));

      const { data } = await axios.post(
        `${window.APIROOT}api/user/gemini/selectMeals`,
        {
          preferences: prefs,
          menu: payloadMenu,
        }
      );

      setSelected(data);
      message.success("Meals selected by Gemini");
    } catch (err) {
      console.error(err);
      message.error("Failed to auto-select meals");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>build: v-gemini-meal-select-1</div>

      {bought ? (
        <div className={classes.bought}>
          <Card title="Coupons Bought" bordered={false} style={{ width: 300 }}>
            You can buy coupons for a week, the week before. You have already bought coupons for the next week.
          </Card>
        </div>
      ) : (
        <div className={classes.buyBody}>
          <Input.TextArea
            value={prefs}
            onChange={(e) => setPrefs(e.target.value)}
            placeholder="Enter dietary preferences like: vegetarian, no onion, low spice, high protein..."
            autoSize={{ minRows: 3, maxRows: 5 }}
            style={{ marginBottom: 12 }}
          />

          <Button
            onClick={autoSelectMeals}
            loading={aiLoading}
            icon={<RobotOutlined />}
            style={{ marginBottom: 16 }}
          >
            Auto Select Meals with Gemini
          </Button>

          {menu.map((e) => {
            const daySelectedKeys = ["breakfast", "lunch", "dinner"].filter(
              (meal) => selected[e.day]?.[meal]
            );

            return (
              <div key={e.day}>
                <h1>{e.day}</h1>
                <Table
                  loading={loading}
                  className={classes.table}
                  pagination={false}
                  rowSelection={{
                    type: "checkbox",
                    selectedRowKeys: daySelectedKeys,
                    onChange: (skeys) => {
                      setSelected((prev) => ({
                        ...prev,
                        [e.day]: {
                          breakfast: skeys.includes("breakfast"),
                          lunch: skeys.includes("lunch"),
                          dinner: skeys.includes("dinner"),
                        },
                      }));
                    },
                  }}
                  columns={columns}
                  dataSource={[
                    { key: "breakfast", meal: "Breakfast", menu: e.breakfast.text, cost: e.breakfast.cost },
                    { key: "lunch", meal: "Lunch", menu: e.lunch.text, cost: e.lunch.cost },
                    { key: "dinner", meal: "Dinner", menu: e.dinner.text, cost: e.dinner.cost },
                  ]}
                />
              </div>
            );
          })}

          <h1>Total Cost: ₹{cost}</h1>
          <PayButton selected={selected} disabled={loading} cost={cost} setBought={setBought} />
        </div>
      )}
    </>
  );
}