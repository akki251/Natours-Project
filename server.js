const dotenv = require('dotenv');

//  uncaught exception
process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT  EXCEPTION 😔');
  process.exit(1);
});

const app = require('./app');

const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE_URL.replace(
  `<PASSWORD>`,
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Db connection successful');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// handling globally unhandled rejections
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION 😔');
  server.close(() => {
    // gracefully shutting down the server
    process.exit(0);
  });
});

// handling heroku SIGTERM error
process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
