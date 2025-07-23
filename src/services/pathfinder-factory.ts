import { Context, Effect, Layer } from "effect";
import {
	AStarFinder,
	BiAStarFinder,
	BiBreadthFirstFinder,
	BreadthFirstFinder,
	type DiagonalMovement,
} from "pathfinding";
import { Config } from "../app/config.ts";

export class PathfinderFactory extends Context.Tag("PathfinderFactory")<
	PathfinderFactory,
	{
		createFinder: (
			type?: string,
			options?: Partial<PathfinderOptions>,
		) => Effect.Effect<
			AStarFinder | BiAStarFinder | BiBreadthFirstFinder | BreadthFirstFinder
		>;
	}
>() {}

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

export const makePathfinderFactory = () =>
	Effect.gen(function* () {
		const config = yield* Config;

		const createFinder = (
			type?: string,
			options: Partial<PathfinderOptions> = {},
		) =>
			Effect.sync(() => {
				const finderType = type || config.pathfinding.defaultAlgorithm;

				const finderOptions: Partial<PathfinderOptions> = {
					diagonalMovement:
						options.diagonalMovement ||
						config.pathfinding.defaultDiagonalMovement,
					weight: options.weight || config.pathfinding.defaultWeight,
					heuristic: options.heuristic || config.pathfinding.defaultHeuristic,
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
			});

		return { createFinder } as const;
	});

export const PathfinderFactoryLive = Layer.effect(
	PathfinderFactory,
	makePathfinderFactory(),
);
