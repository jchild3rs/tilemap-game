import { Context, Effect, Layer } from "effect";
import { DiagonalMovement, Heuristic } from "pathfinding";

export class Config extends Context.Tag("Config")<
	Config,
	{
		CELL_SIZE: number;
		WORLD_SIZE: number;
		worldSize: {
			width: number;
			height: number;
		};
		pathfinding: {
			defaultAlgorithm: string;
			defaultHeuristic(dx: number, dy: number): number;
			defaultDiagonalMovement: DiagonalMovement;
			defaultWeight: number;
		};
		person: {
			baseMovementSpeed: number;
			maxHealth: number;
			skinColors: string[];
		};
		zoom: {
			min: number;
			max: number;
			default: number;
		};
	}
>() {}

export const ConfigLive = Layer.effect(
	Config,
	Effect.gen(function* () {
		yield* Effect.log("created config");

		const CELL_SIZE = 32;
		const WORLD_SIZE = 24; // eg, * CELL_SIZE

		const worldSize = {
			width: WORLD_SIZE * CELL_SIZE,
			height: WORLD_SIZE * CELL_SIZE,
		};

		const pathfinding: {
			defaultAlgorithm: "aStar" | "biAStar" | "breadthFirst" | "biBreadthFirst";
			defaultHeuristic(dx: number, dy: number): number;
			defaultDiagonalMovement: DiagonalMovement;
			defaultWeight: number;
		} = {
			defaultAlgorithm: "aStar",
			defaultHeuristic: Heuristic.manhattan,
			defaultDiagonalMovement: DiagonalMovement.OnlyWhenNoObstacles,
			defaultWeight: 1,
		};

		const ground = {
			colorMap: {
				dirt: 0x9d9368,
				grass: 0x2e7d32,
				rock: 0x424242,
				sand: 0xffd180,
				snow: 0xffffff,
				stone: 0x616161,
				water: 0x1976d2,
			} as Record<string, number>,
			walkSpeedMap: {
				grass: 1.0,
				dirt: 0.9,
				sand: 0.7,
				water: 0.3,
				stone: 1.2,
			} as Record<string, number>,
		};

		const rendering = {
			showDebug: true,
			showPaths: true,
			dayNightCycle: {
				dayDurationMs: 300000, // 5 minutes
				dayStartColor: 0xffffee,
				nightColor: 0x6699cc,
			},
		};

		const person = {
			baseMovementSpeed: 0.1,
			maxHealth: 100,
			skinColors: [
				"#e1ceba",
				"#d4b49c",
				"#c69c7d",
				"#b7845e",
				"#a86c3f",
				"#8b5e34",
				"#6e4c29",
				"#51391e",
			],
		};

		const zoom = {
			min: 0.5,
			max: 2,
			default: 1,
		};

		return {
			CELL_SIZE,
			WORLD_SIZE,
			worldSize,
			pathfinding,
			ground,
			rendering,
			person,
			zoom,
		} as const;
	}),
);
