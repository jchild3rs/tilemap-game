import { Effect } from "effect";
import type { Ticker } from "pixi.js";

import type { Command } from "../types.ts";

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
