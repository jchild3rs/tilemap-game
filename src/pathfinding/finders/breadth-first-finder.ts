import { DiagonalMovement } from "../diagonal-movement.ts";
import type { Grid } from "../grid.ts";
import type { Node } from "../node.ts";
import { Util } from "../util.ts";

/**
 * Options for the Breadth-First finder
 */
export interface BreadthFirstFinderOptions {
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
}

/**
 * Breadth-First-Search path-finder.
 */
export class BreadthFirstFinder {
	/**
	 * Whether diagonal movement is allowed. Deprecated, use diagonalMovement instead.
	 */
	allowDiagonal: boolean;

	/**
	 * Disallow diagonal movement touching block corners. Deprecated, use diagonalMovement instead.
	 */
	dontCrossCorners: boolean;

	/**
	 * Allowed diagonal movement
	 */
	diagonalMovement: DiagonalMovement;

	/**
	 * Creates a new instance of BreadthFirstFinder
	 * @param opt - The options for the finder
	 */
	constructor(opt: BreadthFirstFinderOptions = {}) {
		this.allowDiagonal = opt.allowDiagonal ?? false;
		this.dontCrossCorners = opt.dontCrossCorners ?? false;
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
		const openList: Node[] = [];
		const diagonalMovement = this.diagonalMovement;
		const startNode = grid.getNodeAt(startX, startY);
		const endNode = grid.getNodeAt(endX, endY);

		// push the start node into the queue
		openList.push(startNode);
		startNode.opened = true;

		// while the queue is not empty
		while (openList.length > 0) {
			// take the front node from the queue
			const node = openList.shift()!;
			node.closed = true;

			// reached the end position
			if (node === endNode) {
				return Util.backtrace(endNode);
			}

			// get neighbors of the current node
			const neighbors = grid.getNeighbors(node, diagonalMovement);
			for (let i = 0, l = neighbors.length; i < l; ++i) {
				const neighbor = neighbors[i];

				// skip this neighbor if it has been inspected before
				if (neighbor.closed || neighbor.opened) {
					continue;
				}

				openList.push(neighbor);
				neighbor.opened = true;
				neighbor.parent = node;
			}
		}

		// fail to find the path
		return [];
	}
}
