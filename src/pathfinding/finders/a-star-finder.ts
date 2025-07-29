import Heap from "heap";
import { DiagonalMovement } from "../diagonal-movement.ts";
import { DistanceHeuristic } from "../distance-heuristic.ts";
import type { Grid } from "../grid.ts";
import type { Node } from "../node.ts";
import { Util } from "../util.ts";

/**
 * Options for the A* finder
 */
export interface AStarFinderOptions {
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
}

/**
 * A* path-finder.
 * based upon https://github.com/bgrins/javascript-astar
 */
export class AStarFinder {
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
	 * Creates a new instance of AStarFinder
	 * @param opt - The options for the finder
	 */
	constructor(opt: AStarFinderOptions = {}) {
		this.allowDiagonal = opt.allowDiagonal ?? false;
		this.dontCrossCorners = opt.dontCrossCorners ?? false;
		this.heuristic = opt.heuristic || DistanceHeuristic.manhattan;
		this.weight = opt.weight || 1;
		this.diagonalMovement = opt.diagonalMovement ?? DiagonalMovement.Never;

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
	 * Find and return the the path.
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
		const openList = new Heap<Node>((nodeA, nodeB) => {
			return (nodeA.f ?? 0) - (nodeB.f ?? 0);
		});

		const startNode = grid.getNodeAt(startX, startY);
		const endNode = grid.getNodeAt(endX, endY);
		const heuristic = this.heuristic;
		const diagonalMovement = this.diagonalMovement;
		const weight = this.weight;
		const abs = Math.abs,
			SQRT2 = Math.SQRT2;

		// set the `g` and `f` value of the start node to be 0
		startNode.g = 0;
		startNode.f = 0;

		// push the start node into the open list
		openList.push(startNode);
		// startNode.opened = true;

		// while the open list is not empty
		while (!openList.empty()) {
			// pop the position of node which has the minimum `f` value.
			const node = openList.pop()!;
			// node.closed = true;

			// if reached the end position, construct the path and return it
			if (node === endNode) {
				return Util.backtrace(endNode);
			}

			// get neighbors of the current node
			const neighbors = grid.getNeighbors(node, diagonalMovement);
			for (let i = 0, l = neighbors.length; i < l; ++i) {
				const neighbor = neighbors[i];

				if (neighbor.closed) {
					continue;
				}

				const x = neighbor.x;
				const y = neighbor.y;

				// get the distance between current node and the neighbor
				// and calculate the next g score
				let ng =
					(node.g ?? 0) + (x - node.x === 0 || y - node.y === 0 ? 1 : SQRT2);

				ng *= neighbor.weight;

				// check if the neighbor has not been inspected yet, or
				// can be reached with smaller cost from the current node
				if (!neighbor.opened || ng < (neighbor.g ?? 0)) {
					neighbor.g = ng;
					neighbor.h =
						neighbor.h ?? weight * heuristic(abs(x - endX), abs(y - endY));
					neighbor.f = neighbor.g + neighbor.h;
					neighbor.parent = node;

					if (!neighbor.opened) {
						openList.push(neighbor);
						// neighbor.opened = true;
					} else {
						// the neighbor can be reached with smaller cost.
						// Since its f value has been updated, we have to
						// update its position in the open list
						openList.updateItem(neighbor);
					}
				}
			} // end for each neighbor
		} // end while not open list empty

		// fail to find the path
		return [];
	}
}
