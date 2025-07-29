import { Effect } from "effect";
import type * as PIXI from "pixi.js";

import type { Command } from "../types.ts";

export const ChangeGameSpeedLevel = (speed: number): Command => {
	const execute = (ticker: PIXI.Ticker) =>
		Effect.sync(() => {
			if (ticker.speed === speed) return;

			ticker.speed = speed;
		});

	return { execute } as const;
};
