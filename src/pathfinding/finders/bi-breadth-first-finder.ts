import { DiagonalMovement } from "../diagonal-movement.ts";
import type { Grid } from "../grid.ts";
import type { Node } from "../node.ts";
import { Util } from "../util.ts";

/**
 * Options for the Bi-directional Breadth-First finder
 */
export interface BiBreadthFirstFinderOptions {
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
 * Bi-directional Breadth-First-Search path-finder.
 */
export class BiBreadthFirstFinder {
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
	 * Creates a new instance of BiBreadthFirstFinder
	 * @param opt - The options for the finder
	 */
	constructor(opt: BiBreadthFirstFinderOptions = {}) {
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
		// Constants for marking nodes
		const BY_START = 1;
		const BY_END = 2;

		const startNode = grid.getNodeAt(startX, startY);
		const endNode = grid.getNodeAt(endX, endY);
		const startOpenList: Node[] = [];
		const endOpenList: Node[] = [];
		const diagonalMovement = this.diagonalMovement;

		// push the start and end nodes into the queues
		startOpenList.push(startNode);
		startNode.opened = true;
		startNode.by = BY_START;

		endOpenList.push(endNode);
		endNode.opened = true;
		endNode.by = BY_END;

		// while both the queues are not empty
		while (startOpenList.length > 0 && endOpenList.length > 0) {
			// expand start open list
			let node = startOpenList.shift()!;
			node.closed = true;

			// get neighbors of the current node
			let neighbors = grid.getNeighbors(node, diagonalMovement);
			for (let i = 0, l = neighbors.length; i < l; ++i) {
				const neighbor = neighbors[i];

				if (neighbor.closed) {
					continue;
				}

				if (neighbor.opened) {
					// if this node has been inspected by the reversed search,
					// then a path is found.
					if (neighbor.by === BY_END) {
						return Util.biBacktrace(node, neighbor);
					}
					continue;
				}

				startOpenList.push(neighbor);
				neighbor.parent = node;
				neighbor.opened = true;
				neighbor.by = BY_START;
			}

			// expand end open list
			node = endOpenList.shift()!;
			node.closed = true;

			// get neighbors of the current node
			neighbors = grid.getNeighbors(node, diagonalMovement);
			for (let i = 0, l = neighbors.length; i < l; ++i) {
				const neighbor = neighbors[i];

				if (neighbor.closed) {
					continue;
				}

				if (neighbor.opened) {
					if (neighbor.by === BY_START) {
						return Util.biBacktrace(neighbor, node);
					}
					continue;
				}

				endOpenList.push(neighbor);
				neighbor.parent = node;
				neighbor.opened = true;
				neighbor.by = BY_END;
			}
		}

		// fail to find the path
		return [];
	}
}
