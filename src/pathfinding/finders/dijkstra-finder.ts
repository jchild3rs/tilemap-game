import { AStarFinder, type AStarFinderOptions } from "./a-star-finder.ts";

/**
 * Dijkstra path-finder.
 * @extends AStarFinder
 */
export class DijkstraFinder extends AStarFinder {
	/**
	 * Creates a new instance of DijkstraFinder
	 * @param opt - The options for the finder
	 */
	constructor(opt: AStarFinderOptions = {}) {
		super(opt);

		// Override the heuristic function to always return 0
		// This turns A* into Dijkstra's algorithm, which doesn't use a heuristic
		this.heuristic = (_dx: number, _dy: number): number => {
			return 0;
		};
	}
}
