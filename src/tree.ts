
import { Container, Sprite, type Texture } from "pixi.js";
import { CELL_SIZE } from "./config.ts";
import type { Tilemap } from "./tilemap.ts";

export class Tree {
	public readonly container = new Container({
		label: "Tree",
	});

	constructor(
		private readonly viewport: Container,
		private readonly tilemap: Tilemap,
		private readonly textureMap: Record<string, Texture>,
	) {
		const graphic = this.createTreeGraphic();
		const randomPosition = this.tilemap.randomGridPosition();
		console.log(randomPosition);
		console.log(
			randomPosition.x * CELL_SIZE + CELL_SIZE / 2,
			randomPosition.y * CELL_SIZE + CELL_SIZE,
		);
		graphic.position.set(
			randomPosition.x * CELL_SIZE + CELL_SIZE / 2,
			randomPosition.y * CELL_SIZE + CELL_SIZE,
		);

		graphic.interactive = true;
		graphic.on("rightclick", () => {
			// alert('hi')
		});

		// graphic.position.set(5 * CELL_SIZE + (CELL_SIZE / 2), 5 * CELL_SIZE)
		this.viewport.addChild(graphic);
	}

	createTreeGraphic() {
		const treeTexture = this.textureMap["tree.png"];
		console.log(treeTexture);
		const sprite = this.container.addChild(new Sprite(treeTexture));
		sprite.label = "Tree";
		// sprite.position.set(0, CELL_SIZE)
		sprite.anchor.set(0.5, 0.9);
		sprite.scale.set(0.75, 0.75);
		return sprite;
		// .rect(0, 0, 64, 96)
		// .texture(treeTexture))
	}
}
