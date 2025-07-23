import { Effect } from "effect";
import * as PIXI from "pixi.js";
import { EntityManager } from "../app/entity-manager.ts";

import type { System } from "../types.ts";

export const DraftSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;

	const update = (_ticker: PIXI.Ticker) =>
		Effect.gen(function* () {
			const entities = yield* entityManager.getAllEntitiesWithComponents([
				"Draftable",
				"Graphics",
				"Input",
			]);

			for (const entity of entities) {
				const draftable = entity.getComponent("Draftable");
				const graphics = entity.getComponent("Graphics");
				const input = entity.getComponent("Input");

				input.isPlayerControlled = draftable.isDrafted;

				if (graphics.graphic.children.length === 0 && draftable.isDrafted) {
					graphics.graphic.addChild(
						new PIXI.Graphics()
							.circle(0, 0, 10)
							.fill(draftable.isDrafted ? 0x00ff00 : 0xffffff),
					);
				} else if (!draftable.isDrafted) {
					graphics.graphic.removeChildren();
				}
			}
		});

	return { update } as const satisfies System;
});
