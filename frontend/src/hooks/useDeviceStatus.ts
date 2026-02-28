import { useEffect, useState } from "preact/hooks";
import { checkDeviceStatus } from "../services/wolService";
import type { DeviceStatus, HistoryItem } from "../types/wol";

export const useDeviceStatus = (history: HistoryItem[]) => {
	const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({});

	useEffect(() => {
		const checkAllDevicesStatus = async () => {
			const newStatus = { ...deviceStatus };

			await Promise.all(
				history.map(async (item) => {
					if (item.ipAddress) {
						try {
							const data = await checkDeviceStatus(item.ipAddress);
							newStatus[item.ipAddress] = data.online;
						} catch (error) {
							console.error(
								`Error checking status for ${item.ipAddress}:`,
								error,
							);
							newStatus[item.ipAddress] = false;
						}
					}
				}),
			);

			setDeviceStatus(newStatus);
		};

		checkAllDevicesStatus();
		const intervalId = setInterval(checkAllDevicesStatus, 30000);

		return () => clearInterval(intervalId);
	}, [history]);

	return deviceStatus;
};
