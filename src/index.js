import dotenv from "dotenv";

dotenv.config({ path: "./.env" });
//If we want to remove this line then "-r dotenv/config --experimental-json-modules"
// this string should be in the dev command in package.json file

import connectDB from "./db/index.js";

connectDB();
