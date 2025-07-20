import { Application } from "pixi.js";
import { GameEngine } from "./game-engine.ts";

async function main() {
	const app = new Application();

	await app.init({
		antialias: true,
		autoStart: true,
		canvas: document.getElementById("game") as HTMLCanvasElement,
		resolution: window.devicePixelRatio,
		height: window.innerHeight,
		width: window.innerWidth,
		resizeTo: window,
	});

	// @ts-ignore
	globalThis.__PIXI_APP__ = app;
	const gameEngine = new GameEngine(app);

	gameEngine.createPawn(12, 12);

	console.log(gameEngine);
}

void main();
