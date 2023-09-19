"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const parser_1 = __importDefault(require("datauri/parser"));
const path_1 = __importDefault(require("path"));
const getDataURI = (file) => {
    const parser = new parser_1.default();
    return parser.format(path_1.default.extname(file.originalname).toString(), file.buffer);
};
module.exports = getDataURI;
module.exports = getDataURI;
