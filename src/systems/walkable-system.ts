import { Effect } from "effect";
import { EntityManager } from "../app/entity-manager.ts";
import { Tilemap } from "../app/tilemap.ts";
import { PositionConversion } from "../services/position-conversion.ts";
import type { System } from "../types.ts";

export const WalkableSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;
	const tilemap = yield* Tilemap;
	const positionConversion = yield* PositionConversion;

	const update = () =>
		Effect.gen(function* () {
			const walkableEntities =
				yield* entityManager.getAllEntitiesWithComponents([
					"Walkable",
					"Position",
				]);

			for (const entity of walkableEntities) {
				const walkable = entity.getComponent("Walkable");
				const position = positionConversion.worldToGrid(
					entity.getComponent("Position"),
				);

				tilemap.setWalkableAt(position.x, position.y, walkable.isWalkable);
				// tilemap.setWeightAt(position.x, position.y, walkable.weight);
			}
		});

	return {
		update,
		mount: update,
	} as const satisfies System;
});
