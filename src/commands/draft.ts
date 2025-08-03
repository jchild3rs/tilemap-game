import { Effect } from "effect";
import type { Ticker } from "pixi.js";
import type { IEntityManager } from "../app/entity-manager.ts";

export const Draft = (entityManager: IEntityManager) => {
	const execute = (_ticker: Ticker) =>
		Effect.gen(function* () {
			const entities = yield* entityManager.getAllEntitiesWithComponents([
				"Draftable",
				"Selectable",
				"Movement",
			]);

			for (const entity of entities) {
				const draftable = entity.getComponent("Draftable");
				const movement = entity.getComponent("Movement");
				const selectable = entity.getComponent("Selectable");
				if (selectable.isSelected) {
					draftable.isDrafted = !draftable.isDrafted;
					if (draftable.isDrafted) {
						movement.path = [];
						movement.currentPathIndex = 0;
						movement.isWandering = false;
					} else {
						movement.isWandering = true;
					}
				}
			}
		});

	return { execute } as const;
};
