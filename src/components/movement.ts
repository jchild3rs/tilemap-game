import type { Component, Path } from '../types.ts';

export class MovementComponent implements Component {
	readonly type = "Movement";

	constructor(
		public speed: number,
		public path: Path = [],
	) {}
}
