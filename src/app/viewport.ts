import { Context, Effect, Layer } from "effect";
import { type IViewportOptions, Viewport as PIXIViewport } from "pixi-viewport";
import { Config } from "./config.ts";
import { Renderer } from "./renderer.ts";
import { Stage } from "./stage.ts";
import { Ticker } from "./ticker.ts";

export const makeViewport = Effect.gen(function* () {
	const renderer = yield* Renderer;
	const ticker = yield* Ticker;
	const stage = yield* Stage;
	const config = yield* Config;

	const options: IViewportOptions = {
		screenWidth: window.innerWidth,
		screenHeight: window.innerHeight,
		worldWidth: config.worldSize.width,
		worldHeight: config.worldSize.height,
		passiveWheel: false,
		allowPreserveDragOutside: true,
		events: renderer.events,
		ticker: ticker,
	};
	yield* Effect.logDebug("creating viewport with options", options);
	const viewport = stage.addChild(new PIXIViewport(options));

	// const culler = new Culler()
	// viewport.cullable = true
	// viewport.cullArea = viewport.boundsArea

	viewport
		.pinch()
		.wheel()
		.zoom(0, true)
		.clampZoom({ minScale: config.zoom.min, maxScale: config.zoom.max })
		.decelerate()
		.fitWorld()
		.moveCenter(config.worldSize.width / 2, config.worldSize.height / 2);

	yield* Effect.log("created viewport", viewport);

	// ticker.add(() => {
	// 	culler.cull(viewport, stage)
	// })

	return viewport;
});

export class Viewport extends Context.Tag("Viewport")<
	Viewport,
	PIXIViewport
>() {}

export const ViewportLive = Layer.effect(Viewport, makeViewport);
