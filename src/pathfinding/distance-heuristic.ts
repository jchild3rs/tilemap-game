/**
 * A collection of heuristic functions.
 */
export class DistanceHeuristic {
	/**
	 * Manhattan distance.
	 * @param dx - Difference in x.
	 * @param dy - Difference in y.
	 * @returns dx + dy
	 */
	static manhattan(dx: number, dy: number): number {
		return dx + dy;
	}

	/**
	 * Euclidean distance.
	 * @param dx - Difference in x.
	 * @param dy - Difference in y.
	 * @returns sqrt(dx * dx + dy * dy)
	 */
	static euclidean(dx: number, dy: number): number {
		return Math.sqrt(dx * dx + dy * dy);
	}

	/**
	 * Octile distance.
	 * @param dx - Difference in x.
	 * @param dy - Difference in y.
	 * @returns sqrt(dx * dx + dy * dy) for grids
	 */
	static octile(dx: number, dy: number): number {
		const F = Math.SQRT2 - 1;
		return dx < dy ? F * dx + dy : F * dy + dx;
	}

	/**
	 * Chebyshev distance.
	 * @param dx - Difference in x.
	 * @param dy - Difference in y.
	 * @returns max(dx, dy)
	 */
	static chebyshev(dx: number, dy: number): number {
		return Math.max(dx, dy);
	}
}
