
import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config();

const connectDB = async () => {
  const dbURL = process.env.DATABASE_URL;
  console.log(dbURL);
  try {
    // @ts-ignore
    await mongoose.connect(dbURL);
    // if(connection) {
    console.log("Connection Successful!");
    // }

  } catch(error) {
    console.log("DB connection error", error);
  }
}


export default connectDB;
