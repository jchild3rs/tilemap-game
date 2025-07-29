import { Context, Effect, Layer } from "effect";
import * as PIXI from "pixi.js";
import { Renderer } from "./renderer.ts";
import { Stage } from "./stage.ts";

export class Ticker extends Context.Tag("Ticker")<Ticker, PIXI.Ticker>() {}

const makeTicker = Effect.gen(function* () {
	const renderer = yield* Renderer;
	const stage = yield* Stage;

	const ticker = new PIXI.Ticker();
	ticker.add(() => {
		renderer.render(stage);
	});

	ticker.start();

	yield* Effect.log("created ticker", ticker);

	return ticker;
});

export const TickerLive = Layer.effect(Ticker, makeTicker);
