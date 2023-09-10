const mongoose = require("mongoose");
const connectDB = (url: string) => {
  mongoose.set("strictQuery", true);
  return mongoose.connect(url, {});
};
module.exports = connectDB;
export {};
