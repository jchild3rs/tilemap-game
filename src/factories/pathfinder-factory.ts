import type { DiagonalMovement } from "../pathfinding/diagonal-movement.ts";
import { AStarFinder } from "../pathfinding/finders/a-star-finder.ts";
import { BiAStarFinder } from "../pathfinding/finders/bi-a-star-finder.ts";
import { BiBreadthFirstFinder } from "../pathfinding/finders/bi-breadth-first-finder.ts";
import { BreadthFirstFinder } from "../pathfinding/finders/breadth-first-finder.ts";
import { GameConfig } from "../config.ts";

interface PathfinderOptions {
	/**
	 * Whether diagonal movement is allowed. Deprecated, use diagonalMovement instead.
	 */
	allowDiagonal: boolean;

	/**
	 * Disallow diagonal movement touching block corners. Deprecated, use diagonalMovement instead.
	 */
	dontCrossCorners: boolean;

	/**
	 * Heuristic function to estimate the distance
	 */
	heuristic: (dx: number, dy: number) => number;

	/**
	 * Weight to apply to the heuristic to allow for suboptimal paths
	 */
	weight: number;

	/**
	 * Allowed diagonal movement
	 */
	diagonalMovement: DiagonalMovement;
}

export class PathfinderFactory {
	private static instance: PathfinderFactory;
	private config = GameConfig.getInstance();

	static getInstance(): PathfinderFactory {
		if (!PathfinderFactory.instance) {
			PathfinderFactory.instance = new PathfinderFactory();
		}
		return PathfinderFactory.instance;
	}

	createFinder(type?: string, options: Partial<PathfinderOptions> = {}) {
		const finderType = type || this.config.pathfinding.defaultAlgorithm;

		const finderOptions: Partial<PathfinderOptions> = {
			diagonalMovement:
				options.diagonalMovement ||
				this.config.pathfinding.defaultDiagonalMovement,
			weight: options.weight || this.config.pathfinding.defaultWeight,
			heuristic: options.heuristic || this.config.pathfinding.defaultHeuristic,
		};

		switch (finderType) {
			case "aStar":
				return new AStarFinder(finderOptions);
			case "biAStar":
				return new BiAStarFinder(finderOptions);
			case "breadthFirst":
				return new BreadthFirstFinder(finderOptions);
			case "biBreadthFirst":
				return new BiBreadthFirstFinder(finderOptions);
			default:
				return new AStarFinder(finderOptions);
		}
	}
}
