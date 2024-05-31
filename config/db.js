const mongoose = require("mongoose");

const mongoUrl = process.env.MONGODB_URL
const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("DATABASE - Connected");
  });

  mongoose.connection.on("error", (err) => {
   console.log(`DATABASE - Error: ${err}`);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("DATABASE - disconnected  Retrying....");
  });

  const dbOptions = {
    maxPoolSize: 5,
  };
  mongoose.connect(mongoUrl, dbOptions);
};
module.exports = connectDB;