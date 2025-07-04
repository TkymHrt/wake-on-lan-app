import type { HistoryItem } from "../types/wol";

const HISTORY_KEY = "wolHistory";
export const MAX_HISTORY_ITEMS = 5;

export const loadHistoryFromStorage = (): HistoryItem[] => {
	try {
		const saved = localStorage.getItem(HISTORY_KEY);
		return saved ? JSON.parse(saved) : [];
	} catch (error) {
		console.error("Failed to load history from localStorage:", error);
		return [];
	}
};

export const saveHistoryToStorage = (history: HistoryItem[]): void => {
	try {
		localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
	} catch (error) {
		console.error("Failed to save history to localStorage:", error);
	}
};

export const addToHistory = (
	currentHistory: HistoryItem[],
	newItem: HistoryItem,
): HistoryItem[] => {
	const existingIndex = currentHistory.findIndex(
		(item) => item.mac === newItem.mac,
	);

	if (existingIndex > -1) {
		return currentHistory.map((item, idx) =>
			idx === existingIndex ? newItem : item,
		);
	} else {
		return [newItem, ...currentHistory].slice(0, MAX_HISTORY_ITEMS);
	}
};

export const removeFromHistory = (
	currentHistory: HistoryItem[],
	index: number,
): HistoryItem[] => {
	return currentHistory.filter((_, i) => i !== index);
};
