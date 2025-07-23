import { Context, Effect, Layer } from "effect";
import * as PIXI from "pixi.js";

export class Renderer extends Context.Tag("Renderer")<
	Renderer,
	PIXI.Renderer
>() {}

const makeRenderer = Effect.gen(function* () {
	const canvas = document.getElementById("game") as HTMLCanvasElement;

	const renderer = yield* Effect.promise(() =>
		PIXI.autoDetectRenderer({
			antialias: true,
			backgroundColor: 0x000000,
			canvas,
			resolution: window.devicePixelRatio,
			height: window.innerHeight,
			width: window.innerWidth,
			autoDensity: true,
		}),
	);

	// @ts-ignore
	globalThis.__PIXI_RENDERER__ = renderer;

	window.addEventListener("resize", () => {
		renderer.resize(window.innerWidth, window.innerHeight);
	});

	return renderer;
});

export const RendererLive = Layer.effect(Renderer, makeRenderer);
