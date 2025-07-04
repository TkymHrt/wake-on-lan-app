export interface HistoryItem {
	mac: string;
	deviceName: string;
	ipAddress: string;
}

export interface StatusResponse {
	message: string;
	isError: boolean;
}

export interface DeviceStatus {
	[ip: string]: boolean;
}

export interface StatusCheckResponse {
	online: boolean;
}

export interface WakeResponse {
	message?: string;
	error?: string;
}

export interface WakeFormData {
	mac: string;
	deviceName: string;
	ipAddress: string;
}
