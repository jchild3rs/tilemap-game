import {
	BiAStarFinder,
	type BiAStarFinderOptions,
} from "./bi-a-star-finder.ts";

/**
 * Bi-directional Best-First-Search path-finder.
 * @extends BiAStarFinder
 */
export class BiBestFirstFinder extends BiAStarFinder {
	/**
	 * Creates a new instance of BiBestFirstFinder
	 * @param opt - The options for the finder
	 */
	constructor(opt: BiAStarFinderOptions = {}) {
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
