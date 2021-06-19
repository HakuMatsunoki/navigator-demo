const AppError = require('./appError');

const sendErrorDev = function(err, req, res) {
    console.error('**', err);
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message,
    });
    // return res.status(err.statusCode).json({
    //     title: 'Something went wrong!',
    //     msg: err.message,
    // });
};

const sendErrorProd = function(err, req, res) {
    // A) operational, trusted error: send message to the client
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message,
        });
    }
    // B) programming or other unknown error: don't leak error details
    console.error(err);
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please, try again later..',
    });
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err, name: err.name, message: err.message };
        console.log('Error: ', error);
        sendErrorProd(error, req, res);
    }
};