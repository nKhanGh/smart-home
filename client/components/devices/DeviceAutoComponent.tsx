import ThresholdModal from "@/components/modals/ThresholdModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Toast } from "@/components/ui/Toast";
import { ThresholdService } from "@/service/threshold.service";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import Icon from "react-native-vector-icons/FontAwesome5";
import ConfirmationModal from "../modals/ConfirmationModal";

const DeviceAutoComponent = ({ device }: { device: DeviceResponse }) => {
  const [thresholds, setThresholds] = useState<ThresholdResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [menuThreshold, setMenuThreshold] = useState<ThresholdResponse | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [editingThreshold, setEditingThreshold] =
    useState<ThresholdResponse | null>(null);

  const orderedThresholds = useMemo(() => {
    return [...thresholds].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [thresholds]);

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletingThreshold, setDeletingThreshold] = useState(false);
  const [thresholdToDelete, setThresholdToDelete] = useState<string | null>(
    null,
  );

  const fetchThresholds = async () => {
    try {
      setLoading(true);
      const response = await ThresholdService.getThresholdDevices(device?.id);
      const mapped = (response.data || []).map((item: any) => ({
        _id: item._id,
        deviceId: item.deviceId,
        sensor: item.sensor,
        active: Boolean(item.active),
        value: Number(item.value),
        when: item.when,
        action: item.action,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })) as ThresholdResponse[];
      setThresholds(mapped);
    } catch (e) {
      console.error(e);
      setThresholds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThresholds();
  }, [device?.id]);

  const onToggleActive = async (thresholdId: string, nextActive: boolean) => {
    const previous = thresholds;
    setProcessingId(thresholdId);
    setThresholds((prev) =>
      prev.map((item) =>
        item._id === thresholdId ? { ...item, active: nextActive } : item,
      ),
    );
    try {
      await ThresholdService.switchThreshold(thresholdId, nextActive);
    } catch (e) {
      setThresholds(previous);
      console.log(e);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: `Không thể ${nextActive ? "bật" : "tắt"} ngưỡng. Vui lòng thử lại.`,
      });
    } finally {
      setProcessingId(null);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: `Ngưỡng đã được ${nextActive ? "bật" : "tắt"}.`,
      });
    }
  };

  const handleDeleteThreshold = async () => {
    if (!thresholdToDelete) return;
    setDeletingThreshold(true);
    try {
      await ThresholdService.deleteThreshold(thresholdToDelete);
      await fetchThresholds();
      setDeleteConfirmVisible(false);
    } catch (e) {
      console.log(e);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể xóa ngưỡng. Vui lòng thử lại.",
      });
    } finally {
      setDeletingThreshold(false);
      setThresholdToDelete(null);
    }
  };

  const onDeleteThreshold = (thresholdId: string) => {
    setMenuThreshold(null);
    setDeleteConfirmVisible(true);
    setDeletingThreshold(false);
    setThresholdToDelete(thresholdId);
  };

  const onPressEdit = (threshold: ThresholdResponse) => {
    setMenuThreshold(null);
    setEditingThreshold(threshold);
    setModalVisible(true);
  };

  const onPressCreate = () => {
    setMenuThreshold(null);
    setEditingThreshold(null);
    setModalVisible(true);
  };

  const onCloseThresholdModal = () => {
    setModalVisible(false);
    setEditingThreshold(null);
  };

  const getThresholdMeta = (threshold: ThresholdResponse) => {
    const whenText = threshold.when === "above" ? "lớn hơn" : "nhỏ hơn";
    const actionMap: Record<
      string,
      { label: string; icon: string; color: string; bg: string }
    > = {
      alert: {
        label: "Gửi cảnh báo",
        icon: "bell",
        color: "#D97706",
        bg: "#FFFBEB",
      },
      on: {
        label: "Bật thiết bị",
        icon: "power-off",
        color: "#16A34A",
        bg: "#F0FDF4",
      },
      off: {
        label: "Tắt thiết bị",
        icon: "power-off",
        color: "#DC2626",
        bg: "#FEF2F2",
      },
    };
    const action = actionMap[threshold.action] ?? actionMap.off;
    return { whenText, action };
  };

  if (loading) {
    return (
      <View style={styles.centeredBox}>
        <LoadingSpinner variant="wave" color="#16A34A" size={32} />
        <Text style={styles.loadingText}>Đang tải ngưỡng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Icon name="sliders-h" size={13} color="#16A34A" />
          </View>
          <View>
            <Text style={styles.title}>Ngưỡng tự động</Text>
            <Text style={styles.subtitle}>
              {orderedThresholds.length} quy tắc đang hoạt động
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onPressCreate}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={11} color="#fff" />
          <Text style={styles.addButtonText}>Thêm mới</Text>
        </TouchableOpacity>
      </View>

      {/* Empty state */}
      {orderedThresholds.length === 0 && (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconWrap}>
            <Icon name="sliders-h" size={20} color="#86EFAC" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có ngưỡng nào</Text>
          <Text style={styles.emptyText}>
            Nhấn "Thêm mới" để tạo quy tắc tự động cho thiết bị.
          </Text>
        </View>
      )}

      {/* Cards */}
      {orderedThresholds.map((threshold) => {
        const { whenText, action } = getThresholdMeta(threshold);
        const isProcessing = processingId === threshold._id;

        return (
          <View
            key={threshold._id}
            style={[styles.card, isProcessing && styles.cardProcessing]}
          >
            {/* Active indicator strip */}
            <View
              style={[
                styles.activeStrip,
                { backgroundColor: threshold.active ? "#16A34A" : "#D1D5DB" },
              ]}
            />

            <View style={styles.cardInner}>
              {/* Top row */}
              <View style={styles.cardHeader}>
                {/* Sensor info */}
                <View style={styles.sensorRow}>
                  <View style={styles.sensorIconWrap}>
                    <Icon name="microchip" size={11} color="#16A34A" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sensorName}>
                      {threshold.sensor.name}
                    </Text>
                    {threshold.sensor.roomName ? (
                      <Text style={styles.sensorRoom}>
                        {threshold.sensor.roomName}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* More button */}
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => setMenuThreshold(threshold)}
                  activeOpacity={0.7}
                >
                  <Icon name="ellipsis-v" size={14} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Condition */}
              <View style={styles.cardTop}>
                <Text style={styles.conditionText}>
                  Nếu giá trị{" "}
                  <Text style={styles.conditionHighlight}>
                    {whenText} {threshold.value}
                  </Text>
                </Text>

                {/* Action badge */}
                <View
                  style={[styles.actionBadge, { backgroundColor: action.bg }]}
                >
                  <Icon name={action.icon} size={11} color={action.color} />
                  <Text
                    style={[styles.actionBadgeText, { color: action.color }]}
                  >
                    {action.label}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Bottom row */}
              <View style={styles.cardBottom}>
                <TouchableOpacity
                  onPress={() => onDeleteThreshold(threshold._id)}
                  disabled={isProcessing}
                  style={[
                    styles.deleteButton,
                    isProcessing && styles.disabledButton,
                  ]}
                  activeOpacity={0.7}
                >
                  <Icon name="trash-alt" size={12} color="#DC2626" />
                  <Text style={styles.deleteButtonText}>Xóa</Text>
                </TouchableOpacity>

                <View style={styles.switchWrap}>
                  <Text
                    style={[
                      styles.switchLabel,
                      { color: threshold.active ? "#16A34A" : "#9CA3AF" },
                    ]}
                  >
                    {threshold.active ? "Đang bật" : "Đang tắt"}
                  </Text>
                  <Switch
                    value={threshold.active}
                    onValueChange={(next) =>
                      onToggleActive(threshold._id, next)
                    }
                    disabled={isProcessing}
                    trackColor={{ false: "#E5E7EB", true: "#86EFAC" }}
                    thumbColor={threshold.active ? "#16A34A" : "#D1D5DB"}
                    ios_backgroundColor="#E5E7EB"
                  />
                </View>
              </View>
            </View>
          </View>
        );
      })}

      {/* Context Menu Modal */}
      <Modal
        isVisible={Boolean(menuThreshold)}
        onBackButtonPress={() => setMenuThreshold(null)}
        animationIn="fadeIn"
        animationOut="fadeOut"
        backdropOpacity={0}
        style={{ margin: 0 }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuThreshold(null)}
        >
          <Pressable
            style={styles.menuSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.menuHandle} />
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Tùy chọn ngưỡng</Text>
            </View>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => menuThreshold && onPressEdit(menuThreshold)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.menuIconWrap, { backgroundColor: "#F0FDF4" }]}
              >
                <Icon name="edit" size={13} color="#16A34A" />
              </View>
              <Text style={styles.menuItemText}>Chỉnh sửa ngưỡng</Text>
              <Icon
                name="chevron-right"
                size={11}
                color="#D1D5DB"
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setMenuThreshold(null)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.menuIconWrap, { backgroundColor: "#F9FAFB" }]}
              >
                <Icon name="times" size={13} color="#6B7280" />
              </View>
              <Text style={[styles.menuItemText, { color: "#6B7280" }]}>
                Đóng
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      {modalVisible && (
        <ThresholdModal
          visible={modalVisible}
          onClose={onCloseThresholdModal}
          device={device}
          editingThreshold={editingThreshold}
          onSuccess={fetchThresholds}
        />
      )}
      <ConfirmationModal
        visible={deleteConfirmVisible}
        title="Xác nhận xóa ngưỡng"
        message="Bạn có chắc chắn muốn xóa ngưỡng này không? Hành động này không thể hoàn tác."
        confirmText="Xóa ngưỡng"
        cancelText="Hủy bỏ"
        iconName="alert"
        isDangerous
        loading={deletingThreshold}
        onConfirm={handleDeleteThreshold}
        onCancel={() => setDeleteConfirmVisible(false)}
        notificationMessage="Ngưỡng đã được xóa"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    gap: 12,
  },
  centeredBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#14532D",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 1,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#16A34A",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  // Empty state
  emptyBox: {
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#14532D",
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // Card Header
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sensorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  sensorIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  sensorName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  sensorRoom: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
    marginTop: 1,
  },
  moreButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardProcessing: {
    opacity: 0.65,
  },
  activeStrip: {
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  cardInner: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sensorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  sensorBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
    letterSpacing: 0.2,
  },

  conditionText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  conditionHighlight: {
    color: "#111827",
    fontWeight: "800",
  },
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  actionBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  disabledButton: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "700",
  },
  switchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    padding: 16,
    paddingBottom: 32,
  },
  menuSheet: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    paddingBottom: 8,
  },
  menuHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  menuHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
});

export default DeviceAutoComponent;
