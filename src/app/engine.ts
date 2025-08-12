import { Chunk, Effect, Stream, type StreamEmit } from "effect";
import type * as PIXI from "pixi.js";
import { MountainEntity } from "../entities/mountain.ts";
import { PersonEntity } from "../entities/person.ts";
import { WallEntity } from "../entities/wall.ts";
import { WaterEntity } from "../entities/water.ts";
import { Pathfinding } from "../services/pathfinding-service.ts";
import { PositionConversion } from "../services/position-conversion.ts";
import { DamageSystem } from "../systems/damage-system.ts";
import { DebugSystem } from "../systems/debug-system.ts";
import { DraftSystem } from "../systems/draft-system.ts";
import { InputSystem } from "../systems/input-system.ts";
import { LayerRenderSystem } from "../systems/layer-render-system.ts";
import { MovementSystem } from "../systems/movement-system.ts";
import { PathRenderSystem } from "../systems/path-render-system.ts";
import { PersonDamageSystem } from "../systems/person-damage-system.ts";
import { PersonNameSystem } from "../systems/person-name-system.ts";
import { SelectionSystem } from "../systems/selection-system.ts";
import { TilemapRenderSystem } from "../systems/tilemap-render-system.ts";
import { WalkableSystem } from "../systems/walkable-system.ts";
import { WeaponSystem } from "../systems/weapon-system.ts";
import type { System } from "../types.ts";
import { Config } from "./config.ts";
import { Ticker } from "./ticker.ts";
import { Tilemap } from "./tilemap.ts";

export const GameEngine = Effect.gen(function* () {
	const config = yield* Config;
	const ticker = yield* Ticker;
	const tilemap = yield* Tilemap;
	const conversion = yield* PositionConversion;
	const pathfinding = yield* Pathfinding;

	// const globalTicker = new Ticker()
	const systems: System[] = yield* Effect.all(
		[
			DebugSystem,
			LayerRenderSystem,
			TilemapRenderSystem,
			WalkableSystem,
			InputSystem,
			MovementSystem,
			PathRenderSystem,
			SelectionSystem,
			DraftSystem,
			WeaponSystem,
			DamageSystem,
			PersonNameSystem,
			PersonDamageSystem,
		],
		{ concurrency: "unbounded" },
	);

	// Stream game loop and update systems
	yield* Stream.async(
		(emit: StreamEmit.Emit<never, never, PIXI.Ticker, void>) => {
			ticker.add((t) => emit(Effect.succeed(Chunk.of(t))));
		},
	).pipe(
		Stream.tap((t) =>
			Effect.all(
				systems.map((system) => system.update(t)),
				{ concurrency: "unbounded" },
			),
		),
		Stream.runDrain,
		Effect.forkDaemon,
	);

	yield* Stream.async(
		(emit: StreamEmit.Emit<never, never, PIXI.Ticker, void>) => {
			ticker.addOnce((t) => emit(Effect.succeed(Chunk.of(t))));
		},
	).pipe(
		Stream.tap(() =>
			Effect.all(
				systems.map((system) => system.mount?.() ?? Effect.void),
				{ concurrency: "unbounded" },
			),
		),
		Stream.runDrain,
		Effect.forkDaemon,
	);

	const lakeSizeRatioFromWorldSize = Math.random() * 0.2 + 0.1;
	const lakeCount = config.WORLD_SIZE * lakeSizeRatioFromWorldSize;
	for (let i = 0; i < lakeCount; i++) {
		const gridPosition = tilemap.getRandomWalkablePosition();
		const positions = pathfinding.generateFormationPositions(10, gridPosition);
		for (const position of positions) {
			const worldPosition = yield* conversion.gridToWorld(position);
			yield* WaterEntity.create(worldPosition);
		}
	}

	const mountainSizeRatioFromWorldSize = Math.random() * 0.2 + 0.1;
	const mountainCount = config.WORLD_SIZE * mountainSizeRatioFromWorldSize;

	for (let i = 0; i < mountainCount; i++) {
		const gridPosition = tilemap.getRandomWalkablePosition();
		const worldPosition = yield* conversion.gridToWorld(gridPosition);

		yield* MountainEntity.create(worldPosition);

		const positions = pathfinding.generateFormationPositions(20, gridPosition);
		for (const position of positions) {
			tilemap.setWalkableAt(position.x, position.y, false);
			const worldPosition = yield* conversion.gridToWorld(position);
			yield* MountainEntity.create(worldPosition);
		}
	}

	for (let i = 0; i < 20; i++) {
		yield* WallEntity.create(
			yield* conversion.gridToWorld(tilemap.getRandomWalkablePosition()),
		);
	}

	for (let i = 0; i < 75; i++) {
		yield* PersonEntity.create(
			yield* conversion.gridToWorld(tilemap.getRandomWalkablePosition()),
			"friendly",
		);
	}

	for (let i = 0; i < 50; i++) {
		yield* PersonEntity.create(
			yield* conversion.gridToWorld(tilemap.getRandomWalkablePosition()),
			"hostile",
		);
	}
});
