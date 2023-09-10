"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const User = require("../../models/userModal.ts");
const jwt = require("jsonwebtoken");
const handleRefreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cookies = req.cookies;
        if (!(cookies === null || cookies === void 0 ? void 0 : cookies.refreshToken)) {
            return res.status(400).json({ message: "Cookies not found" });
        }
        console.log(cookies.refreshToken);
        const refreshToken = cookies.refreshToken;
        res.clearCookie("refreshToken", {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });
        const foundUser = yield User.findOne({ refreshToken }, { password: 0 }).exec();
        // DETECTED REFRESH TOKEN REUSE, SOMEONE ELSE IS TRYING TO USE THE REFRESH TOKEN
        if (!foundUser) {
            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    return res.status(403);
                }
                const hackedUser = yield User.findById(user.id);
                if (!hackedUser) {
                    return res.status(403);
                }
                hackedUser.refreshToken = [];
                yield hackedUser.save();
            }));
            return res.status(401).json({ message: "Invalid user" });
        }
        // Creating a new access token
        const newRefreshTokenArray = foundUser.refreshToken.filter((rt) => rt !== refreshToken);
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                foundUser.refreshToken = [...newRefreshTokenArray];
                yield foundUser.save();
                return res.status(403).json({ message: "Invalid token" });
            }
            const accessToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "30m",
            });
            const newRefreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, {
                expiresIn: "15d",
            });
            foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
            yield foundUser.save();
            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                sameSite: "none",
                secure: true,
                maxAge: 1000 * 60 * 60 * 24 * 15,
            });
            res.json({ accessToken, user: foundUser });
        }));
    }
    catch (error) {
        console.log(error);
    }
});
module.exports = { handleRefreshToken };
