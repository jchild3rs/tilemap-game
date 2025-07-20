import type { Component } from "../types.ts";

export class GridPositionComponent implements Component {
	readonly type = "GridPosition";

	constructor(
		public x: number,
		public y: number,
	) {}
}
