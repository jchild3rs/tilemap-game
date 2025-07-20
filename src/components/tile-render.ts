import type { Graphics } from "pixi.js";
import type { Component } from "../types.ts";

export class TileRenderComponent implements Component {
	readonly type = "TileRender";

	constructor(public graphic: Graphics) {}
}
