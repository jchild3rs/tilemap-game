/** biome-ignore-all lint/style/noNonNullAssertion: we use it here. */
import { DiagonalMovement } from "./diagonal-movement.ts";
import { Node } from "./node.ts";

/**
 * The Grid class, which serves as the encapsulation of the layout of the nodes.
 */
export class Grid {
	/**
	 * The number of columns of the grid.
	 */
	width: number;

	/**
	 * The number of rows of the grid.
	 */
	height: number;

	/**
	 * A 2D array of nodes.
	 */
	nodes: Node[][];

	/**
	 * Creates a new grid
	 * @param width_or_matrix - Number of columns of the grid, or matrix
	 * @param height - Number of rows of the grid.
	 * @param matrix - A 0-1 matrix representing the walkable status of the nodes(0 or false for walkable).
	 *     If the matrix is not supplied, all the nodes will be walkable.
	 */
	constructor(
		width_or_matrix: number | (number | boolean)[][],
		height?: number,
		matrix?: (number | boolean)[][],
	) {
		let width: number;

		if (typeof width_or_matrix !== "object") {
			width = width_or_matrix;
		} else {
			height = width_or_matrix.length;
			width = width_or_matrix[0].length;
			matrix = width_or_matrix;
		}

		this.width = width!;
		this.height = height!;

		this.nodes = this._buildNodes(width!, height!, matrix);
	}

	setWeightAt(x: number, y: number, weight: number) {
		if (this.isInside(x, y)) this.nodes[y][x].weight = weight;
	}

	getWeightAt(x: number, y: number): number {
		if (this.isInside(x, y)) return this.nodes[y][x].weight;
		return 1;
	}

	/**
	 * Build and return the nodes.
	 * @private
	 * @param width - Width of the grid
	 * @param height - Height of the grid
	 * @param matrix - A 0-1 matrix representing the walkable status of the nodes.
	 * @param costs - A matrix representing the costs to walk the nodes.
	 * @returns The nodes
	 */
	private _buildNodes(
		width: number,
		height: number,
		matrix?: (number | boolean)[][],
	): Node[][] {
		const nodes: Node[][] = new Array(height);

		for (let i = 0; i < height; ++i) {
			nodes[i] = new Array(width);
			for (let j = 0; j < width; ++j) {
				nodes[i][j] = new Node(j, i);
			}
		}

		if (matrix === undefined) {
			return nodes;
		}

		if (matrix.length !== height || matrix[0].length !== width) {
			throw new Error("Matrix size does not fit");
		}

		for (let i = 0; i < height; ++i) {
			for (let j = 0; j < width; ++j) {
				if (matrix[i][j]) {
					// 0, false, null will be walkable
					// while others will be un-walkable
					nodes[i][j].walkable = false;
				}
			}
		}

		return nodes;
	}

	/**
	 * Get the node at the given position
	 * @param x - The x coordinate of the node.
	 * @param y - The y coordinate of the node.
	 * @returns The node at [x, y]
	 */
	getNodeAt(x: number, y: number): Node {
		return this.nodes[y][x];
	}

	/**
	 * Determine whether the node at the given position is walkable.
	 * (Also returns false if the position is outside the grid.)
	 * @param x - The x coordinate of the node.
	 * @param y - The y coordinate of the node.
	 * @returns The walkability of the node.
	 */
	isWalkableAt(x: number, y: number): boolean {
		return this.isInside(x, y) && this.nodes[y][x].walkable;
	}

	/**
	 * Determine whether the position is inside the grid.
	 * @param x - The x coordinate
	 * @param y - The y coordinate
	 * @returns Whether the position is inside the grid
	 */
	isInside(x: number, y: number): boolean {
		return x >= 0 && x < this.width && y >= 0 && y < this.height;
	}

	/**
	 * Set whether the node on the given position is walkable.
	 * NOTE: throws exception if the coordinate is not inside the grid.
	 * @param x - The x coordinate of the node.
	 * @param y - The y coordinate of the node.
	 * @param walkable - Whether the position is walkable.
	 */
	setWalkableAt(x: number, y: number, walkable: boolean): void {
		this.nodes[y][x].walkable = walkable;
	}

