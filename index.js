const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const compression = require('compression');
const dotenv = require('dotenv');
const passport = require('passport');   
const session = require('express-session');
const helmet = require('helmet');

const MongoStore = require('connect-mongo')(session);
dotenv.config({ path: './config/config.env' });

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_DIR = __dirname + '/frontend/build';

const app = express();

app.set('trust proxy', 1);

// DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

require('./config/passport')(passport);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "'wasm-unsafe-eval'",
          "'unsafe-eval'",
          "https://checkout.razorpay.com",
          "https://cdn.jsdelivr.net",
          "https://fastly.jsdelivr.net"
        ],
        "connect-src": [
          "'self'",
          "https://api.razorpay.com",
          "https://checkout.razorpay.com",
          "https://cdn.jsdelivr.net",
          "https://fastly.jsdelivr.net"
        ],
        "frame-src": ["'self'", "https://*.razorpay.com"],
        "img-src": ["'self'", "data:", "https://*.razorpay.com"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "media-src": ["'self'", "data:"],
        "worker-src": ["'self'", "blob:"]
      }
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "no-referrer" },
    permissionsPolicy: {
      features: {
        camera: ["self"],
        microphone: ["self"]
      }
    }
  })
);

app.use(
  session({
    secret: 'IIITL MESS PORTAL',
    resave: true,
    saveUninitialized: true,
    cookie: {
      sameSite: 'lax',
      secure: NODE_ENV === 'production',
    },
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);

app.use(passport.initialize());
app.use(passport.session());


app.use('/api/auth', require('./routes/auth'));

app.use('/api/user', require('./routes/user'));

app.use(express.static(FRONTEND_DIR));
app.get('*', (req, res) => res.sendFile(FRONTEND_DIR + '/index.html'));

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT} (${NODE_ENV})`);
});