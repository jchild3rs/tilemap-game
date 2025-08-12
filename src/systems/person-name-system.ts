import { Effect } from "effect";
import * as PIXI from "pixi.js";
import { Config } from "../app/config.ts";
import { EntityManager } from "../app/entity-manager.ts";

import type { System } from "../types.ts";

export const PersonNameSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;
	const config = yield* Config;

	const update = (_ticker: PIXI.Ticker) =>
		Effect.gen(function* () {
			const entities = yield* entityManager.getAllEntitiesWithComponents([
				"Person",
				"Position",
				"Graphics",
				"Health",
			]);

			for (const entity of entities) {
				const person = entity.getComponent("Person");
				const graphics = entity.getComponent("Graphics");

				let graphic = graphics.graphic.getChildByLabel("name") as
					| PIXI.Text
					| undefined;
				if (!graphic) {
					graphic = new PIXI.Text({
						text: person.firstName,
						style: {
							fill: "#ffffff",
							fontSize: config.CELL_SIZE / 6,
						},
						label: "name",
						anchor: 0.5,
					});
					graphic.position.set(config.CELL_SIZE / 2, config.CELL_SIZE);
					graphics.graphic.addChild(graphic);
				}
			}
		});

	return { update } as const satisfies System;
});
