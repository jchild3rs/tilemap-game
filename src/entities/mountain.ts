import { Effect } from "effect";
import * as PIXI from "pixi.js";
import { Config } from "../app/config.ts";
import { EntityManager } from "../app/entity-manager.ts";
import { Components } from "../components.ts";
import type { PositionLiteral } from "../types.ts";

export class MountainEntity extends Effect.Service<MountainEntity>()(
	"entities/Mountain",
	{
		effect: Effect.gen(function* () {
			const config = yield* Config;
			const entityManager = yield* EntityManager;

			const create = (position: PositionLiteral) => {
				return entityManager.createEntity([
					Components.Walkable({ weight: Infinity }),
					Components.Objects(),
					Components.Position(position),
					Components.Graphics({
						graphic: new PIXI.Graphics({ label: "mountain" })
							.rect(0, 0, config.CELL_SIZE, config.CELL_SIZE)
							.fill("#cbc6c1"),
					}),
				]);
			};
			return { create } as const;
		}),
		accessors: true,
	},
) {}
