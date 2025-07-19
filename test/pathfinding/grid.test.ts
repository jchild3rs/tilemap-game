/** biome-ignore-all lint/suspicious/noExplicitAny: test */
import { beforeEach, describe, expect, it } from "vitest";
import { DiagonalMovement } from "../../src/pathfinding/diagonal-movement";
import { Grid } from "../../src/pathfinding/grid";

describe("Grid", () => {
	describe("generate without matrix", () => {
		let width: number, height: number, grid: Grid;

		beforeEach(() => {
			width = 10;
			height = 20;
			grid = new Grid(width, height);
		});

		it("should have correct size", () => {
			expect(grid.width).toEqual(width);
			expect(grid.height).toEqual(height);

			expect(grid.nodes.length).toEqual(height);
			for (let i = 0; i < height; ++i) {
				expect(grid.nodes[i].length).toEqual(width);
			}
		});

		it("should set all nodes' walkable attribute", () => {
			for (let i = 0; i < height; ++i) {
				for (let j = 0; j < width; ++j) {
					expect(grid.isWalkableAt(j, i)).toBe(true);
				}
			}
		});
	});

	describe("generate with matrix", () => {
		let matrix: number[][], grid: Grid, width: number, height: number;

		const enumPos = (f: (x: number, y: number, g: Grid) => void, o?: any) => {
			for (let y = 0; y < height; ++y) {
				for (let x = 0; x < width; ++x) {
					if (o) {
						f.call(o, x, y, grid);
					} else {
						f(x, y, grid);
					}
				}
			}
		};

		beforeEach(() => {
			matrix = [
				[1, 0, 0, 1],
				[0, 1, 0, 0],
				[0, 1, 0, 0],
				[0, 0, 0, 0],
				[1, 0, 0, 1],
			];
			height = matrix.length;
			width = matrix[0].length;
			grid = new Grid(width, height, matrix);
		});

		it("should have correct size", () => {
			expect(grid.width).toEqual(width);
			expect(grid.height).toEqual(height);

			expect(grid.nodes.length).toEqual(height);
			for (let i = 0; i < height; ++i) {
				expect(grid.nodes[i].length).toEqual(width);
			}
		});

		it("should initiate all nodes' walkable attribute", () => {
			enumPos((x, y, g) => {
				if (matrix[y][x]) {
					expect(g.isWalkableAt(x, y)).toBe(false);
				} else {
					expect(g.isWalkableAt(x, y)).toBe(true);
				}
			});
		});

		it("should be able to set nodes' walkable attribute", () => {
			enumPos((x, y) => {
				grid.setWalkableAt(x, y, false);
			});
			enumPos((x, y) => {
				expect(grid.isWalkableAt(x, y)).toBe(false);
			});
			enumPos((x, y) => {
				grid.setWalkableAt(x, y, true);
			});
			enumPos((x, y) => {
				expect(grid.isWalkableAt(x, y)).toBe(true);
			});
		});

		it("should return correct answer for position validity query", () => {
			const asserts: [number, number, boolean][] = [
				[0, 0, true],
				[0, height - 1, true],
				[width - 1, 0, true],
				[width - 1, height - 1, true],
				[-1, -1, false],
				[0, -1, false],
				[-1, 0, false],
				[0, height, false],
				[width, 0, false],
				[width, height, false],
			];

			asserts.forEach((v) => {
				expect(grid.isInside(v[0], v[1])).toEqual(v[2]);
			});
		});

		it("should return correct neighbors", () => {
			expect(
				grid.getNeighbors(grid.nodes[1][0], DiagonalMovement.Never),
			).toEqual([grid.nodes[2][0]]);

			const cmp = (a: any, b: any) => {
				return a.x * 100 + a.y - b.x * 100 - b.y;
			};

			expect(
				grid
					.getNeighbors(grid.nodes[0][2], DiagonalMovement.IfAtMostOneObstacle)
					.sort(cmp),
			).toEqual(
				[grid.nodes[0][1], grid.nodes[1][2], grid.nodes[1][3]].sort(cmp),
			);
		});
	});

	describe("generate with matrix and no width or height", () => {
		let matrix: number[][], grid: Grid;

		beforeEach(() => {
			matrix = [
				[1, 0, 0, 1],
				[0, 1, 0, 0],
				[0, 1, 0, 0],
				[0, 0, 0, 0],
				[1, 0, 0, 1],
			];

			grid = new Grid(matrix);
		});

		it("should have correct size", () => {
			const height = matrix.length;
			const width = matrix[0].length;

			expect(grid.width).toEqual(width);
			expect(grid.height).toEqual(height);

			expect(grid.nodes.length).toEqual(height);
			for (let i = 0; i < height; ++i) {
				expect(grid.nodes[i].length).toEqual(width);
			}
		});
	});
});
