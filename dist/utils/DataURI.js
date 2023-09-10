"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DataUriParser = require("datauri/parser");
const path = require("path");
const getDataURI = (file) => {
    const parser = new DataUriParser();
    return parser.format(path.extname(file.originalname).toString(), file.buffer);
};
module.exports = getDataURI;
