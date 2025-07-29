import { Effect } from "effect";
import type * as PIXI from "pixi.js";
import type { Viewport as PIXIViewport } from "pixi-viewport";

import type { Command } from "../types.ts";

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
