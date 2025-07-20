import { DiagonalMovement } from "./pathfinding/diagonal-movement.ts";
import { DistanceHeuristic } from "./pathfinding/distance-heuristic.ts";

export class GameConfig {
	private static instance: GameConfig;

	// Singleton pattern
	static getInstance(): GameConfig {
		if (!GameConfig.instance) {
			GameConfig.instance = new GameConfig();
		}
		return GameConfig.instance;
	}

	// Game constants
	readonly CELL_SIZE = 32;
	readonly WORLD_SIZE = 24; // eg, * CELL_SIZE

	readonly worldSize = {
		width: this.WORLD_SIZE * this.CELL_SIZE,
		height: this.WORLD_SIZE * this.CELL_SIZE,
	};

	// Pathfinding configuration
	readonly pathfinding = {
		defaultAlgorithm: "aStar", // 'aStar', 'biAStar', 'breadthFirst', 'biBreadthFirst'
		defaultHeuristic: DistanceHeuristic.manhattan,
		defaultDiagonalMovement: DiagonalMovement.IfAtMostOneObstacle,
		defaultWeight: 1,
	};

	// Ground configuration
	readonly ground = {
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

	// Rendering configuration
	readonly rendering = {
		showDebug: true,
		showPaths: true,
		dayNightCycle: {
			dayDurationMs: 300000, // 5 minutes
			dayStartColor: 0xffffee,
			nightColor: 0x6699cc,
		},
	};

	// Pawn configuration
	readonly pawn = {
		baseMovementSpeed: 1.0,
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

	readonly zoom = {
		min: 0.25,
		max: 4,
		default: 1,
	};
}
