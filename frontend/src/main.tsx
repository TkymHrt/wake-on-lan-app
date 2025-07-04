import { render } from "preact";
import "./index.css";
import { App } from "./app.tsx";

const appElement = document.getElementById("app");
if (appElement) {
	render(<App />, appElement);
}
