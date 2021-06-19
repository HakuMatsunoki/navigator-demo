const dotenv = require('dotenv');



process.on('uncaughtException', (err) => {
    console.log('==============> Uncaught exception', err);
    process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');





// SERVER
const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
    console.log('Unhandled rejection', err);
    server.close(() => {
        process.exit(1);
    });
});

process.on('SIGTERM', (err) => {
    console.log('Sigterm received, shutting down...', err);
    server.close(() => {
        console.log('Process terminated.');
    });
});