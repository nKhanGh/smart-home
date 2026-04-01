import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F0FAF0",
	},
	scroll: {
		padding: 16,
		paddingBottom: 100,
		gap: 14,
	},
	header: {
		gap: 4,
	},
	title: {
		fontSize: 24,
		fontWeight: "800",
		color: "#111827",
	},
	subtitle: {
		fontSize: 13,
		color: "#6B7280",
	},
	selectorCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 14,
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 3,
	},
	label: {
		fontSize: 13,
		color: "#374151",
		fontWeight: "700",
		marginBottom: 10,
	},
	sensorChipRow: {
		flexDirection: "row",
		gap: 8,
		paddingBottom: 6,
	},
	sensorChip: {
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#D1D5DB",
		backgroundColor: "#F9FAFB",
		minWidth: 130,
	},
	sensorChipActive: {
		borderColor: "#22C55E",
		backgroundColor: "#DCFCE7",
	},
	sensorChipName: {
		fontWeight: "700",
		fontSize: 13,
		color: "#1F2937",
	},
	sensorChipNameActive: {
		color: "#166534",
	},
	sensorChipRoom: {
		marginTop: 3,
		color: "#6B7280",
		fontSize: 12,
	},
	sensorChipRoomActive: {
		color: "#15803D",
	},
	periodLabel: {
		marginTop: 12,
	},
	periodRow: {
		flexDirection: "row",
		gap: 8,
	},
	periodBtn: {
		flex: 1,
		borderWidth: 1,
		borderColor: "#D1D5DB",
		borderRadius: 10,
		paddingVertical: 8,
		alignItems: "center",
		backgroundColor: "#F9FAFB",
	},
	periodBtnActive: {
		backgroundColor: "#22C55E",
		borderColor: "#22C55E",
	},
	periodBtnText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#374151",
	},
	periodBtnTextActive: {
		color: "#FFFFFF",
	},
	errorText: {
		color: "#DC2626",
		fontSize: 13,
		fontWeight: "600",
	},
	statsCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 14,
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 3,
		gap: 12,
	},
	statsCardHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	sensorIcon: {
		fontSize: 28,
	},
	statsCardTitle: {
		fontSize: 15,
		fontWeight: "800",
		color: "#111827",
	},
	statsCardSubTitle: {
		marginTop: 2,
		fontSize: 12,
		color: "#6B7280",
	},
	loadingWrap: {
		paddingVertical: 20,
		alignItems: "center",
		gap: 6,
	},
	loadingText: {
		fontSize: 12,
		color: "#6B7280",
	},
	currentValueWrap: {
		alignItems: "center",
		marginTop: 4,
	},
	currentLabel: {
		fontSize: 12,
		color: "#6B7280",
		fontWeight: "700",
	},
	currentValue: {
		fontSize: 36,
		fontWeight: "900",
		marginTop: 4,
	},
	chartTitle: {
		fontSize: 13,
		fontWeight: "800",
		color: "#374151",
		marginTop: 4,
	},
	noDataText: {
		fontSize: 12,
		color: "#9CA3AF",
	},
	lineChartWrap: {
		marginTop: 4,
		position: "relative",
		borderRadius: 12,
		backgroundColor: "#F9FAFB",
		borderWidth: 1,
		borderColor: "#E5E7EB",
	},
	lineChartGrid: {
		position: "absolute",
		left: 0,
		right: 0,
		top: 36,
		bottom: 42,
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderColor: "#E5E7EB",
	},
	lineSegment: {
		position: "absolute",
		height: 2,
		borderRadius: 2,
	},
	linePointWrap: {
		position: "absolute",
	},
	linePoint: {
		position: "absolute",
		width: 10,
		height: 10,
		borderRadius: 5,
		borderWidth: 2,
		backgroundColor: "#FFFFFF",
	},
	pointValue: {
		position: "absolute",
		width: 40,
		textAlign: "center",
		fontSize: 10,
		color: "#374151",
		fontWeight: "700",
	},
	pointLabel: {
		position: "absolute",
		width: 48,
		textAlign: "center",
		fontSize: 10,
		color: "#9CA3AF",
	},
	chartRow: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 10,
		paddingTop: 4,
		paddingBottom: 4,
	},
	barWrap: {
		width: 44,
		alignItems: "center",
		gap: 4,
	},
	bar: {
		width: 16,
		borderRadius: 8,
		minHeight: 24,
	},
	barValue: {
		fontSize: 10,
		color: "#6B7280",
		fontWeight: "700",
	},
	barLabel: {
		fontSize: 10,
		color: "#9CA3AF",
		width: 42,
		textAlign: "center",
	},
	metricsRow: {
		flexDirection: "row",
		gap: 8,
		marginTop: 6,
	},
	metricItem: {
		flex: 1,
		backgroundColor: "#F9FAFB",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		paddingVertical: 12,
		alignItems: "center",
		gap: 4,
	},
	metricLabel: {
		fontSize: 12,
		color: "#6B7280",
		fontWeight: "700",
	},
	metricValue: {
		fontSize: 14,
		color: "#111827",
		fontWeight: "800",
	},
});

export const getCurrentValueStyle = (color: string) => ({ color });

export const getLineChartWrapStyle = (width: number, height: number) => ({
	width,
	height,
});

export const getLineSegmentStyle = (
	left: number,
	top: number,
	width: number,
	color: string,
	angle: number,
) => ({
	left,
	top,
	width,
	backgroundColor: color,
	transform: [{ rotate: `${angle}deg` }],
});

export const getPointValueStyle = (left: number, top: number) => ({
	left,
	top,
});

export const getLinePointStyle = (left: number, top: number, borderColor: string) => ({
	left,
	top,
	borderColor,
});

export const getPointLabelStyle = (left: number, top: number) => ({
	left,
	top,
});

export const getBarStyle = (height: number, color: string) => ({
	height,
	backgroundColor: color,
});
