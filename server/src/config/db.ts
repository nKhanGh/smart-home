import mongoose from "mongoose";

let isConnected = false;

const connectDB = async (): Promise<void> => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    isConnected = true;
    console.log("[DB] MongoDB đã kết nối.");
  } catch (err) {
    console.error("[DB] Kết nối thất bại:", err);
    process.exit(1);
  }
};

export default connectDB;
