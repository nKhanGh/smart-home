import Expo, { ExpoPushMessage } from "expo-server-sdk";
import { title } from "process";
import UserSchema from "../models/UserSchema";

const expo = new Expo();

export const sendPushNotification = async ({
  tokens,
  title,
  body,
  data,
}: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
}) => {
  const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));

  if (validTokens.length === 0) {
    console.warn("No valid Expo push tokens found.");
    return;
  }

  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data: data || {},
    channelId: "default",
    priority: "high",
  }));

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      for (let i = 0; i < ticketChunk.length; i++) {
        const ticket = ticketChunk[i];
        if (ticket.status === "error") {
          if (ticket.details?.error === "DeviceNotRegistered") {
            // Token này chết rồi, xoá khỏi DB
            const deadToken = validTokens[i];
            await UserSchema.updateMany(
              {},
              { $pull: { pushTokens: deadToken } },
            );
          }
        }
      }
      console.log("Push notification chunk sent:", ticketChunk);
    } catch (error) {
      console.error("Error sending push notification chunk:", error);
    }
  }
};
