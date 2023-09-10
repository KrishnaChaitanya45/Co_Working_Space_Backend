"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const connectDB = (url) => {
    mongoose.set("strictQuery", true);
    return mongoose.connect(url, {});
};
module.exports = connectDB;
