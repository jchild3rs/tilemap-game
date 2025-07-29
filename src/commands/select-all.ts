import { Effect } from "effect";
import type { Ticker } from "pixi.js";
import type { IEntityManager } from "../app/entity-manager.ts";

export const SelectAll = (entityManager: IEntityManager) => {
	const execute = (_ticker: Ticker) =>
		Effect.gen(function* () {
			const entities = yield* entityManager.getAllEntitiesWithComponents([
				"Selectable",
			]);

			for (const entity of entities) {
				const selectable = entity.getComponent("Selectable");

				selectable.isSelected = true;
			}
		});

	return { execute } as const;
};
