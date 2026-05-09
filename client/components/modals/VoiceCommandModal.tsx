import { DeviceService } from "@/service/device.service";
import Constants from "expo-constants";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import Icon from "react-native-vector-icons/FontAwesome5";

let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEventSafe: (
  event: string,
  listener: (event: any) => void,
) => void = () => {};

try {
  const speechRecognition = require("expo-speech-recognition");
  ExpoSpeechRecognitionModule = speechRecognition.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEventSafe =
    speechRecognition.useSpeechRecognitionEvent ??
    useSpeechRecognitionEventSafe;
} catch {
  // Keep modal usable without voice capture when native module is unavailable.
}

const { width: SCREEN_W } = Dimensions.get("window");

// ── Types ─────────────────────────────────────────────────────────────────────
type Status = "idle" | "listening" | "processing" | "success" | "error";

interface VoiceResult {
  action: string;
  deviceName: string;
  roomName?: string;
  rawText: string;
}

// ── Hints ─────────────────────────────────────────────────────────────────────
const HINTS = [
  { icon: "lightbulb", text: "Bật đèn phòng khách" },
  { icon: "wind", text: "Tắt quạt phòng ngủ" },
  { icon: "lightbulb", text: "Mở đèn bàn làm việc" },
  { icon: "wind", text: "Khởi động quạt trần" },
];

