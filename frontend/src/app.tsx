import "./app.css";
import { useEffect, useState } from "preact/hooks";

const MAX_HISTORY_ITEMS = 5;

interface HistoryItem {
	mac: string;
	deviceName: string;
	ipAddress: string;
}

interface StatusResponse {
	message: string;
	isError: boolean;
}

interface DeviceStatus {
	[ip: string]: boolean;
}

interface StatusCheckResponse {
	online: boolean;
}

interface WakeResponse {
	message?: string;
	error?: string;
}

export function App() {
	const [mac, setMac] = useState<string>("");
	const [deviceName, setDeviceName] = useState<string>("");
	const [ipAddress, setIpAddress] = useState<string>("");
	const [status, setStatus] = useState<StatusResponse | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({});

	useEffect(() => {
		const savedHistory = localStorage.getItem("wolHistory");
		if (savedHistory) {
			setHistory(JSON.parse(savedHistory));
		}
	}, []);

	useEffect(() => {
		localStorage.setItem("wolHistory", JSON.stringify(history));
	}, [history]);

	useEffect(() => {
		const checkAllDevicesStatus = async () => {
			const newStatus = { ...deviceStatus };
			for (const item of history) {
				if (item.ipAddress) {
					try {
						const res = await fetch(
							`/api/status?ip=${encodeURIComponent(item.ipAddress)}`,
						);
						if (res.ok) {
							const data: StatusCheckResponse = await res.json();
							newStatus[item.ipAddress] = data.online;
						}
					} catch (err) {
						console.error(`Error checking status for ${item.ipAddress}:`, err);
					}
				}
			}
			setDeviceStatus(newStatus);
		};

		checkAllDevicesStatus();
		const intervalId = setInterval(checkAllDevicesStatus, 30000);
		return () => clearInterval(intervalId);
	}, [history]);

	const validateMac = (mac: string): boolean => {
		const regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
		return regex.test(mac);
	};

	const handleWake = async (
		targetMac = mac,
		targetDeviceName = deviceName,
		targetIp = ipAddress,
	) => {
		if (!validateMac(targetMac)) {
			setStatus({
				message: "Error: Invalid MAC address format (use XX:XX:XX:XX:XX:XX)",
				isError: true,
			});
			return;
		}

		setLoading(true);
		setStatus(null);
		try {
			const res = await fetch(`/api/wake?mac=${targetMac}`);
			const data: WakeResponse = await res.json();
			if (res.ok) {
				updateHistory(targetMac, targetDeviceName, targetIp);
				setStatus({
					message: data.message || "Wake packet sent successfully",
					isError: false,
				});

				if (targetIp) {
					let attempts = 0;
					const maxAttempts = 10;
					const checkStatus = async () => {
						attempts++;
						try {
							const statusRes = await fetch(
								`/api/status?ip=${encodeURIComponent(targetIp)}`,
							);
							if (!statusRes.ok) throw new Error("Failed to check status");
							const statusData: StatusCheckResponse = await statusRes.json();
							if (statusData.online) {
								setStatus({
									message: `${data.message}\nDevice is online.`,
									isError: false,
								});
								clearInterval(intervalId);
							} else if (attempts >= maxAttempts) {
								setStatus({
									message: `${data.message}\nDevice did not come online.`,
									isError: false,
								});
								clearInterval(intervalId);
							}
						} catch {
							if (attempts >= maxAttempts) {
								setStatus({
									message: `${data.message}\nError checking status.`,
									isError: true,
								});
								clearInterval(intervalId);
							}
						}
					};
					const intervalId = setInterval(checkStatus, 2000);
					checkStatus();
				}
			} else {
				setStatus({ message: `Error: ${data.error}`, isError: true });
			}
		} catch (err) {
			setStatus({ message: `Error: ${(err as Error).message}`, isError: true });
		} finally {
			setLoading(false);
		}
	};

	const updateHistory = (
		macToUpdate: string,
		deviceNameToUpdate: string,
		ipToUpdate: string,
	) => {
		const targetMac = macToUpdate || mac;
		const targetDeviceName = deviceNameToUpdate || deviceName;
		const targetIp = ipToUpdate || ipAddress;

		const existingIndex = history.findIndex((item) => item.mac === targetMac);
		const newItem: HistoryItem = {
			mac: targetMac,
			deviceName: targetDeviceName,
			ipAddress: targetIp,
		};

		const newHistory =
			existingIndex > -1
				? history.map((item, idx) => (idx === existingIndex ? newItem : item))
				: [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);

		setHistory(newHistory);
	};

	const handleRemoveHistoryItem = (index: number) => {
		const newHistory = history.filter((_, i) => i !== index);
		setHistory(newHistory);
	};

	return (
		<div class="App">
			<div class="container">
				<header class="appHeader">
					<h1>Wake on LAN</h1>
				</header>

				<div class="mainSection">
					<div class="formCard">
						<div class="formSections">
							<div class="formSection">
								<div class="inputGroup">
									<div class="inputWrapper">
										<label for="macAddress">
											MAC Address <span class="required">*</span>
										</label>
										<input
											id="macAddress"
											type="text"
											placeholder="例: AA:BB:CC:DD:EE:FF"
											value={mac}
											onInput={(e) =>
												setMac((e.target as HTMLInputElement).value)
											}
											class="macInput"
											disabled={loading}
										/>
										{!validateMac(mac) && mac.length > 0 && (
											<p class="inputError">無効なMACアドレス形式です</p>
										)}
									</div>
								</div>
							</div>

							<div class="formSection">
								<div class="inputGroup">
									<div class="inputWrapper">
										<label for="deviceName">デバイス名</label>
										<input
											id="deviceName"
											type="text"
											placeholder="例: オフィスPC"
											value={deviceName}
											onInput={(e) =>
												setDeviceName((e.target as HTMLInputElement).value)
											}
											class="deviceNameInput"
											disabled={loading}
										/>
									</div>

									<div class="inputWrapper">
										<label for="ipAddress">IPアドレス/ホスト名</label>
										<input
											id="ipAddress"
											type="text"
											placeholder="例: 192.168.1.100"
											value={ipAddress}
											onInput={(e) =>
												setIpAddress((e.target as HTMLInputElement).value)
											}
											class="ipInput"
											disabled={loading}
										/>
									</div>
								</div>
							</div>
						</div>

						<div class="buttonGroup">
							<button
								type="button"
								onClick={() => handleWake()}
								disabled={loading || !mac}
								class="wakeButton"
							>
								{loading ? (
									<span class="buttonContent">
										<span class="buttonSpinner" />
										送信中...
									</span>
								) : (
									"起動する"
								)}
							</button>
							<button
								type="button"
								onClick={() => {
									setMac("");
									setDeviceName("");
									setIpAddress("");
									setStatus(null);
								}}
								class="clearButton"
								disabled={loading}
							>
								クリア
							</button>
						</div>
					</div>

					{status && (
						<div class={`statusCard ${status.isError ? "error" : "success"}`}>
							<div class="statusHeader">
								<span class="statusIcon">{status.isError ? "❌" : "✅"}</span>
								<span class="statusTitle">
									{status.isError ? "エラー" : "成功"}
								</span>
							</div>
							<div class="statusMessages">
								{status.message.split("\n").map((msg, i) => (
									<div
										key={`status-line-${i}-${msg.slice(0, 10)}`}
										class="statusLine"
									>
										{msg}
									</div>
								))}
							</div>
						</div>
					)}

					{history.length > 0 && (
						<div class="historyCard">
							<div class="historyHeader">
								<h2 class="sectionTitle">使用したデバイス</h2>
								<div class="historyHeaderActions">
									<span class="historyCount">{history.length} デバイス</span>
								</div>
							</div>
							<div class="historyGrid">
								{history.map((item, index) => (
									<div key={`history-${item.mac}`} class="historyItemContainer">
										<div class="historyItem">
											<div class="itemHeader">
												<span class="deviceName">
													{item.deviceName || "Unknown Device"}
												</span>
												{item.ipAddress && (
													<span
														class={`statusBadge ${deviceStatus[item.ipAddress] ? "online" : "offline"}`}
													>
														{deviceStatus[item.ipAddress]
															? "🟢 オンライン"
															: "⚫ オフライン"}
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
													onClick={() =>
														handleWake(
															item.mac,
															item.deviceName,
															item.ipAddress,
														)
													}
													class="actionButton wakeAction"
												>
													起動
												</button>
												<button
													type="button"
													onClick={() => handleRemoveHistoryItem(index)}
													class="actionButton removeAction"
												>
													削除
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
