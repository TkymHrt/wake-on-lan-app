import "./app.css";
import { Bounce, ToastContainer } from "react-toastify";
import { DeviceHistory } from "./components/DeviceHistory";
import { WakeForm } from "./components/WakeForm";
import { useDeviceStatus } from "./hooks/useDeviceStatus";
import { useHistory } from "./hooks/useHistory";
import { useWakeOnLan } from "./hooks/useWakeOnLan";
import type { WakeFormData } from "./types/wol";

export function App() {
	const { history, addHistoryItem, removeHistoryItem } = useHistory();
	const deviceStatus = useDeviceStatus(history);

	const { loading, sendWake } = useWakeOnLan({
		onHistoryUpdate: addHistoryItem,
	});

	const handleFormSubmit = (formData: WakeFormData) => {
		sendWake(formData);
	};

	const handleWakeDevice = (item: (typeof history)[0]) => {
		sendWake({
			mac: item.mac,
			deviceName: item.deviceName,
			ipAddress: item.ipAddress,
		});
	};

	return (
		<div class="App">
			<div class="container">
				<header class="appHeader">
					<h1>Wake on LAN</h1>
				</header>

				<div class="mainSection">
					<WakeForm onSubmit={handleFormSubmit} loading={loading} />

					<DeviceHistory
						history={history}
						deviceStatus={deviceStatus}
						onWakeDevice={handleWakeDevice}
						onRemoveDevice={removeHistoryItem}
					/>
				</div>
			</div>
			<ToastContainer
				position="top-right"
				autoClose={3000}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick={false}
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme="colored"
				transition={Bounce}
			/>
		</div>
	);
}
