import type { Component } from "../types.ts";

export class TileComponent implements Component {
	readonly type = "Tile";

	constructor(
		public groundType: string,
		public walkable: boolean = true,
		public cost: number = 1,
	) {}
}
