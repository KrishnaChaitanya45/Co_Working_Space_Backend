"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now().toString(),
    },
    displayname: {
        type: String,
    },
    refreshToken: [String],
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    bio: {
        type: String,
    },
    interests: {
        type: Array,
    },
    servers: [],
    username: {
        type: String,
        unique: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    profilePhoto: {
        type: String,
        default: "https://res.cloudinary.com/deardiary/image/upload/v1693221898/DearDiary/Habits/Login_mxzaj8.png",
    },
});
const User = mongoose.model("User", UserSchema);
module.exports = User;
