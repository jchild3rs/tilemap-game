import { effect } from '@preact/signals-core';
import { Viewport } from 'pixi-viewport';
import {
	Application,
	ColorMatrixFilter,
	Container,
	Graphics,
	Ticker,
} from 'pixi.js';
import {
	MAX_ZOOM_SCALE,
	MIN_ZOOM_SCALE,
	WORLD_SIZE,
} from './config.ts';
import { Controls } from './controls.ts';
import { Pawn } from './pawn.ts';
import { GameState } from './state.ts';
import { Tilemap } from './tilemap.ts';
import { GameUI } from './ui.ts';
import { lerpColor } from './util.ts';

async function main() {
	const app = new Application();

	// @ts-expect-error - pixi dev tools
	window.__PIXI_APP__ = app;

	const canvas = document.getElementById("game") as HTMLCanvasElement;

	const gameTicker = new Ticker();
	gameTicker.start();

	await app.init({
		antialias: true,
		resolution: window.devicePixelRatio,
		autoStart: true,
		backgroundColor: 0x000000,
		canvas,
		height: window.innerHeight,
		width: window.innerWidth,
		resizeTo: window,
		autoDensity: true,
	});

	// const assetsToLoad = ["grass.jpg", "brick.png"];
	// await Assets.init({ basePath: "/assets" });
	// const textureMap = await Assets.load(assetsToLoad);

	const viewport = app.stage.addChild(
		new Viewport({
			screenWidth: window.innerWidth,
			screenHeight: window.innerHeight,
			worldWidth: WORLD_SIZE.width,
			worldHeight: WORLD_SIZE.height,
			passiveWheel: false,
			events: app.renderer.events,
			ticker: app.ticker,
			allowPreserveDragOutside: true,
		})
			.pinch()
			.wheel()
			.zoom(0, true)
			.clampZoom({ minScale: MIN_ZOOM_SCALE, maxScale: MAX_ZOOM_SCALE })
			.decelerate()
			.fitWorld()
			.moveCenter(WORLD_SIZE.width / 2, WORLD_SIZE.height / 2),
	);

	const tilemap = new Tilemap(viewport);
	const gameState = new GameState(tilemap);
	const gameUI = new GameUI(gameState);
	const controls = new Controls(
		viewport,
		tilemap,
		gameTicker,
		app.ticker,
		gameState,
	);

	const game = {
		state: gameState,
		ui: gameUI,
		tilemap,
		viewport,
		app,
		gameTicker,
		gameUI,
		controls,
	};

	console.log(game);

	effect(() => {
		if (gameState.isPaused.value) {
			gameTicker.stop(); // Stop game logic
			// uiTicker continues running for UI controls
		} else {
			gameTicker.start(); // Resume game logic
		}
	});

	// Enhanced day/night lighting system
	// =====================================

	// Create overlay for basic darkness
	const dayNightOverlay = new Graphics({
		zIndex: 99999,
		label: "LightOverlay",
		eventMode: "none",
		interactiveChildren: false,
	})
		.rect(0, 0, viewport.worldWidth, viewport.worldHeight)
		.fill({ color: 0x0a0a2e, alpha: 1 });

	// Create color matrix filter
	const dayNightFilter = new ColorMatrixFilter();

	// Apply both overlay and filter to viewport
	viewport.addChild(dayNightOverlay);
	// viewport.filters = [dayNightFilter];
	tilemap.container.filters = [dayNightFilter];

	// Reactive lighting effect with debug logging
	effect(() => {
		const lightLevel = gameState.lightLevel.value;
		const timeOfDay = gameState.timeOfDay.value;
		const isNight = gameState.isNight.value;

		// // Debug logging - remove after confirming it works
		console.debug("Lighting effect triggered:", {
			timeOfDay,
			lightLevel,
			isNight,
		});

		// Basic overlay darkness
		const overlayAlpha = Math.max(0, 0.5 * (1 - lightLevel));
		dayNightOverlay.alpha = overlayAlpha;

		console.debug("Setting overlay alpha to:", overlayAlpha);

		// Color matrix adjustments
		dayNightFilter.reset();

		// Adjust overall brightness
		const brightness = 0.4 + lightLevel * 0.6;
		dayNightFilter.brightness(brightness, false);

		// Color temperature based on time of day
		if (isNight) {
			const nightIntensity = 1 - lightLevel;
			const blueish = 0x6699cc;
			dayNightFilter.tint(blueish, false);

			const nightContrast = 1.0 + nightIntensity * 0.3;
			dayNightFilter.contrast(nightContrast, false);

			const nightSaturation = 0.6 + lightLevel * 0.3;
			dayNightFilter.saturate(nightSaturation, false);

			console.debug("Night effects applied:", {
				nightIntensity,
				nightContrast,
				nightSaturation,
			});
		} else {
			const distanceFromNoon = Math.abs(timeOfDay - 0.5) * 2;

			if (distanceFromNoon > 0.6) {
				const warmth = Math.min(distanceFromNoon, 1.0);
				const golden = lerpColor(0xffffff, 0xffaa66, warmth * 0.3);
				dayNightFilter.tint(golden, false);
				console.debug("Dawn/dusk effects applied:", {
					warmth,
					golden,
				});
			} else {
				dayNightFilter.tint(0xffffee, false);
				console.debug("Midday effects applied");
			}

			dayNightFilter.contrast(1.0, false);

			const daySaturation = 0.8 + lightLevel * 0.4;
			dayNightFilter.saturate(daySaturation, false);
		}
	});

	// test code below
	// -------------------------------

	// // add a bunch of random walls
	// const blockingTiles = viewport.addChild(new Container({ label: "Walls" }));
	//
	// for (let i = 0; i < (WORLD_WIDTH * WORLD_HEIGHT) / 9; i++) {
	// 	const randomWallPosition = tilemap.randomGridPosition("wall");
	// 	blockingTiles.addChild(
	// 		tilemap.makeBlockingTile(randomWallPosition.x, randomWallPosition.y),
	// 	);
	// }

	const pawnContainer = viewport.addChild(new Container({ label: "Pawns" }));
	for (let i = 0; i < 2; i++) {
		const pawn = new Pawn(tilemap, pawnContainer, gameTicker);
		gameState.addPawn(pawn);
	}
}

main().catch(console.error);
