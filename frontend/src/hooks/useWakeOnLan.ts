import { useState } from "preact/hooks";
import { toast } from "react-toastify";
import {
	checkDeviceStatus,
	sendWakePacket,
	validateMacAddress,
} from "../services/wolService";
import type { HistoryItem, WakeFormData } from "../types/wol";

interface UseWakeOnLanProps {
	onHistoryUpdate: (item: HistoryItem) => void;
}

export const useWakeOnLan = ({ onHistoryUpdate }: UseWakeOnLanProps) => {
	const [loading, setLoading] = useState(false);

	const sendWake = async (formData: WakeFormData) => {
		if (!validateMacAddress(formData.mac)) {
			toast.error("無効なMACアドレス形式です (例: AA:BB:CC:DD:EE:FF)");
			return;
		}

		setLoading(true);

		try {
			const response = await sendWakePacket(formData.mac);

			onHistoryUpdate({
				mac: formData.mac,
				deviceName: formData.deviceName,
				ipAddress: formData.ipAddress,
			});

			toast.info(response.message || "Wake-on-LANパケットを送信しました");

			if (formData.ipAddress) {
				await monitorDeviceStatus(formData.ipAddress);
			}
		} catch (error) {
			toast.error(`エラー: ${(error as Error).message}`);
		} finally {
			setLoading(false);
		}
	};

	const monitorDeviceStatus = async (ipAddress: string) => {
		let attempts = 0;
		const maxAttempts = 10;

		const checkStatus = async () => {
			attempts++;
			try {
				const statusData = await checkDeviceStatus(ipAddress);
				if (statusData.online) {
					toast.success(`\nデバイスがオンラインになりました。`);
					clearInterval(intervalId);
				} else if (attempts >= maxAttempts) {
					toast.error(`\nデバイスがオンラインになりませんでした。`);
					clearInterval(intervalId);
				}
			} catch {
				if (attempts >= maxAttempts) {
					toast.error(`\nステータス確認エラーが発生しました。`);
					clearInterval(intervalId);
				}
			}
		};

		const intervalId = setInterval(checkStatus, 2000);
		checkStatus();
	};

	return {
		loading,
		sendWake,
	};
};
