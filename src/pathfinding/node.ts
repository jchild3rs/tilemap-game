/**
 * A node in grid.
 * This class holds some basic information about a node and custom
 * attributes may be added, depending on the algorithms' needs.
 */
export class Node {
	/**
	 * The x coordinate of the node on the grid.
	 */
	x: number;

	/**
	 * The y coordinate of the node on the grid.
	 */
	y: number;

	/**
	 * Whether this node can be walked through.
	 */
	walkable: boolean;

	/**
	 * weight multiplier of this node.
	 */
	weight: number;

	// Additional properties used by pathfinding algorithms
	f?: number;
	g?: number;
	h?: number;
	opened?: boolean;
	closed?: boolean;
	parent?: Node;

	constructor(
		x: number,
		y: number,
		walkable: boolean = true,
		weight: number = 1,
	) {
		this.x = x;
		this.y = y;
		this.walkable = walkable;
		this.weight = weight;
	}
}
