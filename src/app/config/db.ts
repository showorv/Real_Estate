import mongoose from "mongoose";
import { env } from "./env";


export const connectDB = async () => {
  try {
    await mongoose.connect(env.mongoUri);

    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Database Connection Failed");

    process.exit(1);
  }
};

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}