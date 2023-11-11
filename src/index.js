import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

const PORT = process.env.PORT || 3000;

dotenv.config({ path: "./.env" });
//If we want to remove this line then "-r dotenv/config --experimental-json-modules"
// this string should be in the dev command in package.json file

connectDB()
  .then(() =>
    app.listen(PORT, () => console.log("Server listening on port", PORT)),
  )
  .catch((err) => console.log("MONGODB CONNECTION FAILED: " + err));
