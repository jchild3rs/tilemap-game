import type { Grid } from "../pathfinding/grid.ts";
import type { Component } from "../types.ts";

export class MapComponent implements Component {
	readonly type = "Map";

	constructor(
		public width: number,
		public height: number,
		public grid: Grid,
	) {}
}
