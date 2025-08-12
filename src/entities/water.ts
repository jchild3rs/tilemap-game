import { Effect } from "effect";
import * as PIXI from "pixi.js";
import { Config } from "../app/config.ts";
import { EntityManager } from "../app/entity-manager.ts";
import { Components } from "../components.ts";
import type { PositionLiteral } from "../types.ts";

export class WaterEntity extends Effect.Service<WaterEntity>()(
	"entities/Water",
	{
		effect: Effect.gen(function* () {
			const config = yield* Config;
			const entityManager = yield* EntityManager;

			const create = (position: PositionLiteral) => {
				return entityManager.createEntity([
					Components.Walkable({ weight: 2.7 }),
					Components.Ground({ isWalkable: true }),
					Components.Position(position),
					Components.Graphics({
						graphic: new PIXI.Graphics({ label: "water" })
							.rect(0, 0, config.CELL_SIZE, config.CELL_SIZE)
							.fill("blue"),
					}),
				]);
			};

			return { create } as const;
		}),
		accessors: true,
	},
) {}
