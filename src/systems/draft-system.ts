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
			]);

			for (const entity of entities) {
				const draftable = entity.getComponent("Draftable");
				const graphics = entity.getComponent("Graphics");

				const draftedIndicator = new PIXI.Graphics({ label: "draft" })
					.rect(
						config.CELL_SIZE / 2 - config.CELL_SIZE / 4,
						config.CELL_SIZE + 6,
						config.CELL_SIZE / 2,
						1,
					)
					.stroke(0xffffff);

				const existingDraftIndicator =
					graphics.graphic.getChildByLabel("draft");

				const graphic = existingDraftIndicator || draftedIndicator;

				if (!existingDraftIndicator) {
					graphics.graphic.addChild(graphic);
				}

				graphic.visible = draftable.isDrafted;
			}
		});

	return { update } as const satisfies System;
});
