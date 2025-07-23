import { Chunk, Effect, Stream, type StreamEmit } from "effect";
import type * as PIXI from "pixi.js";
import { makePawn, makeWall } from "../factories.ts";
import { PositionConversion } from "../services/position-conversion.ts";
import { DraftSystem } from "../systems/draft-system.ts";
import { InputSystem } from "../systems/input-system.ts";
import { LayerRenderSystem } from "../systems/layer-render-system.ts";
import { MovementSystem } from "../systems/movement-system.ts";
import { PathRenderSystem } from "../systems/path-render-system.ts";
import { SelectionSystem } from "../systems/selection-system.ts";
import {
	TilemapRenderSystem,
	WalkableSystem,
} from "../systems/tilemap-render-system.ts";
import { Ticker } from "./ticker.ts";
import { Tilemap } from "./tilemap.ts";

export const GameEngine = Effect.gen(function* () {
	const ticker = yield* Ticker;
	// const globalTicker = new Ticker()
	const systems = yield* Effect.all(
		[
			TilemapRenderSystem,
			WalkableSystem,
			InputSystem,
			LayerRenderSystem,
			MovementSystem,
			PathRenderSystem,
			SelectionSystem,
			DraftSystem,
		],
		{
			concurrency: "unbounded",
		},
	);
	console.log({ systems });

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

	const tilemap = yield* Tilemap;
	const conversion = yield* PositionConversion;

	// yield* makeTilemap;
	for (let i = 0; i < 50; i++) {
		const gridPosition = tilemap.getRandomWalkablePosition();
		const worldPosition = yield* conversion.gridToWorld(gridPosition);
		yield* makeWall(worldPosition.x, worldPosition.y);
	}

	for (let i = 0; i < 10; i++) {
		const gridPosition = tilemap.getRandomWalkablePosition();
		const worldPosition = yield* conversion.gridToWorld(gridPosition);
		yield* makePawn(worldPosition.x, worldPosition.y);
	}
	// yield* makeTilemap;

	return Effect.never;
});
