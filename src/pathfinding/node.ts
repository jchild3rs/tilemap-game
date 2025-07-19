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
	 * Cost to walk this node if it's walkable
	 */
	cost: number;

	// Additional properties used by pathfinding algorithms
	f?: number;
	g?: number;
	h?: number;
	opened?: boolean;
	closed?: boolean;
	parent?: Node;
	by?: number;
	retainCount = 0;
	tested?: boolean;

	/**
	 * Creates a new instance of Node
	 * @param x - The x coordinate of the node on the grid.
	 * @param y - The y coordinate of the node on the grid.
	 * @param walkable - Whether this node is walkable.
	 * @param cost - node cost used by finders that allow non-uniform node costs
	 */
	constructor(
		x: number,
		y: number,
		walkable: boolean = true,
		cost: number = 0,
	) {
		this.x = x;
		this.y = y;
		this.walkable = walkable;
		this.cost = cost;
	}
}
