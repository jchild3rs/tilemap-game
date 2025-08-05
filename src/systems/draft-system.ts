import { Effect } from "effect";
import * as PIXI from "pixi.js";
import { Config } from "../app/config.ts";
import { EntityManager } from "../app/entity-manager.ts";

import type { System } from "../types.ts";

export const DraftSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;
	const config = yield* Config;

	const update = (_ticker: PIXI.Ticker) =>
		Effect.gen(function* () {
			const entities = yield* entityManager.getAllEntitiesWithComponents([
				"Draftable",
				"Graphics",
				"Health",
			]);

			for (const entity of entities) {
				const draftable = entity.getComponent("Draftable");
				const graphics = entity.getComponent("Graphics");
				const health = entity.getComponent("Health");

				const width = config.CELL_SIZE / 1.3;
				const draftedIndicator = new PIXI.Graphics({ label: "draft" })
					.rect(
						config.CELL_SIZE / 2 - width / 2,
						config.CELL_SIZE + 6,
						width,
						3,
					)
					.fill({
						color: 0xff0000,
					})
					.stroke({
						color: 0xffffff,
						pixelLine: true,
					});

				const existingDraftIndicator =
					graphics.graphic.getChildByLabel("draft");

				const graphic = existingDraftIndicator || draftedIndicator;

				if (!existingDraftIndicator) {
					graphics.graphic.addChild(graphic);
				}

				graphic.visible = draftable.isDrafted;
				graphic.width = width * (health.currentHealth / 100);
			}
		});

	return { update } as const satisfies System;
});
