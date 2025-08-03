import { Context, Effect, Layer } from "effect";
import { type IViewportOptions, Viewport as PIXIViewport } from "pixi-viewport";
import { Config } from "./config.ts";
import { Renderer } from "./renderer.ts";
import { Stage } from "./stage.ts";
import { Ticker } from "./ticker.ts";
import { Tilemap } from "./tilemap.ts";

export const makeViewport = Effect.gen(function* () {
	const renderer = yield* Renderer;
	const ticker = yield* Ticker;
	const stage = yield* Stage;
	const tilemap = yield* Tilemap;
	const config = yield* Config;

	const options: IViewportOptions = {
		screenWidth: window.innerWidth,
		screenHeight: window.innerHeight,
		worldWidth: config.CELL_SIZE * tilemap.grid.width,
		worldHeight: config.CELL_SIZE * tilemap.grid.height,
		passiveWheel: false,
		allowPreserveDragOutside: true,
		events: renderer.events,
		ticker: ticker,
	};
	yield* Effect.logDebug("creating viewport with options", options);
	const viewport = stage.addChild(new PIXIViewport(options));

	viewport
		.pinch()
		.wheel()
		.zoom(0, true)
		.clampZoom({ minScale: config.zoom.min, maxScale: config.zoom.max })
		.decelerate()
		.fitWorld()
		.moveCenter(config.worldSize.width / 2, config.worldSize.height / 2);

	yield* Effect.log("created viewport", viewport);

	return viewport;
});

export class Viewport extends Context.Tag("Viewport")<
	Viewport,
	PIXIViewport
>() {}

export const ViewportLive = Layer.effect(Viewport, makeViewport);
