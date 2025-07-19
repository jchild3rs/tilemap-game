import type { Graphics } from "pixi.js";
import type { Ground } from "./ground.ts";
import type { Node } from "./pathfinding/node.ts";

export class Tile {
	constructor(
		public readonly node: Node,
		public readonly graphic: Graphics,
		public readonly ground: Ground,
	) {
		// console.log(this.node, this.graphic, this.ground);
	}

	// todo: add some behavior otherwise should be a type
}
