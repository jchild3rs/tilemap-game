import { Context, Effect, Layer } from "effect";
import { Config } from "../app/config.ts";
import type { PositionLiteral } from "../types.ts";
import { clamp } from "../utils.ts";

export class PositionConversion extends Context.Tag("PositionConversion")<
	PositionConversion,
	{
		gridToWorld: (position: PositionLiteral) => Effect.Effect<PositionLiteral>;
		worldToGrid: (position: PositionLiteral) => PositionLiteral;
	}
>() {}

export const makePositionConversionService = () =>
	Effect.gen(function* () {
		const config = yield* Config;

		const worldToGrid = (position: PositionLiteral) => ({
			x: clamp(
				0,
				config.worldSize.width,
				Math.floor(position.x / config.CELL_SIZE),
			),
			y: clamp(
				0,
				config.worldSize.height - 1,
				Math.floor(position.y / config.CELL_SIZE),
			),
		});

		const gridToWorld = (position: PositionLiteral) =>
			Effect.sync(() => ({
				x: position.x * config.CELL_SIZE,
				y: position.y * config.CELL_SIZE,
			}));

		return {
			gridToWorld,
			worldToGrid,
		} as const;
	});

export const PositionConversionLive = Layer.effect(
	PositionConversion,
	makePositionConversionService(),
);
