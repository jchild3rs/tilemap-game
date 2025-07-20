import { effect, type Signal } from "@preact/signals-core";
import { Container, Graphics } from "pixi.js";
import { CELL_SIZE } from "./config.ts";

export class HealthBar {
	public healthBarGraphic = new Container({
		label: "healthBar",
		// visible: false,
	});
	constructor(
		private readonly health: Signal<number>,
		private readonly container: Container,
	) {
		const healthBar = new Graphics({
			label: "healthBar",
			// visible: false,
		})
			.rect(0, CELL_SIZE + 4, CELL_SIZE, 2)
			.fill("red");
		this.healthBarGraphic.addChild(healthBar);
		this.healthBarGraphic.width = (CELL_SIZE * this.health.value) / 100;

		this.container.addChild(this.healthBarGraphic);

		effect(() => {
			this.healthBarGraphic.width = Math.max(
				0,
				(CELL_SIZE * this.health.value) / 100,
			);
		});
	}
}
