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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const nodemailer_1 = __importDefault(require("nodemailer"));
const userOTPVerification_1 = __importDefault(require("../models/userOTPVerification"));
const sendOTPVerificationEmail = (email, user_id, user_name, body, usernameOrEmail) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const otp = `${1000 + Math.floor(Math.random() * 9000)}`;
        const testAccount = yield nodemailer_1.default.createTestAccount();
        const config = {
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        };
        const transporter = nodemailer_1.default.createTransport(config);
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
            console.log("Node Mailer Response", nodemailer_1.default.getTestMessageUrl(info));
            const hashedOTP = yield bcryptjs_1.default.hash(otp, 10);
            if (!usernameOrEmail) {
                const UserOTP = yield userOTPVerification_1.default.create({
                    user: user_id,
                    otp: hashedOTP,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + 3600000,
                });
                yield UserOTP.save();
            }
            else {
                const UserOTP = yield userOTPVerification_1.default.create({
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
module.exports = sendOTPVerificationEmail;
