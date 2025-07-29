import { AStarFinder, type AStarFinderOptions } from "./a-star-finder.ts";

/**
 * Best-First-Search path-finder.
 * @extends AStarFinder
 */
export class BestFirstFinder extends AStarFinder {
	/**
	 * Creates a new instance of BestFirstFinder
	 * @param opt - The options for the finder
	 */
	constructor(opt: AStarFinderOptions = {}) {
		super(opt);

		// Store the original heuristic
		const orig = this.heuristic;

		// Override the heuristic function to multiply by a large number
		// This makes the algorithm prioritize nodes closer to the goal
		this.heuristic = (dx: number, dy: number): number => {
			return orig(dx, dy) * 1000000;
		};
	}
}
