import { styles } from "@/styles/(tabs)/index.styles";
import { useState } from "react";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";

const getDeviceId = (device: DeviceResponse) =>
  device.id || (device as DeviceResponse & { _id?: string })._id || "";

const RoomBadge = ({
  roomName,
  device,
  onSelect,
}: {
  roomName: string;
  device: DeviceResponse[];
  onSelect: (device: DeviceResponse) => void;
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={styles.roomBadge}
        onPress={() => setVisible(true)}
      >
        <View style={styles.dot} />
        <Text style={styles.roomBadgeText}>{roomName}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      <Modal
        transparent
        animationType="fade"
        visible={visible}
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "#00000040",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
          onPress={() => setVisible(false)}
          activeOpacity={1}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <Text
              style={{
                padding: 16,
                fontWeight: "700",
                fontSize: 15,
                color: "#111827",
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6",
              }}
            >
              Chọn phòng
            </Text>
            <FlatList
              data={device}
              keyExtractor={(item) => getDeviceId(item) || item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F9FAFB",
                    backgroundColor:
                      item.roomId.name === roomName ? "#F0FDF4" : "white",
                  }}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color:
                        item.roomId.name === roomName ? "#22C55E" : "#374151",
                      fontWeight: item.roomId.name === roomName ? "700" : "400",
                    }}
                  >
                    {item.roomId.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default RoomBadge;
