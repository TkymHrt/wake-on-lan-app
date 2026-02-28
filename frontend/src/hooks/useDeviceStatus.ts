import { useEffect, useState } from "preact/hooks";
import { checkDeviceStatus } from "../services/wolService";
import type { DeviceStatus, HistoryItem } from "../types/wol";

export const useDeviceStatus = (history: HistoryItem[]) => {
	const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({});

	useEffect(() => {
		const checkAllDevicesStatus = async () => {
			const newStatus = { ...deviceStatus };

			const statusResults = await Promise.all(
				history.map(async (item) => {
					if (!item.ipAddress) {
						return null;
					}

					try {
						const data = await checkDeviceStatus(item.ipAddress);
						return { ipAddress: item.ipAddress, online: data.online };
					} catch (error) {
						console.error(
							`Error checking status for ${item.ipAddress}:`,
							error,
						);
						return { ipAddress: item.ipAddress, online: false };
					}
				}),
			);

			Object.assign(
				newStatus,
				Object.fromEntries(
					statusResults
						.filter(
							(result): result is { ipAddress: string; online: boolean } =>
								result !== null,
						)
						.map((result) => [result.ipAddress, result.online]),
				),
			);

			setDeviceStatus(newStatus);
		};

		checkAllDevicesStatus();
		const intervalId = setInterval(checkAllDevicesStatus, 30000);

		return () => clearInterval(intervalId);
	}, [history]);

	return deviceStatus;
};
