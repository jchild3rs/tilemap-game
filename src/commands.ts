import { Effect } from "effect";
import type * as PIXI from "pixi.js";
import type { Ticker } from "pixi.js";
import type { Viewport as PIXIViewport } from "pixi-viewport";
import type { IEntityManager } from "./app/entity-manager.ts";

export interface Command {
	execute(ticker: Ticker): Effect.Effect<void>;
}

export const MoveViewport = (
	viewport: PIXIViewport,
	dx: number,
	dy: number,
	speed: number,
): Command => {
	const FIXED_TIME_STEP = 1 / 60;

	const execute = (_ticker: PIXI.Ticker) =>
		Effect.sync(() => {
			const actualSpeed = speed * FIXED_TIME_STEP;

			viewport.moveCenter(
				viewport.center.x + dx * actualSpeed,
				viewport.center.y + dy * actualSpeed,
			);
		});

	return { execute } as const;
};

export const ChangeGameSpeedLevel = (speed: number): Command => {
	const execute = (ticker: PIXI.Ticker) =>
		Effect.sync(() => {
			if (ticker.speed === speed) return;

			ticker.speed = speed;
		});

	return { execute } as const;
};

export const TogglePausePlay = (): Command => {
	let prev: number;

	const execute = (ticker: Ticker) =>
		Effect.sync(() => {
			if (ticker.speed !== 0) {
				prev = ticker.speed;
				ticker.speed = 0;
			} else {
				ticker.speed = prev;
			}
		});

	return { execute } as const;
};

export const Draft = (entityManager: IEntityManager) => {
	const execute = (_ticker: Ticker) =>
		Effect.gen(function* () {
			const entities = yield* entityManager.getAllEntitiesWithComponents([
				"Draftable",
				"Selectable",
				"Input",
			]);

			for (const entity of entities) {
				const draftable = entity.getComponent("Draftable");
				const selectable = entity.getComponent("Selectable");
				const input = entity.getComponent("Input");

				if (selectable.isSelected) {
					draftable.isDrafted = !draftable.isDrafted;
				}

				input.isPlayerControlled = draftable.isDrafted;
			}
		});

	return { execute } as const;
};
