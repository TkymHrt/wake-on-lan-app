import { useEffect, useState } from "preact/hooks";
import type { HistoryItem } from "../types/wol";
import {
	addToHistory,
	loadHistoryFromStorage,
	removeFromHistory,
	saveHistoryToStorage,
} from "../utils/historyUtils";

export const useHistory = () => {
	const [history, setHistory] = useState<HistoryItem[]>([]);

	useEffect(() => {
		const savedHistory = loadHistoryFromStorage();
		setHistory(savedHistory);
	}, []);

	useEffect(() => {
		saveHistoryToStorage(history);
	}, [history]);

	const addHistoryItem = (item: HistoryItem) => {
		setHistory((currentHistory) => addToHistory(currentHistory, item));
	};

	const removeHistoryItem = (index: number) => {
		setHistory((currentHistory) => removeFromHistory(currentHistory, index));
	};

	return {
		history,
		addHistoryItem,
		removeHistoryItem,
	};
};
