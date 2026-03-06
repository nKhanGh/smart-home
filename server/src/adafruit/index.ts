import axios, { AxiosInstance } from "axios";

const AIO_USERNAME = process.env.AIO_USERNAME as string;
const AIO_KEY      = process.env.AIO_KEY      as string;

// Singleton axios instance
const adafruitAPI: AxiosInstance = axios.create({
  baseURL: `https://io.adafruit.com/api/v2/${AIO_USERNAME}`,
  headers: {
    "X-AIO-Key"   : AIO_KEY,
    "Content-Type": "application/json",
  },
  timeout: 5000,
});

export { adafruitAPI, AIO_USERNAME };
