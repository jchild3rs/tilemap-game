import { Context, Effect, Layer } from "effect";
import {
	AStarFinder,
	BiAStarFinder,
	BiBreadthFirstFinder,
	BreadthFirstFinder,
	type DiagonalMovement,
} from "pathfinding";
import { Config } from "../app/config.ts";
// import type { DiagonalMovement } from "../pathfinding/diagonal-movement.ts";
// import { AStarFinder } from "../pathfinding/finders/a-star-finder.ts";
// import { BiAStarFinder } from "../pathfinding/finders/bi-a-star-finder.ts";
// import { BiBreadthFirstFinder } from "../pathfinding/finders/bi-breadth-first-finder.ts";
// import { BreadthFirstFinder } from "../pathfinding/finders/breadth-first-finder.ts";

export class PathfinderFactory extends Context.Tag("PathfinderFactory")<
	PathfinderFactory,
	{
		createFinder: (
			type?: "aStar" | "biAStar" | "breadthFirst" | "biBreadthFirst",
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

//
// function reconstructPath(cameFrom: Map<number, number>, current: number) {
// 	const totalPath: number[] = [current];
// 	let currentPath = current;
// 	while (cameFrom.has(currentPath)) {
// 		currentPath = cameFrom.get(currentPath)!;
// 		totalPath.unshift(currentPath);
// 	}
// 	return totalPath;
// }
//
// function d(current: number, neighbor: number) {
// 	return current - neighbor;
// }
//
// // A* fi
// function A_Star(start: number, goal: number, h: (n: number) => number) {
//
// 	// The set of discovered nodes that may need to be (re-)expanded.
// 	// Initially, only the start node is known.
// 	// This is usually implemented as a min-heap or priority queue rather than a hash-set.
// 	const openSet: Set<number> = new Set([start],);
//
// 	// For node n, cameFrom[n] is the node immediately preceding it on the cheapest path from the start to n currently known.
// 	const cameFrom: Map<number, number> = new Map();
//
// 	// For node n, gScore[n] is the currently known cost of the cheapest path from start to n.
// 	const gScore: Map<number, number> = new Map();
//
// 	// For node n, fScore[n] := gScore[n] + h(n). fScore[n] represents our current best guess as to
// 	// how cheap a path could be from start to finish if it goes through n.
// 	const fScore: Map<number, number> = new Map();
//
//
// 	// For node n, gScore[n] is the currently known cost of the cheapest path from start to n.
// 	gScore.set(start, 0);
//
// 	// For node n, fScore[n] := gScore[n] + h(n). fScore[n] represents our current best guess as to
// 	// how cheap a path could be from start to finish if it goes through n.
// 	fScore.set(start, h(start));
//
// 	while (openSet.size > 0) {
// 		// This operation can occur in O(Log(N)) time if openSet is a min-heap or a priority queue
//
// 		// current := the node in openSet having the lowest fScore[] value
// 		const current = Array.from(openSet)[0];
//
// 		if (current === goal) {
// 			return reconstructPath(cameFrom, current);
// 		}
//
// 		openSet.delete(current)
//
// 		for (let i = 0; i < current; i++){
// 			const neighbor = i;
// 			/**
// 			 *
// 			 *             // d(current,neighbor) is the weight of the edge from current to neighbor
// 			 *             // tentative_gScore is the distance from start to the neighbor through current
// 			 *             tentative_gScore := gScore[current] + d(current, neighbor)
// 			 *             if tentative_gScore < gScore[neighbor]
// 			 *                 // This path to neighbor is better than any previous one. Record it!
// 			 *                 cameFrom[neighbor] := current
// 			 *                 gScore[neighbor] := tentative_gScore
// 			 *                 fScore[neighbor] := tentative_gScore + h(neighbor)
// 			 *                 if neighbor not in openSet
// 			 *                     openSet.add(neighbor)
// 			 */
//
// 			const weight = d(current, i);
// 			const tentative_gScore = gScore.get(current)! + weight;
// 			if (tentative_gScore < gScore.get(i)!) {}
//
// 		}
//
// 		// for each neighbor of current
// 		// // d(current,neighbor) is the weight of the edge from current to neighbor
// 		// // tentative_gScore is the distance
//
// 	}
//
// 	// Open set is empty but goal was never reached
// 	throw new Error('Open set is empty but goal was never reached')
// }
// 	/**
// 	 * function reconstruct_path(cameFrom, current)
// 	 *     total_path := {current}
// 	 *     while current in cameFrom.Keys:
// 	 *         current := cameFrom[current]
// 	 *         total_path.prepend(current)
// 	 *     return total_path
// 	 *
// 	 * // A* finds a path from start to goal.
// 	 * // h is the heuristic function. h(n) estimates the cost to reach goal from node n.
// 	 * function A_Star(start, goal, h)
// 	 *     // The set of discovered nodes that may need to be (re-)expanded.
// 	 *     // Initially, only the start node is known.
// 	 *     // This is usually implemented as a min-heap or priority queue rather than a hash-set.
// 	 *     openSet := {start}
// 	 *
// 	 *     // For node n, cameFrom[n] is the node immediately preceding it on the cheapest path from the start
// 	 *     // to n currently known.
// 	 *     cameFrom := an empty map
// 	 *
// 	 *     // For node n, gScore[n] is the currently known cost of the cheapest path from start to n.
// 	 *     gScore := map with default value of Infinity
// 	 *     gScore[start] := 0
// 	 *
// 	 *     // For node n, fScore[n] := gScore[n] + h(n). fScore[n] represents our current best guess as to
// 	 *     // how cheap a path could be from start to finish if it goes through n.
// 	 *     fScore := map with default value of Infinity
// 	 *     fScore[start] := h(start)
// 	 *
// 	 *     while openSet is not empty
// 	 *         // This operation can occur in O(Log(N)) time if openSet is a min-heap or a priority queue
// 	 *         current := the node in openSet having the lowest fScore[] value
// 	 *         if current = goal
// 	 *             return reconstruct_path(cameFrom, current)
// 	 *
// 	 *         openSet.Remove(current)
// 	 *         for each neighbor of current
// 	 *             // d(current,neighbor) is the weight of the edge from current to neighbor
// 	 *             // tentative_gScore is the distance from start to the neighbor through current
// 	 *             tentative_gScore := gScore[current] + d(current, neighbor)
// 	 *             if tentative_gScore < gScore[neighbor]
// 	 *                 // This path to neighbor is better than any previous one. Record it!
// 	 *                 cameFrom[neighbor] := current
// 	 *                 gScore[neighbor] := tentative_gScore
// 	 *                 fScore[neighbor] := tentative_gScore + h(neighbor)
// 	 *                 if neighbor not in openSet
// 	 *                     openSet.add(neighbor)
// 	 *
// 	 *     // Open set is empty but goal was never reached
// 	 *     return failure
// 	 */
