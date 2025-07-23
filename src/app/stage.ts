import { Context, Effect, Layer } from "effect";
import * as PIXI from "pixi.js";

export class Stage extends Context.Tag("Stage")<Stage, PIXI.Container>() {}

const makeStage = Effect.sync(() => {
	const stage = new PIXI.Container();

	// @ts-ignore
	globalThis.__PIXI_STAGE__ = stage;

	return stage;
});

export const StageLive = Layer.effect(Stage, makeStage);