	/**
	 * Get the neighbors of the given node.
	 *
	 *     offsets      diagonalOffsets:
	 *  +---+---+---+    +---+---+---+
	 *  |   | 0 |   |    | 0 |   | 1 |
	 *  +---+---+---+    +---+---+---+
	 *  | 3 |   | 1 |    |   |   |   |
	 *  +---+---+---+    +---+---+---+
	 *  |   | 2 |   |    | 3 |   | 2 |
	 *  +---+---+---+    +---+---+---+
	 *
	 *  When allowDiagonal is true, if offsets[i] is valid, then
	 *  diagonalOffsets[i] and
	 *  diagonalOffsets[(i + 1) % 4] is valid.
	 * @param node - The node to get neighbors for
	 * @param diagonalMovement - Diagonal movement mode
	 * @returns The neighbors of the node
	 */
	getNeighbors(node: Node, diagonalMovement: DiagonalMovement): Node[] {
		const x = node.x;
		const y = node.y;
		const neighbors: Node[] = [];
		let s0 = false,
			d0 = false;
		let s1 = false,
			d1 = false;
		let s2 = false,
			d2 = false;
		let s3 = false,
			d3 = false;
		const nodes = this.nodes;

		// ↑
		if (this.isWalkableAt(x, y - 1)) {
			neighbors.push(nodes[y - 1][x]);
			s0 = true;
		}
		// →
		if (this.isWalkableAt(x + 1, y)) {
			neighbors.push(nodes[y][x + 1]);
			s1 = true;
		}
		// ↓
		if (this.isWalkableAt(x, y + 1)) {
			neighbors.push(nodes[y + 1][x]);
			s2 = true;
		}
		// ←
		if (this.isWalkableAt(x - 1, y)) {
			neighbors.push(nodes[y][x - 1]);
			s3 = true;
		}

		if (diagonalMovement === DiagonalMovement.Never) {
			return neighbors;
		}

		if (diagonalMovement === DiagonalMovement.OnlyWhenNoObstacles) {
			d0 = s3 && s0;
			d1 = s0 && s1;
			d2 = s1 && s2;
			d3 = s2 && s3;
		} else if (diagonalMovement === DiagonalMovement.IfAtMostOneObstacle) {
			d0 = s3 || s0;
			d1 = s0 || s1;
			d2 = s1 || s2;
			d3 = s2 || s3;
		} else if (diagonalMovement === DiagonalMovement.Always) {
			d0 = true;
			d1 = true;
			d2 = true;
			d3 = true;
		} else {
			throw new Error("Incorrect value of diagonalMovement");
		}

		// ↖
		if (d0 && this.isWalkableAt(x - 1, y - 1)) {
			neighbors.push(nodes[y - 1][x - 1]);
		}
		// ↗
		if (d1 && this.isWalkableAt(x + 1, y - 1)) {
			neighbors.push(nodes[y - 1][x + 1]);
		}
		// ↘
		if (d2 && this.isWalkableAt(x + 1, y + 1)) {
			neighbors.push(nodes[y + 1][x + 1]);
		}
		// ↙
		if (d3 && this.isWalkableAt(x - 1, y + 1)) {
			neighbors.push(nodes[y + 1][x - 1]);
		}

		return neighbors;
	}

	/**
	 * Get a clone of this grid.
	 * @returns Cloned grid.
	 */
	clone(): Grid {
		const width = this.width;
		const height = this.height;
		const thisNodes = this.nodes;

		const newGrid = new Grid(width, height);
		const newNodes = new Array(height);

		for (let i = 0; i < height; ++i) {
			newNodes[i] = new Array(width);
			for (let j = 0; j < width; ++j) {
				newNodes[i][j] = new Node(
					j,
					i,
					thisNodes[i][j].walkable,
					thisNodes[i][j].weight,
				);
			}
		}

		newGrid.nodes = newNodes;

		return newGrid;
	}
}
