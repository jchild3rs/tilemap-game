import { Context, Effect, Layer } from "effect";
import * as PIXI from "pixi.js";

export class Stage extends Context.Tag("Stage")<Stage, PIXI.Container>() {}

const makeStage = Effect.gen(function* () {
	const stage = new PIXI.Container({
		width: window.innerWidth,
		height: window.innerHeight,
		position: { x: 0, y: 0 },
		label: "Stage",
	});

	// @ts-ignore
	globalThis.__PIXI_STAGE__ = stage;

	yield* Effect.log("created stage", stage);

	return stage;
});

export const StageLive = Layer.effect(Stage, makeStage);
