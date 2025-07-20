import type { Component } from "../types.ts";

export class HealthComponent implements Component {
	readonly type = "Health";

	constructor(
		public currentHealth: number,
		public maxHealth: number,
	) {}
}
