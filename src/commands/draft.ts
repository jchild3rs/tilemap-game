import { Effect } from "effect";
import type { Ticker } from "pixi.js";
import type { IEntityManager } from "../app/entity-manager.ts";

export const Draft = (entityManager: IEntityManager) => {
	const execute = (_ticker: Ticker) =>
		Effect.gen(function* () {
			const entities = yield* entityManager.getAllEntitiesWithComponents([
				"Draftable",
				"Selectable",
			]);

			for (const entity of entities) {
				const draftable = entity.getComponent("Draftable");
				const selectable = entity.getComponent("Selectable");
				if (selectable.isSelected) {
					draftable.isDrafted = !draftable.isDrafted;
					console.log("set drafted state", draftable.isDrafted);
				}
			}

			//
			// const allSelected = entities.every(
			// 	(entity) => entity.getComponent("Selectable").isSelected,
			// );
			//
			// // look-ahead to determine how to update
			// const allDrafted =
			// 	entities.filter((entity) => {
			// 		const selectable = entity.getComponent("Selectable");
			// 		return (
			// 			entity.getComponent("Draftable").isDrafted && selectable.isSelected
			// 		);
			// 	}).length === entities.length;
			//
			// const someDrafted =
			// 	entities.filter((entity) => {
			// 		const selectable = entity.getComponent("Selectable");
			// 		return (
			// 			entity.getComponent("Draftable").isDrafted && selectable.isSelected
			// 		);
			// 	}).length > 0;
			//
			// console.log({
			// 	allDrafted,
			// 	allSelected,
			// 	someDrafted,
			// })
			//
			// if (allDrafted && allSelected) {
			// 	for (const entity of entities) {
			// 		const draftable = entity.getComponent("Draftable");
			//
			// 		draftable.isDrafted = false;
			// 	}
			// } else if (someDrafted && allSelected) {
			// 	for (const entity of entities) {
			// 		const draftable = entity.getComponent("Draftable");
			//
			// 		draftable.isDrafted = true;
			// 	}
			// } else {
			// 	for (const entity of entities) {
			// 		const draftable = entity.getComponent("Draftable");
			// 		const selectable = entity.getComponent("Selectable");
			//
			// 		if (selectable.isSelected) {
			// 			draftable.isDrafted = !draftable.isDrafted;
			// 		}
			// 	}
			// }
		});

	return { execute } as const;
};
