import type { Effect } from "effect";
import type * as PIXI from "pixi.js";

export enum MovementDirection {
	Up = "up",
	Down = "down",
	Left = "left",
	Right = "right",
	UpLeft = "up-left",
	UpRight = "up-right",
	DownLeft = "down-left",
	DownRight = "down-right",
}

export interface PositionLiteral {
	x: number;
	y: number;
}

export interface System {
	readonly update: (ticker: PIXI.Ticker) => Effect.Effect<void>;
}
