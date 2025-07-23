import { Context, Effect, Layer } from "effect";
import { Viewport as PIXIViewport } from "pixi-viewport";
import { Config } from "./config.ts";
import { Renderer } from "./renderer.ts";
import { Stage } from "./stage.ts";
import { Ticker } from "./ticker.ts";

export const makeViewport = Effect.gen(function* () {
	const renderer = yield* Renderer;
	const ticker = yield* Ticker;
	const stage = yield* Stage;
	const config = yield* Config;

	const viewport = stage.addChild(
		new PIXIViewport({
			screenWidth: window.innerWidth,
			screenHeight: window.innerHeight,
			worldWidth: config.worldSize.width,
			worldHeight: config.worldSize.height,
			events: renderer.events,
			ticker: ticker,
		}),
	);

	// viewport.addChild(
	// 	new PIXI.Graphics()
	// 		.rect(0, 0, config.worldSize.width, config.worldSize.height)
	// 		.fill('#111111'),
	// );

	viewport
		// .drag()
		.pinch()
		.wheel()
		.zoom(0, true)
		.clampZoom({
			minScale: config.zoom.min,
			maxScale: config.zoom.max,
		})
		.decelerate()
		.fitWorld()
		.moveCenter(config.worldSize.width / 2, config.worldSize.height / 2);

	return viewport;
});

export class Viewport extends Context.Tag("Viewport")<
	Viewport,
	PIXIViewport
>() {}

export const ViewportLive = Layer.effect(Viewport, makeViewport);
