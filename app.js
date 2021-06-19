const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./utils/errorHandler');
const routes = require('./routes');


const app = express();

app.enable('trust proxy'); //heroku specific

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.options('*', cors());

app.use(express.static(path.join(__dirname, 'public')));

// app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
            baseUri: ["'self'"],
            fontSrc: ["'self'", 'https:', 'http:', 'data:'],
            scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
            imgSrc: ["'self'", 'data:', 'blob:'],
        },
    })
);


app.use(express.json({ limit: '10kb' }));

app.use(cookieParser());

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();

    next();
});

app.use('/', routes);

app.all('*', (req, res, next) => {
    return next(new AppError(`Can't find ${req.originalUrl} on this server..`, 404));
});

app.use(globalErrorHandler);
module.exports = app;