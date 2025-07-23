import { BrowserRuntime } from "@effect/platform-browser";
import { Effect, Layer, Logger, LogLevel } from "effect";
import { GameEngine } from "./app/engine.ts";
import { EntityManagerLive } from "./app/entity-manager.ts";
import { RendererLive } from "./app/renderer.ts";
import { StageLive } from "./app/stage.ts";
import { TickerLive } from "./app/ticker.ts";
import { TilemapLive } from "./app/tilemap.ts";
import { ViewportLive } from "./app/viewport.ts";
import { PathfinderFactoryLive } from "./services/pathfinder-factory.ts";
import { PathfindingLive } from "./services/pathfinding-service.ts";
import { PositionConversionLive } from "./services/position-conversion.ts";

BrowserRuntime.runMain(
	GameEngine.pipe(
		Effect.provide(PathfindingLive),
		Effect.provide(TilemapLive),
		Effect.provide(PathfinderFactoryLive),
		Effect.provide(PositionConversionLive),
		Effect.provide(EntityManagerLive),
		Effect.provide(ViewportLive),
		Effect.provide(TickerLive),
		Effect.provide(Layer.mergeAll(RendererLive, StageLive)),
		Logger.withMinimumLogLevel(LogLevel.Debug),
	),
);
