import { createClient } from "redis";

type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;
let connectPromise: Promise<RedisClient | null> | null = null;

const REDIS_URL = process.env.REDIS_URL?.trim();

const connectRedis = async (): Promise<RedisClient | null> => {
  if (!REDIS_URL) {
    return null;
  }

  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (connectPromise) {
    return connectPromise;
  }

  const client = createClient({ url: REDIS_URL });

  client.on("error", (err) => {
    console.error("[Redis] Lỗi:", err.message);
  });

  connectPromise = client
    .connect()
    .then(() => {
      redisClient = client;
      console.log("[Redis] Đã kết nối.");
      return redisClient;
    })
    .catch((err) => {
      console.error("[Redis] Kết nối thất bại, fallback RAM:", err.message);
      return null;
    })
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
};

export const getRedisClient = async (): Promise<RedisClient | null> => {
  if (redisClient?.isOpen) {
    return redisClient;
  }

  return connectRedis();
};
