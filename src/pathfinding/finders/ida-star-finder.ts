import { DiagonalMovement } from "../diagonal-movement.ts";
import { DistanceHeuristic } from "../distance-heuristic.ts";
import type { Grid } from "../grid.ts";
import type { Node } from "../node.ts";

/**
 * Options for the IDA* finder
 */
export interface IDAStarFinderOptions {
	/**
	 * Whether diagonal movement is allowed. Deprecated, use diagonalMovement instead.
	 */
	allowDiagonal?: boolean;

	/**
	 * Disallow diagonal movement touching block corners. Deprecated, use diagonalMovement instead.
	 */
	dontCrossCorners?: boolean;

	/**
	 * Allowed diagonal movement.
	 */
	diagonalMovement?: DiagonalMovement;

	/**
	 * Heuristic function to estimate the distance (defaults to manhattan).
	 */
	heuristic?: (dx: number, dy: number) => number;

	/**
	 * Weight to apply to the heuristic to allow for suboptimal paths,
	 * in order to speed up the search.
	 */
	weight?: number;

	/**
	 * Whether to track recursion for statistical purposes.
	 */
	trackRecursion?: boolean;

	/**
	 * Maximum execution time in seconds. Use <= 0 for infinite.
	 */
	timeLimit?: number;
}

/**
 * Iterative Deeping A Star (IDA*) path-finder.
 *
 * Recursion based on:
 *   http://www.apl.jhu.edu/~hall/AI-Programming/IDA-Star.html
 *
 * Path retracing based on:
 *  V. Nageshwara Rao, Vipin Kumar and K. Ramesh
 *  "A Parallel Implementation of Iterative-Deeping-A*", January 1987.
 *  ftp://ftp.cs.utexas.edu/.snapshot/hourly.1/pub/AI-Lab/tech-reports/UT-AI-TR-87-46.pdf
 */
export class IDAStarFinder {
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

	/**
	 * Whether to track recursion for statistical purposes
	 */
	trackRecursion: boolean;

	/**
	 * Maximum execution time in seconds. Use <= 0 for infinite.
	 */
	timeLimit: number;

	/**
	 * Creates a new instance of IDAStarFinder
	 * @param opt - The options for the finder
	 */
	constructor(opt: IDAStarFinderOptions = {}) {
		this.allowDiagonal = opt.allowDiagonal ?? false;
		this.dontCrossCorners = opt.dontCrossCorners ?? false;
		this.heuristic = opt.heuristic || DistanceHeuristic.manhattan;
		this.weight = opt.weight || 1;
		this.diagonalMovement = opt.diagonalMovement ?? DiagonalMovement.Never;
		this.trackRecursion = opt.trackRecursion ?? false;
		this.timeLimit = opt.timeLimit ?? Infinity; // Default: no time limit.

		if (!this.diagonalMovement) {
			if (!this.allowDiagonal) {
				this.diagonalMovement = DiagonalMovement.Never;
			} else {
				if (this.dontCrossCorners) {
					this.diagonalMovement = DiagonalMovement.OnlyWhenNoObstacles;
				} else {
					this.diagonalMovement = DiagonalMovement.IfAtMostOneObstacle;
				}
			}
		}

		// When diagonal movement is allowed the manhattan heuristic is not admissible
		// It should be octile instead
		if (this.diagonalMovement === DiagonalMovement.Never) {
			this.heuristic = opt.heuristic || DistanceHeuristic.manhattan;
		} else {
			this.heuristic = opt.heuristic || DistanceHeuristic.octile;
		}
	}

	/**
	 * Find and return the path.
	 * @param startX - The x coordinate of the start position
	 * @param startY - The y coordinate of the start position
	 * @param endX - The x coordinate of the end position
	 * @param endY - The y coordinate of the end position
	 * @param grid - The grid to search in
	 * @returns The path, including both start and end positions.
	 */
	findPath(
		startX: number,
		startY: number,
		endX: number,
		endY: number,
		grid: Grid,
	): number[][] {
		// Used for statistics:
		let _nodesVisited = 0;

		// Execution time limitation:
		const startTime = Date.now();

		// Heuristic helper:
		const h = (a: Node, b: Node): number => {
			return this.heuristic(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
		};

		// Step cost from a to b:
		const cost = (a: Node, b: Node): number => {
			return a.x === b.x || a.y === b.y ? 1 : Math.SQRT2;
		};

		/**
		 * IDA* search implementation.
		 *
		 * @param node - The node currently expanding from.
		 * @param g - Cost to reach the given node.
		 * @param cutoff - Maximum search depth (cut-off value).
		 * @param route - The found route.
		 * @param depth - Recursion depth.
		 *
		 * @returns either a number with the new optimal cut-off depth,
		 * or a valid node instance, in which case a path was found.
		 */
		const search = (
			node: Node,
			g: number,
			cutoff: number,
			route: number[][],
			depth: number,
		): number | Node => {
			_nodesVisited++;

			// Enforce timelimit:
			if (
				this.timeLimit > 0 &&
				Date.now() - startTime > this.timeLimit * 1000
			) {
				// Enforced as "path-not-found".
				return Infinity;
			}

			const f = g + h(node, end) * this.weight;

			// We've searched too deep for this iteration.
			if (f > cutoff) {
				return f;
			}

			if (node === end) {
				route[depth] = [node.x, node.y];
				return node;
			}

			let min = Infinity;
			const neighbors = grid.getNeighbors(node, this.diagonalMovement);

			// Sort the neighbors, gives nicer paths. But, this deviates
			// from the original algorithm - so I left it out.
			// neighbors.sort((a, b) => {
			//     return h(a, end) - h(b, end);
			// });

			for (let i = 0; i < neighbors.length; i++) {
				const neighbor = neighbors[i];

				if (this.trackRecursion) {
					// Retain a copy for visualisation. Due to recursion, this
					// node may be part of other paths too.
					neighbor.retainCount = (neighbor.retainCount || 0) + 1;

					if (neighbor.tested !== true) {
						neighbor.tested = true;
					}
				}

				const t = search(
					neighbor,
					g + cost(node, neighbor),
					cutoff,
					route,
					depth + 1,
				);

				if (typeof t !== "number") {
					route[depth] = [node.x, node.y];
					// For a typical A* linked list, this would work:
					// neighbor.parent = node;
					return t;
				}

				// Decrement count, then determine whether it's actually closed.
				if (this.trackRecursion && --neighbor.retainCount === 0) {
					neighbor.tested = false;
				}

				if (t < min) {
					min = t;
				}
			}

			return min;
		};

		// Node instance lookups:
		const start = grid.getNodeAt(startX, startY);
		const end = grid.getNodeAt(endX, endY);

		// Initial search depth, given the typical heuristic contraints,
		// there should be no cheaper route possible.
		let cutOff = h(start, end);
		let route: number[][];

		// With an overflow protection.
		// biome-ignore lint/correctness/noConstantCondition: ported this way
		for (let _j = 0; true; ++_j) {
			route = [];

			// Search till cut-off depth:
			const t = search(start, 0, cutOff, route, 0);

			// Route not possible, or not found in time limit.
			if (t === Infinity) {
				return [];
			}

			// If t is a node, it's also the end node. Route is now
			// populated with a valid path to the end node.
			if (typeof t !== "number") {
				return route;
			}

			// Try again, this time with a deeper cut-off. The t score
			// is the closest we got to the end node.
			cutOff = t;
		}

		// This _should_ never to be reached.
		// return [];
	}
}
