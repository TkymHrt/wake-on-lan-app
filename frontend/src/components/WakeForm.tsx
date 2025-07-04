import { useState } from "preact/hooks";
import { validateMacAddress } from "../services/wolService";
import type { WakeFormData } from "../types/wol";

interface WakeFormProps {
	onSubmit: (formData: WakeFormData) => void;
	loading: boolean;
}

export const WakeForm = ({ onSubmit, loading }: WakeFormProps) => {
	const [formData, setFormData] = useState<WakeFormData>({
		mac: "",
		deviceName: "",
		ipAddress: "",
	});

	const handleSubmit = () => {
		onSubmit(formData);
	};

	const handleClear = () => {
		setFormData({
			mac: "",
			deviceName: "",
			ipAddress: "",
		});
	};

	const updateField = (field: keyof WakeFormData, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const isMacValid = validateMacAddress(formData.mac);
	const canSubmit = !loading && formData.mac && isMacValid;

	return (
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
								value={formData.mac}
								onInput={(e) =>
									updateField("mac", (e.target as HTMLInputElement).value)
								}
								class="macInput"
								disabled={loading}
							/>
							{!isMacValid && formData.mac.length > 0 && (
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
								value={formData.deviceName}
								onInput={(e) =>
									updateField(
										"deviceName",
										(e.target as HTMLInputElement).value,
									)
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
								value={formData.ipAddress}
								onInput={(e) =>
									updateField("ipAddress", (e.target as HTMLInputElement).value)
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
					onClick={handleSubmit}
					disabled={!canSubmit}
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
					onClick={handleClear}
					class="clearButton"
					disabled={loading}
				>
					クリア
				</button>
			</div>
		</div>
	);
};
