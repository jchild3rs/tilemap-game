import type { Component } from "../types.ts";

export class SelectableComponent implements Component {
	readonly type = "Selectable";

	constructor(
		public isSelected: boolean = false,
		public isDrafted: boolean = false,
	) {}
}
