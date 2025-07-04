import type { DeviceStatus, HistoryItem } from "../types/wol";

interface DeviceHistoryProps {
	history: HistoryItem[];
	deviceStatus: DeviceStatus;
	onWakeDevice: (item: HistoryItem) => void;
	onRemoveDevice: (index: number) => void;
}

export const DeviceHistory = ({
	history,
	deviceStatus,
	onWakeDevice,
	onRemoveDevice,
}: DeviceHistoryProps) => {
	if (history.length === 0) {
		return null;
	}

	return (
		<div class="historyCard">
			<div class="historyHeader">
				<h2 class="sectionTitle">使用したデバイス</h2>
				<div class="historyHeaderActions">
					<span class="historyCount">{history.length} デバイス</span>
				</div>
			</div>
			<div class="historyGrid">
				{history.map((item, index) => (
					<DeviceHistoryItem
						key={`history-${item.mac}`}
						item={item}
						index={index}
						isOnline={item.ipAddress ? deviceStatus[item.ipAddress] : undefined}
						onWake={() => onWakeDevice(item)}
						onRemove={() => onRemoveDevice(index)}
					/>
				))}
			</div>
		</div>
	);
};

interface DeviceHistoryItemProps {
	item: HistoryItem;
	index: number;
	isOnline?: boolean;
	onWake: () => void;
	onRemove: () => void;
}

const DeviceHistoryItem = ({
	item,
	isOnline,
	onWake,
	onRemove,
}: DeviceHistoryItemProps) => {
	return (
		<div class="historyItemContainer">
			<div class="historyItem">
				<div class="itemHeader">
					<span class="deviceName">{item.deviceName || "Unknown Device"}</span>
					{item.ipAddress && (
						<span class={`statusBadge ${isOnline ? "online" : "offline"}`}>
							{isOnline ? "🟢 オンライン" : "⚫ オフライン"}
						</span>
					)}
				</div>
				<div class="itemDetails">
					<span class="macAddress">MAC: {item.mac}</span>
					{item.ipAddress && (
						<span class="ipAddress">IP: {item.ipAddress}</span>
					)}
				</div>
				<div class="historyActions">
					<button
						type="button"
						onClick={onWake}
						class="actionButton wakeAction"
					>
						起動
					</button>
					<button
						type="button"
						onClick={onRemove}
						class="actionButton removeAction"
					>
						削除
					</button>
				</div>
			</div>
		</div>
	);
};
