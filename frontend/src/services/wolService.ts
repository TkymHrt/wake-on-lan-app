import type { StatusCheckResponse, WakeResponse } from "../types/wol";

export const sendWakePacket = async (mac: string): Promise<WakeResponse> => {
	const response = await fetch(`/api/wake?mac=${mac}`);
	const data: WakeResponse = await response.json();

	if (!response.ok) {
		throw new Error(data.error || "Failed to send wake packet");
	}

	return data;
};

export const checkDeviceStatus = async (
	ip: string,
): Promise<StatusCheckResponse> => {
	const response = await fetch(`/api/status?ip=${encodeURIComponent(ip)}`);

	if (!response.ok) {
		throw new Error("Failed to check device status");
	}

	return response.json();
};

export const validateMacAddress = (mac: string): boolean => {
	const regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
	return regex.test(mac);
};
