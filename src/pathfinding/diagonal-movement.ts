export enum DiagonalMovement {
	/**
	 * Always allow diagonal movement
	 */
	Always = 1,

	/**
	 * Never allow diagonal movement
	 */
	Never = 2,

	/**
	 * Allow diagonal movement if at most one obstacle is present
	 */
	IfAtMostOneObstacle = 3,

	/**
	 * Allow diagonal movement only when no obstacles are present
	 */
	OnlyWhenNoObstacles = 4,
}
