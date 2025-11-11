require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const apiRouter = require('./routes/api');

const isProduction = process.env.ENVIRONMENT === 'production';


connectMongoose();
async function connectMongoose() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('mongo connection success!!');
    } catch (error) {
        console.log('mongo connection fail..');
        console.log(error);
    }
}

if (isProduction) {
    app.set('trust proxy', 1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false, 
    cookie: {
        httpOnly: true, 
        secure: isProduction,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: isProduction ? 'none' : 'lax'
    },

    store: MongoStore.create({
        client: mongoose.connection.getClient()
    })
}));




app.get('/', (req, res) => {
    res.send('hello');
})


app.use('/api', apiRouter);


app.use((err, req, res, next) => {
    if (!isProduction) { console.log(err); }
    const { message = 'oh no, Error!!', statusCode = 500 } = err;
    res.status(statusCode).json({ error: err, success: false });
})



app.listen(process.env.PORT, () => {
    console.log(`Serving on port ${process.env.PORT}`);
})