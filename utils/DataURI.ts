import DataUriParser from "datauri/parser";
import path from "path";
const getDataURI = (file: any) => {
  const parser = new DataUriParser();
  return parser.format(path.extname(file.originalname).toString(), file.buffer);
};
module.exports = getDataURI;
export = getDataURI;
