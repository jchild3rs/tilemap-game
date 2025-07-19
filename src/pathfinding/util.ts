import type { Grid } from "./grid.ts";
import type { Node } from "./node.ts";

/**
 * Utility functions for pathfinding
 */

export class Util {
	/**
	 * Backtrace according to the parent records and return the path.
	 * (including both start and end nodes)
	 * @param node - End node
	 * @returns The path as an array of [x, y] coordinates
	 */
	static backtrace(node: Node): number[][] {
		const path: number[][] = [[node.x, node.y]];
		let current = node;
		while (current.parent) {
			current = current.parent;
			path.push([current.x, current.y]);
		}
		return path.reverse();
	}

	/**
	 * Backtrace from start and end node, and return the path.
	 * (including both start and end nodes)
	 * @param nodeA - One end node
	 * @param nodeB - The other end node
	 * @returns The path as an array of [x, y] coordinates
	 */
	static biBacktrace(nodeA: Node, nodeB: Node): number[][] {
		const pathA = Util.backtrace(nodeA);
		const pathB = Util.backtrace(nodeB);
		return pathA.concat(pathB.reverse());
	}

	/**
	 * Compute the length of the path.
	 * @param path - The path as an array of [x, y] coordinates
	 * @returns The length of the path
	 */
	static pathLength(path: number[][]): number {
		let sum = 0;
		for (let i = 1; i < path.length; ++i) {
			const a = path[i - 1];
			const b = path[i];
			const dx = a[0] - b[0];
			const dy = a[1] - b[1];
			sum += Math.sqrt(dx * dx + dy * dy);
		}
		return sum;
	}

	/**
	 * Given the start and end coordinates, return all the coordinates lying
	 * on the line formed by these coordinates, based on Bresenham's algorithm.
	 * http://en.wikipedia.org/wiki/Bresenham's_line_algorithm#Simplification
	 * @param x0 - Start x coordinate
	 * @param y0 - Start y coordinate
	 * @param x1 - End x coordinate
	 * @param y1 - End y coordinate
	 * @returns The coordinates on the line as an array of [x, y] coordinates
	 */
	static interpolate(
		x0: number,
		y0: number,
		x1: number,
		y1: number,
	): number[][] {
		const abs = Math.abs;
		const line: number[][] = [];
		let sx: number, sy: number, dx: number, dy: number, err: number, e2: number;

		dx = abs(x1 - x0);
		dy = abs(y1 - y0);

		sx = x0 < x1 ? 1 : -1;
		sy = y0 < y1 ? 1 : -1;

		err = dx - dy;

		while (true) {
			line.push([x0, y0]);

			if (x0 === x1 && y0 === y1) {
				break;
			}

			e2 = 2 * err;
			if (e2 > -dy) {
				err = err - dy;
				x0 = x0 + sx;
			}
			if (e2 < dx) {
				err = err + dx;
				y0 = y0 + sy;
			}
		}

		return line;
	}

	/**
	 * Given a compressed path, return a new path that has all the segments
	 * in it interpolated.
	 * @param path - The path as an array of [x, y] coordinates
	 * @returns The expanded path as an array of [x, y] coordinates
	 */
	static expandPath(path: number[][]): number[][] {
		const expanded: number[][] = [];
		const len = path.length;

		if (len < 2) {
			return expanded;
		}

		for (let i = 0; i < len - 1; ++i) {
			const coord0 = path[i];
			const coord1 = path[i + 1];

			const interpolated = Util.interpolate(
				coord0[0],
				coord0[1],
				coord1[0],
				coord1[1],
			);
			const interpolatedLen = interpolated.length;
			for (let j = 0; j < interpolatedLen - 1; ++j) {
				expanded.push(interpolated[j]);
			}
		}
		expanded.push(path[len - 1]);

		return expanded;
	}

	/**
	 * Smoothen the give path.
	 * The original path will not be modified; a new path will be returned.
	 * @param grid - The grid
	 * @param path - The path as an array of [x, y] coordinates
	 * @returns The smoothened path as an array of [x, y] coordinates
	 */
	static smoothenPath(grid: Grid, path: number[][]): number[][] {
		const len = path.length;
		const x0 = path[0][0]; // path start x
		const y0 = path[0][1]; // path start y
		const x1 = path[len - 1][0]; // path end x
		const y1 = path[len - 1][1]; // path end y

		let sx = x0;
		let sy = y0;
		const newPath: number[][] = [[sx, sy]];

		for (let i = 2; i < len; ++i) {
			const coord = path[i];
			const ex = coord[0];
			const ey = coord[1];
			const line = Util.interpolate(sx, sy, ex, ey);

			let blocked = false;
			for (let j = 1; j < line.length; ++j) {
				const testCoord = line[j];

				if (!grid.isWalkableAt(testCoord[0], testCoord[1])) {
					blocked = true;
					break;
				}
			}
			if (blocked) {
				const lastValidCoord = path[i - 1];
				newPath.push(lastValidCoord);
				sx = lastValidCoord[0];
				sy = lastValidCoord[1];
			}
		}
		newPath.push([x1, y1]);

		return newPath;
	}

	/**
	 * Compress a path, remove redundant nodes without altering the shape
	 * The original path is not modified
	 * @param path - The path as an array of [x, y] coordinates
	 * @returns The compressed path as an array of [x, y] coordinates
	 */
	static compressPath(path: number[][]): number[][] {
		// nothing to compress
		if (path.length < 3) {
			return path;
		}

		const compressed: number[][] = [];
		const sx = path[0][0]; // start x
		const sy = path[0][1]; // start y
		let px = path[1][0]; // second point x
		let py = path[1][1]; // second point y
		let dx = px - sx; // direction between the two points
		let dy = py - sy; // direction between the two points
		let lx: number, ly: number;
		let ldx: number, ldy: number;
		let sq: number;

		// normalize the direction
		sq = Math.sqrt(dx * dx + dy * dy);
		dx /= sq;
		dy /= sq;

		// start the new path
		compressed.push([sx, sy]);

		for (let i = 2; i < path.length; i++) {
			// store the last point
			lx = px;
			ly = py;

			// store the last direction
			ldx = dx;
			ldy = dy;

			// next point
			px = path[i][0];
			py = path[i][1];

			// next direction
			dx = px - lx;
			dy = py - ly;

			// normalize
			sq = Math.sqrt(dx * dx + dy * dy);
			dx /= sq;
			dy /= sq;

			// if the direction has changed, store the point
			if (dx !== ldx || dy !== ldy) {
				compressed.push([lx, ly]);
			}
		}

		// store the last point
		compressed.push([px, py]);

		return compressed;
	}
}
