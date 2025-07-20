import type { Container, Graphics, Sprite } from 'pixi.js';

import type { Component } from "../types.ts";

export class GraphicsComponent implements Component {
	readonly type = "Graphics";

	constructor(public graphic: Graphics | Container | Sprite) {}
}
