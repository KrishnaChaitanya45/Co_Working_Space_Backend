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
exports.updateProfilePhoto = exports.getAllUsers = exports.resetPassword = exports.resendOTP = exports.verifyOTP = exports.logout = exports.register = exports.login = void 0;
const User = require("../../models/userModal");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();
const UserOTPVerification = require("../../models/userOTPVerification");
const jwt = require("jsonwebtoken");
const sendOTPVerificationEmail = require("../../utils/sendOTPVerificationEmail");
const getDataURI = require("../../utils/DataURI");
const cloudinaryV2 = require("cloudinary");
const cloudinary = cloudinaryV2.v2;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cookies = req.cookies;
        const { emailOrUsername, password } = req.body;
        if (!emailOrUsername && !password) {
            return res
                .status(400)
                .json({ message: "Please provide an email and password" });
        }
        let user = undefined;
        user = yield User.findOne({ email: emailOrUsername });
        if (!user) {
            user = yield User.findOne({ username: emailOrUsername });
        }
        if (!user) {
            return res.status(401).json({ message: "Invalid username or email" });
        }
        const isMatch = yield bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }
        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "30m",
        });
        const newRefreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: "15d",
        });
        const newRefreshTokenArray = !cookies.refreshToken
            ? user.refreshToken
            : user.refreshToken.filter((rt) => rt !== cookies.refreshToken);
        if (cookies === null || cookies === void 0 ? void 0 : cookies.refreshToken) {
            res.clearCookie("refreshToken", {
                httpOnly: true,
                sameSite: "none",
                secure: true,
            });
        }
        user.refreshToken = [...newRefreshTokenArray, newRefreshToken];
        yield user.save();
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            maxAge: 1000 * 60 * 60 * 24 * 15,
        });
        return res.status(201).json({
            message: "User Login successful",
            tokens: {
                accessToken,
            },
            user: {
                id: user._id,
                username: user.username,
                displayname: user.displayname,
                email: user.email,
                profilePhoto: user.profilePhoto,
            },
        });
    }
    catch (error) {
        console.log(error);
    }
});
exports.login = login;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, displayname, password, username } = req.body;
        if (!email || !displayname || !password || !username) {
            return res.status(400).json({ message: "Please provide all fields" });
        }
        const user = yield User.find({
            $or: [{ email }, { username }],
        });
        if (user.length > 0) {
            return res
                .status(409)
                .json({ message: "Username or email already exists" });
        }
        const hashPassword = yield bcrypt.hash(password, 16);
        const newUser = yield User.create({
            email,
            displayname,
            password: hashPassword,
            username,
        });
        try {
            // @ts-ignore
            yield sendOTPVerificationEmail(email, newUser._id, displayname);
        }
        catch (error) { }
        console.log(newUser._id);
        const accessToken = jwt.sign({ id: newUser._id }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "30m",
        });
        const refreshToken = jwt.sign({ id: newUser._id }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: "15d",
        });
        // @ts-ignore
        newUser.refreshToken = refreshToken;
        yield newUser.save();
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            maxAge: 1000 * 60 * 60 * 24 * 15,
        });
        return res.status(201).json({
            message: "User created successfully",
            tokens: {
                accessToken,
            },
            user: {
                id: newUser._id,
                username: newUser.username,
                displayname: newUser.displayname,
                email: newUser.email,
                profilePhoto: newUser.profilePhoto,
            },
        });
    }
    catch (error) {
        console.log(error);
    }
});
exports.register = register;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // TODO delete the accessToken from the client
        const cookies = req.cookies;
        if (!(cookies === null || cookies === void 0 ? void 0 : cookies.refreshToken)) {
            return res.status(200).json({ message: "Cookies not found" });
        }
        const refreshToken = cookies.refreshToken;
        const user = yield User.findOne({ refreshToken });
        if (!user) {
            res.clearCookie("refreshToken", {
                httpOnly: true,
                sameSite: "none",
                secure: true,
            });
            return res.status(200).json({ message: "USER NOT FOUND" });
        }
        const newRefreshTokenArray = user.refreshToken.filter((rt) => rt !== refreshToken);
        user.refreshToken = newRefreshTokenArray;
        yield user.save();
        res.clearCookie("refreshToken", { httpOnly: true });
        return res.status(200).json({ message: "User logged out successfully" });
    }
    catch (error) {
        console.log(error);
    }
});
exports.logout = logout;
const verifyOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { otp, userId, forResetPassword, usernameOrEmail } = req.body;
        console.log(req.user);
        console.log("== USER ID ==", userId);
        if (!otp) {
            return res.status(400).json({
                message: "Please provide otp to verify",
                title: "OTP Not Provided",
            });
        }
        let userOTP;
        if (!forResetPassword) {
            userOTP = yield UserOTPVerification.findOne({
                user: req.user ? req.user : userId,
            });
        }
        else {
            userOTP = yield UserOTPVerification.findOne({
                user: usernameOrEmail,
            });
        }
        if (!userOTP) {
            return res.status(400).json({
                title: "No OTP's Found",
                message: "Account Credentials doesn't container any otp's try to register or login",
            });
        }
        const { expiresAt } = userOTP;
        const hashedOTP = userOTP.otp;
        // @ts-ignore
        if (Date.now() > expiresAt && !forResetPassword) {
            yield UserOTPVerification.deleteMany({
                user: req.user ? req.user : userId,
            });
            return res.status(400).json({
                title: "OTP expired",
                message: "Oops..! 😢, OTP time exhausted..! try to resend a new otp",
            });
            // @ts-ignore
        }
        else if (Date.now() > expiresAt && forResetPassword) {
            yield UserOTPVerification.deleteMany({
                $or: [{ user: usernameOrEmail }],
            });
            return res.status(400).json({
                title: "OTP expired",
                message: "Oops..! 😢, OTP time exhausted..! try to resend a new otp",
            });
        }
        otp = otp.toString();
        // @ts-ignore
        const validOTP = yield bcrypt.compare(otp, hashedOTP);
        console.log(validOTP);
        if (!validOTP) {
            return res.status(400).json({
                title: "Invalid OTP",
                message: "OTP you entered is invalid..! try to enter it again..!",
            });
        }
        let user;
        if (!forResetPassword) {
            yield User.findOneAndUpdate({ _id: req.user ? req.user : userId }, { verified: true });
        }
        else {
            user = yield User.findOne({
                $or: [
                    {
                        username: usernameOrEmail,
                    },
                    { email: usernameOrEmail },
                ],
            });
        }
        if (!forResetPassword) {
            yield UserOTPVerification.deleteMany({
                user: req.user ? req.user : userId,
            });
        }
        else {
            yield UserOTPVerification.deleteMany({
                $or: [{ user: usernameOrEmail }],
            });
        }
        if (forResetPassword && user)
            return res.status(200).json({
                title: "OTP verified successfully",
                message: "Go ahead and reset your password..! 🙌 ",
                user,
            });
        else
            return res.status(200).json({
                title: "OTP verified successfully",
                message: "Done..!✅, You are now verified..!",
            });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", error });
    }
});
exports.verifyOTP = verifyOTP;
const resendOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const id = req.user;
    const userId = req.body.userId;
    const { forResetPassword, usernameOrEmail } = req.body;
    console.log(userId);
    let user;
    if (!forResetPassword) {
        if (id) {
            user = yield User.findById(id);
        }
        else {
            user = yield User.findById(userId);
        }
    }
    else {
        user = yield User.findOne({
            $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
        });
    }
    if (!user) {
        return res.status(400).json({
            message: "The User credentials provided with the any are invalid..!",
            title: "Invalid User Details",
        });
    }
    const { email, displayname } = user;
    if (!forResetPassword) {
        if (user.verified) {
            return res.status(400).json({
                title: "User already verified",
                message: "You are already verified 😅",
            });
        }
    }
    const subject = "Password Change any ⭐";
    const message = "Here is your otp for verification for changing your password 😄";
    // @ts-ignore
    const userIdForReq = req.user != undefined ? req.user : userId;
    console.log(userIdForReq);
    try {
        const body = {
            subject,
            message,
        };
        if (userIdForReq) {
            // @ts-ignore
            yield sendOTPVerificationEmail(email, userIdForReq, displayname, body);
            return res.status(200).json({
                title: "OTP sent successfully",
                message: "We've resent a new otp to your email..!",
                user,
            });
        }
        else {
            const body = {
                subject,
                message,
            };
            yield sendOTPVerificationEmail(
            // @ts-ignore
            email, userIdForReq, displayname, body, usernameOrEmail);
            return res.status(200).json({
                title: "OTP sent successfully",
                message: "We've resent a new otp to your email..!",
                user,
            });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.resendOTP = resendOTP;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, password, confirmPassword } = req.body;
        console.log(userId);
        if (!password || !confirmPassword) {
            return res.status(400).json({
                title: "Password not provided",
                message: "Please provide a password to reset",
            });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({
                title: "Passwords doesn't match",
                message: "Passwords you entered doesn't match",
            });
        }
        const hashedPassword = yield bcrypt.hash(password, 16);
        const user = yield User.findById(userId);
        if (!user) {
            return res.status(400).json({
                title: "User not found",
                message: "User not found with the provided credentials",
            });
        }
        user.password = hashedPassword;
        yield user.save();
        return res.status(200).json({
            title: "Password reset successful",
            message: "Your password has been reset successfully",
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.resetPassword = resetPassword;
const updateProfilePhoto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("REQ USER ", req.user);
        console.log(req.file);
        if (!req.file)
            return res.status(400).json({ message: "Please provide a file" });
        const image = getDataURI(req.file);
        const user = yield User.findById(req.user);
        if (!user)
            return res.status(400).json({ message: "User not found" });
        const image_url = yield cloudinary.uploader.upload(image.content, {
            public_id: `CoWorkingSpace/${user.username}/profileImage`,
            overwrite: true,
        });
        user.profilePhoto = image_url.secure_url;
        yield user.save();
        return res.status(200).json({
            title: "Updated Successfully ✅",
            message: "We've set your profile picture..! Looks Great ⭐",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateProfilePhoto = updateProfilePhoto;
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.query;
        const query = username
            ? {
                username: { $regex: username, $options: "i" },
            }
            : {};
        const users = yield User.find(query).select("-password");
        return res.status(200).json({ users });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", error });
    }
});
exports.getAllUsers = getAllUsers;
module.exports = {
    login,
    register,
    logout,
    verifyOTP,
    resendOTP,
    resetPassword,
    getAllUsers,
    updateProfilePhoto,
};