// ── Animated mic rings ────────────────────────────────────────────────────────
const PulseRings = ({ active }: { active: boolean }) => {
  const rings = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    if (!active) {
      rings.forEach((r) => r.setValue(0));
      return;
    }
    const anims = rings.map((r, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 300),
          Animated.timing(r, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [active]);

  return (
    <View style={ring.container} pointerEvents="none">
      {rings.map((r, i) => (
        <Animated.View
          key={i}
          style={[
            ring.ring,
            {
              opacity: r.interpolate({
                inputRange: [0, 0.4, 1],
                outputRange: [0, 0.35, 0],
              }),
              transform: [
                {
                  scale: r.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 2.8],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const ring = StyleSheet.create({
  container: {
    position: "absolute",
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#16A34A",
  },
});

// ── Sound wave bars ───────────────────────────────────────────────────────────
const SoundWave = ({ active }: { active: boolean }) => {
  const bars = Array.from(
    { length: 7 },
    (_, i) => useRef(new Animated.Value(0.2)).current,
  );

  useEffect(() => {
    if (!active) {
      bars.forEach((b) =>
        Animated.timing(b, {
          toValue: 0.2,
          duration: 200,
          useNativeDriver: true,
        }).start(),
      );
      return;
    }
    const anims = bars.map((b, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 80),
          Animated.timing(b, {
            toValue: 1,
            duration: 350 + i * 40,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(b, {
            toValue: 0.2,
            duration: 350 + i * 40,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [active]);

  return (
    <View style={wave.container}>
      {bars.map((b, i) => (
        <Animated.View
          key={i}
          style={[wave.bar, { transform: [{ scaleY: b }] }]}
        />
      ))}
    </View>
  );
};

const wave = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 36,
  },
  bar: {
    width: 4,
    height: 28,
    borderRadius: 2,
    backgroundColor: "#16A34A",
  },
});

// ── Main Modal ────────────────────────────────────────────────────────────────
interface VoiceModalProps {
  visible: boolean;
  onClose: () => void;
}

const VoiceCommandModal = ({ visible, onClose }: VoiceModalProps) => {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<DeviceVoiceCommandResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const isExpoGo = Constants.executionEnvironment === "storeClient";

  const isListening = status === "listening";
  const isProcessing = status === "processing";

  // ── Reset on open ──
  useEffect(() => {
    if (visible) {
      setStatus("idle");
      setTranscript("");
      setResult(null);
      setErrorMsg("");
    } else {
      stopListening();
    }
  }, [visible]);

  // ── Speech recognition events ──
  useSpeechRecognitionEventSafe("start", () => setStatus("listening"));
  useSpeechRecognitionEventSafe("end", () => {
    if (status === "listening") setStatus("processing");
  });
  useSpeechRecognitionEventSafe("result", (e) => {
    const text = e.results?.[0]?.transcript ?? "";
    setTranscript(text);
    if (e.isFinal && text.trim()) {
      handleSendCommand(text.trim());
    }
  });
  useSpeechRecognitionEventSafe("error", (e) => {
    setStatus("error");
    setErrorMsg(e.message ?? "Không nhận được giọng nói.");
  });

  const startListening = async () => {
    if (!ExpoSpeechRecognitionModule) {
      setStatus("error");
      setErrorMsg(
        isExpoGo
          ? "Expo Go chưa hỗ trợ expo-speech-recognition. Hãy chạy app bằng Development Build (npx expo run:android/ios hoặc EAS build)."
          : "Thiết bị chưa hỗ trợ nhận diện giọng nói (ExpoSpeechRecognition).",
      );
      return;
    }

    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      setStatus("error");
      setErrorMsg("Cần quyền truy cập microphone.");
      return;
    }
    setTranscript("");
    setResult(null);
    setErrorMsg("");
    ExpoSpeechRecognitionModule.start({
      lang: "vi-VN",
      interimResults: true,
      maxAlternatives: 1,
      continuous: false,
    });
  };

  const stopListening = () => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {}
  };

  const handleMicPress = () => {
    if (isListening) {
      stopListening();
    } else if (status !== "processing") {
      startListening();
    }
  };

  const handleSendCommand = async (text: string) => {
    setStatus("processing");
    try {
      const res = await DeviceService.sendVoidCommand(text);
      setResult(res.data);
      setStatus("success");
    } catch (e: any) {
      console.log(e);
      const msg = e?.response?.data?.message ?? "Không thực hiện được lệnh.";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setTranscript("");
    setResult(null);
    setErrorMsg("");
  };

  // ── Mic button color ──
  const micBg = isListening
    ? "#DC2626"
    : status === "processing"
      ? "#6B7280"
      : "#16A34A";

  return (
    <Modal
      isVisible={visible}
      onBackButtonPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0}
      style={{ margin: 0 }}
    >
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerIconWrap}>
              <Icon name="microphone" size={13} color="#16A34A" />
            </View>
            <Text style={s.headerTitle}>Điều khiển giọng nói</Text>
            <TouchableOpacity
              style={s.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Icon name="times" size={13} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* ── Mic area ── */}
          <View style={s.micArea}>
            <PulseRings active={isListening} />
            <TouchableOpacity
              style={[s.micBtn, { backgroundColor: micBg }]}
              onPress={handleMicPress}
              activeOpacity={0.85}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Icon name="circle-notch" size={28} color="#fff" />
              ) : isListening ? (
                <Icon name="stop" size={24} color="#fff" />
              ) : (
                <Icon name="microphone" size={28} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {/* ── Status label ── */}
          <View style={s.statusRow}>
            {isListening && <SoundWave active />}
            <Text
              style={[
                s.statusText,
                isListening && s.statusListening,
                isProcessing && s.statusProcessing,
                status === "error" && s.statusError,
                status === "success" && s.statusSuccess,
              ]}
            >
              {isListening
                ? "Đang lắng nghe..."
                : isProcessing
                  ? "Đang xử lý lệnh..."
                  : status === "success"
                    ? "Thực hiện thành công"
                    : status === "error"
                      ? "Không thực hiện được"
                      : "Nhấn để bắt đầu nói"}
            </Text>
          </View>

          {/* ── Transcript ── */}
          {(transcript || isListening) &&
            status !== "success" &&
            status !== "error" && (
              <View style={s.transcriptBox}>
                <Icon name="quote-left" size={10} color="#9CA3AF" />
                <Text style={s.transcriptText}>{transcript || "..."}</Text>
              </View>
            )}

          {/* ── Success result ── */}
          {status === "success" && result && (
            <View style={s.resultBox}>
              <View style={s.resultIconWrap}>
                <Icon name="check" size={16} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.resultAction}>
                  {result.parsed.action === "on" ? "Đã bật" : "Đã tắt"}{" "}
                  <Text style={s.resultDevice}>{result.parsed.deviceName}</Text>
                </Text>
                {result.parsed.roomName && (
                  <Text style={s.resultRoom}>
                    <Icon name="map-marker-alt" size={11} color="#6B7280" />{" "}
                    {result.parsed.roomName}
                  </Text>
                )}
                {result.parsed.rawText && (
                  <Text style={s.resultRaw}>"{result.parsed.rawText}"</Text>
                )}
              </View>
            </View>
          )}

          {/* ── Error ── */}
          {status === "error" && (
            <View style={s.errorBox}>
              <Icon name="exclamation-circle" size={14} color="#DC2626" />
              <Text style={s.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* ── Action buttons ── */}
          {(status === "success" || status === "error") && (
            <View style={s.actionRow}>
              <TouchableOpacity
                style={s.retryBtn}
                onPress={handleRetry}
                activeOpacity={0.8}
              >
                <Icon name="redo" size={12} color="#16A34A" />
                <Text style={s.retryBtnText}>Thử lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.doneBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={s.doneBtnText}>Xong</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Hints (chỉ hiện khi idle) ── */}
          {status === "idle" && (
            <View style={s.hintsSection}>
              <Text style={s.hintsTitle}>Ví dụ câu lệnh</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.hintsScroll}
              >
                {HINTS.map((h, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.hintChip}
                    activeOpacity={0.7}
                    onPress={() => {
                      setTranscript(h.text);
                      handleSendCommand(h.text);
                    }}
                  >
                    <Icon name={h.icon} size={11} color="#16A34A" />
                    <Text style={s.hintChipText}>{h.text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={s.tipsBox}>
                <View style={s.tipRow}>
                  <View style={s.tipDot} />
                  <Text style={s.tipText}>
                    Nói rõ <Text style={s.tipBold}>hành động</Text>: bật, tắt,
                    mở, đóng
                  </Text>
                </View>
                <View style={s.tipRow}>
                  <View style={s.tipDot} />
                  <Text style={s.tipText}>
                    Kèm <Text style={s.tipBold}>tên thiết bị</Text> hoặc{" "}
                    <Text style={s.tipBold}>phòng</Text>
                  </Text>
                </View>
                <View style={s.tipRow}>
                  <View style={s.tipDot} />
                  <Text style={s.tipText}>
                    Ví dụ: <Text style={s.tipBold}>"Bật đèn phòng khách"</Text>
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FCFFFC",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 40,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 24,
  },

  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1FAE5",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
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
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: "#14532D",
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  // Mic
  micArea: {
    alignItems: "center",
    justifyContent: "center",
    height: 140,
    marginTop: 8,
  },
  micBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
    shadowColor: "#16A34A",
  },

  // Status
  statusRow: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    minHeight: 44,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
  },
  statusListening: { color: "#DC2626", fontWeight: "700" },
  statusProcessing: { color: "#6B7280", fontWeight: "700" },
  statusError: { color: "#DC2626", fontWeight: "700" },
  statusSuccess: { color: "#15803D", fontWeight: "700" },

  // Transcript
  transcriptBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    padding: 14,
  },
  transcriptText: {
    flex: 1,
    fontSize: 15,
    color: "#14532D",
    fontWeight: "600",
    lineHeight: 22,
    fontStyle: "italic",
  },

  // Result
  resultBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    padding: 16,
  },
  resultIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  resultAction: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    lineHeight: 22,
  },
  resultDevice: {
    fontWeight: "800",
    color: "#14532D",
  },
  resultRoom: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 4,
  },
  resultRaw: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
    marginTop: 6,
  },

  // Error
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#B91C1C",
    fontWeight: "600",
    lineHeight: 20,
  },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
  },
  retryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16A34A",
  },
  doneBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#16A34A",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  // Hints
  hintsSection: {
    marginTop: 20,
    gap: 12,
  },
  hintsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 20,
  },
  hintsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  hintChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  hintChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#15803D",
  },
  tipsBox: {
    marginHorizontal: 20,
    gap: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#86EFAC",
  },
  tipText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    lineHeight: 19,
  },
  tipBold: {
    fontWeight: "700",
    color: "#374151",
  },
});

export default VoiceCommandModal;
