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
const bcrypt = require("bcryptjs");
require("dotenv").config();
const nodemailer = require("nodemailer");
const UserOTPVerification = require("../models/userOTPVerification.ts");
const sendOTPVerificationEmail = (email, user_id, user_name, body, usernameOrEmail) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const otp = `${1000 + Math.floor(Math.random() * 9000)}`;
        const testAccount = yield nodemailer.createTestAccount();
        const config = {
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        };
        const transporter = nodemailer.createTransport(config);
        const message = {
            from: "Co Working Space",
            to: email,
            subject: body
                ? body.subject
                : `Welcome to Co Working Space, ${user_name}`,
            text: body ? body.message : `Here is your otp for verification `,
            html: `<b>${otp}</b>
      <br/>
      <b>OTP will expire in 1 hour</b>

      `, // html body
        };
        const response = transporter.sendMail(message, (err, info) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                console.log("Error occurred. " + err.message);
                return process.exit(1);
            }
            console.log("Message sent: %s", info.messageId);
            console.log("Node Mailer Response", nodemailer.getTestMessageUrl(info));
            const hashedOTP = yield bcrypt.hash(otp, 10);
            if (!usernameOrEmail) {
                const UserOTP = yield UserOTPVerification.create({
                    user: user_id,
                    otp: hashedOTP,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + 3600000,
                });
                yield UserOTP.save();
            }
            else {
                const UserOTP = yield UserOTPVerification.create({
                    user: usernameOrEmail,
                    otp: hashedOTP,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + 3600000,
                });
                yield UserOTP.save();
            }
        }));
    }
    catch (error) {
        console.log("MAIL SENDING FAILED", error);
    }
});
module.exports = sendOTPVerificationEmail;
