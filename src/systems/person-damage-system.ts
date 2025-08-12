import { Effect } from "effect";
import type * as PIXI from "pixi.js";
import { EntityManager } from "../app/entity-manager.ts";
import type { System } from "../types.ts";

export const PersonDamageSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;

	const update = (_ticker: PIXI.Ticker) =>
		Effect.gen(function* () {
			const entities = yield* entityManager.getAllEntitiesWithComponents([
				"Person",
				"Health",
				"Graphics",
			]);

			for (const entity of entities) {
				const graphics = entity.getComponent("Graphics");
				const health = entity.getComponent("Health");

				if (health.currentHealth === 0) {
					graphics.graphic.rotation = 1.5708; // 90 deg
					graphics.graphic.pivot.y = 24;

					const head = graphics.graphic
						.getChildByLabel("Body")
						?.getChildByLabel("Head");
					if (head) {
						const leftEye = head.getChildByLabel("Left Eye");
						const rightEye = head.getChildByLabel("Right Eye");
						const leftEyeDead = head.getChildByLabel("Left Eye Dead");
						const rightEyeDead = head.getChildByLabel("Right Eye Dead");

						if (leftEye && leftEyeDead && rightEye && rightEyeDead) {
							leftEye.visible = false;
							rightEye.visible = false;
							leftEyeDead.visible = true;
							rightEyeDead.visible = true;
						}
					}
				}
			}
		});

	return { update } as const satisfies System;
});
