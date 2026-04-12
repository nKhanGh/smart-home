export const getAction = (type: string, currentAction: string | number) => {
  if (type === "doorDevice") {
    return currentAction === "0" || currentAction === 0
      ? "Đang đóng"
      : "Đang mở";
  } else if (type.endsWith("Device")) {
    return currentAction === "0" || currentAction === 0
      ? "Đang tắt"
      : "Đang bật";
  }

  return "";
};

export const getNextAction = (
  type: string,
  currentAction: string | number,
): string => {
  if (type === "fanDevice") {
    return currentAction.toString() === "0" ? "100" : "0";
  }

  return currentAction === "0" ? "1" : "0";
};

export const getUnit = (type: string) => {
  if (type === "temperatureSensor") return "°C";
  if (type === "lightSensor") return " lux";
  if (type === "humiditySensor") return " %";
  return "";
}

export const isSensor = (type: string) => {
  return type.endsWith("Sensor");
}