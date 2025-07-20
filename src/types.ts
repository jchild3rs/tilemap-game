export interface PositionLiteral {
	x: number;
	y: number;
}

export type PositionTuple = [number, number];

export type Path = PositionTuple[];

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

export interface Component {
	readonly type: string;
}

export interface System {
	update(deltaTime: number): void;
}
