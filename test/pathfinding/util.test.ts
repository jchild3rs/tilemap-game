import { describe, expect, it } from "vitest";
import { Util } from "../../src/pathfinding/util";

describe("Utility functions", () => {
	describe("interpolate", () => {
		it("should return the interpolated path", () => {
			expect(Util.interpolate(0, 1, 0, 4)).toEqual([
				[0, 1],
				[0, 2],
				[0, 3],
				[0, 4],
			]);
		});
	});

	describe("expandPath", () => {
		it("should return an empty array given an empty array", () => {
			expect(Util.expandPath([])).toEqual([]);
		});

		it("should return the expanded path", () => {
			expect(
				Util.expandPath([
					[0, 1],
					[0, 4],
				]),
			).toEqual([
				[0, 1],
				[0, 2],
				[0, 3],
				[0, 4],
			]);

			expect(
				Util.expandPath([
					[0, 1],
					[0, 4],
					[2, 6],
				]),
			).toEqual([
				[0, 1],
				[0, 2],
				[0, 3],
				[0, 4],
				[1, 5],
				[2, 6],
			]);
		});
	});

	describe("compressPath", () => {
		it("should return the original path if it is too short to compress", () => {
			expect(Util.compressPath([])).toEqual([]);
		});

		it("should return a compressed path", () => {
			expect(
				Util.compressPath([
					[0, 1],
					[0, 2],
					[0, 3],
					[0, 4],
				]),
			).toEqual([
				[0, 1],
				[0, 4],
			]);

			expect(
				Util.compressPath([
					[0, 1],
					[0, 2],
					[0, 3],
					[0, 4],
					[1, 5],
					[2, 6],
				]),
			).toEqual([
				[0, 1],
				[0, 4],
				[2, 6],
			]);
		});
	});
});
