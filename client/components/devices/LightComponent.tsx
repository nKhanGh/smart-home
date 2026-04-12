import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, TouchableOpacity } from "react-native";

import LightWhite from "../../assets/images/light-white.svg";
import LightYellow from "../../assets/images/light-yellow.svg";
import LightBlue from "../../assets/images/light-blue.svg";
import { DeviceService } from "@/service/device.service";
import { useSocket } from "@/contexts/SocketContext";

const lightImages: Record<string, any> = {
  "1": LightWhite,
  "2": LightYellow,
  "3": LightBlue,
};

const COLOR_BUTTONS = [
  { action: "1", color: "#FFFFFF" },
  { action: "2", color: "#FFD166" },
  { action: "3", color: "#3894FF" },
];

const LightComponent = ({ device }: { device: DeviceResponse }) => {
  

  const handleActionChange = async (action: string) => {
    try {
      const newAction = device.currentAction === action ? "0" : action;
      await DeviceService.sendCommand(device.id, newAction);
    } catch (error) {
      console.error("Error updating device action:", error);
    }
  };

  const SelectedLight = lightImages[device.currentAction ?? "0"];
  const isOn = device.currentAction !== "0";

  return (
    <View style={styles.wrapper}>
      {/* Lamp + overlay */}
      <View style={styles.lampContainer}>
        <Image
          source={require("../../assets/images/desk-lamp.png")}
          style={[styles.image, !isOn && styles.dimmed]}
          resizeMode="contain"
        />
        {SelectedLight && (
          <SelectedLight width="70%" height="70%" style={styles.overlay} />
        )}
      </View>

      {/* 3 nút chọn màu ánh sáng */}
      <View style={styles.colorButtons}>
        {COLOR_BUTTONS.map((btn) => {
          const isSelected = device.currentAction === btn.action;
          return (
            <View key={btn.action} style={styles.dotWrapper}>
              <TouchableOpacity
                onPress={() => handleActionChange(btn.action)}
                style={[
                  styles.colorDot,
                  { backgroundColor: btn.color },
                  isSelected && styles.dotSelected,
                ]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    marginTop: 36,
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  lampContainer: {
    width: 260,
    height: 300,
    backgroundColor: "transparent",
  },
  image: {
    position: "absolute",
    left: -36,
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 40,
    left: 70,
  },
  dimmed: {},
  colorButtons: {
    flexDirection: "column",
    justifyContent: "space-around",
    alignItems: "center",
    height: 200,
    gap: 32,
    marginRight: 60,
  },

  dotWrapper: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  dotSelected: {
    transform: [{ scale: 1.8 }],
    borderWidth: 2.5,
    borderColor: "#fff",
  },
});

export default LightComponent;
