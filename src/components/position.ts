import type { Component } from "../types.ts";

export class PositionComponent implements Component {
	readonly type = "Position";

	constructor(
		public x: number,
		public y: number,
	) {}
}
