import { describe, expect, it } from "vitest";
import { AStarFinder } from "../../src/pathfinding/finders/a-star-finder";
import { BestFirstFinder } from "../../src/pathfinding/finders/best-first-finder";
import { BiBestFirstFinder } from "../../src/pathfinding/finders/bi-best-first-finder";
import { BiBreadthFirstFinder } from "../../src/pathfinding/finders/bi-breadth-first-finder";
import { BreadthFirstFinder } from "../../src/pathfinding/finders/breadth-first-finder";
import { DijkstraFinder } from "../../src/pathfinding/finders/dijkstra-finder";
import { IDAStarFinder } from "../../src/pathfinding/finders/ida-star-finder";
import { Grid } from "../../src/pathfinding/grid";
import scenarios from "./path-scenarios";

/**
 * Path-finding tests for the path-finders.
 */
interface PathTestOptions {
	name: string;
	// biome-ignore lint/suspicious/noExplicitAny: stub
	finder: any; // Using any for now as we don't have a common interface for all finders
	optimal: boolean;
	useCost: boolean;
}

function pathTest(opt: PathTestOptions) {
	const { name, finder, optimal, useCost } = opt;

	describe(name, () => {
		let path: number[][];

		const test = (() => {
			let testId = 0;

			return (
				startX: number,
				startY: number,
				endX: number,
				endY: number,
				grid: Grid,
				expectedLength: number,
				expectedCostLength?: number,
			) => {
				it(`should solve maze ${++testId}`, () => {
					path = finder.findPath(startX, startY, endX, endY, grid);
					if (optimal) {
						if (useCost && expectedCostLength !== undefined) {
							expect(path.length).toEqual(expectedCostLength);
						} else {
							expect(path.length).toEqual(expectedLength);
						}
					} else {
						expect(path[0]).toEqual([startX, startY]);
						expect(path[path.length - 1]).toEqual([endX, endY]);
					}
				});
			};
		})();

		// Load all the scenarios and test against the finder.
		for (let i = 0; i < scenarios.length; ++i) {
			const scen = scenarios[i];

			const matrix = scen.matrix;
			const costs = useCost ? scen.costs : undefined;
			const height = matrix.length;
			const width = matrix[0].length;
			const grid = new Grid(width, height, matrix, costs);

			test(
				scen.startX,
				scen.startY,
				scen.endX,
				scen.endY,
				grid,
				scen.expectedLength,
				scen.expectedCostLength,
			);
		}
	});
}

function pathTests(...tests: PathTestOptions[]) {
	for (let i = 0; i < tests.length; ++i) {
		pathTest(tests[i]);
	}
}

// finders guaranteed to find the shortest path
pathTests(
	{
		name: "AStar",
		finder: new AStarFinder(),
		optimal: true,
		useCost: false,
	},
	{
		name: "AStar Cost",
		finder: new AStarFinder(),
		optimal: true,
		useCost: true,
	},
	// {
	//   name: 'BiAStar',
	//   finder: new BiAStarFinder(),
	//   optimal: true,
	//   useCost: false
	// },
	// {
	//   name: 'BiAStar Cost',
	//   finder: new BiAStarFinder(),
	//   optimal: true,
	//   useCost: true
	// },
	{
		name: "BreadthFirst",
		finder: new BreadthFirstFinder(),
		optimal: true,
		useCost: false,
	},
	{
		name: "BiBreadthFirst",
		finder: new BiBreadthFirstFinder(),
		optimal: true,
		useCost: false,
	},
	{
		name: "Dijkstra",
		finder: new DijkstraFinder(),
		optimal: true,
		useCost: false,
	},
	{
		name: "Dijkstra Cost",
		finder: new DijkstraFinder(),
		optimal: true,
		useCost: true,
	},
	{
		name: "IDAStar",
		finder: new IDAStarFinder(),
		optimal: true,
		useCost: false,
	},
);

// finders NOT guaranteed to find the shortest path
pathTests(
	{
		name: "BestFirst",
		finder: new BestFirstFinder(),
		optimal: false,
		useCost: false,
	},
	{
		name: "BiBestFirst",
		finder: new BiBestFirstFinder(),
		optimal: false,
		useCost: false,
	},
	// {
	//   name: 'JPFMoveDiagonallyIfAtMostOneObstacle',
	//   finder: JumpPointFinder({
	//     diagonalMovement: DiagonalMovement.IfAtMostOneObstacle
	//   }),
	//   optimal: false,
	//   useCost: false
	// },
	// {
	//   name: 'JPFNeverMoveDiagonally',
	//   finder: JumpPointFinder({
	//     diagonalMovement: DiagonalMovement.Never
	//   }),
	//   optimal: false,
	//   useCost: false
	// }
);
