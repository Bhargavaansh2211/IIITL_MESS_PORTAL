const cors = require('cors');
const express = require('express');
const compression = require('compression');
const dotenv = require('dotenv');


dotenv.config({ path: './config/config.env' });

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_DIR = __dirname + '/frontend/build';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);


app.use(express.static(FRONTEND_DIR));
app.get('*', (req, res) => res.sendFile(FRONTEND_DIR + '/index.html'));


app.listen(PORT, () => {
  console.log(`Server started on port ${PORT} (${NODE_ENV})`);
});
