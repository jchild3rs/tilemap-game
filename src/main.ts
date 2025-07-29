import { BrowserRuntime } from "@effect/platform-browser";
import { Effect, Logger, LogLevel } from "effect";
import { ConfigLive } from "./app/config.ts";
import { GameEngine } from "./app/engine.ts";
import { EntityManagerLive } from "./app/entity-manager.ts";
import { RendererLive } from "./app/renderer.ts";
import { StageLive } from "./app/stage.ts";
import { TickerLive } from "./app/ticker.ts";
import { TilemapLive } from "./app/tilemap.ts";
import { ViewportLive } from "./app/viewport.ts";
import { EntityLayer } from "./entities/layer.ts";
import { PathfinderFactoryLive } from "./services/pathfinder-factory.ts";
import { PathfindingLive } from "./services/pathfinding-service.ts";
import { PositionConversionLive } from "./services/position-conversion.ts";

BrowserRuntime.runMain(
	GameEngine.pipe(
		Effect.provide(EntityLayer),
		Effect.provide(PathfindingLive),
		Effect.provide(TilemapLive),
		Effect.provide(PathfinderFactoryLive),
		Effect.provide(PositionConversionLive),
		Effect.provide(EntityManagerLive),
		Effect.provide(ViewportLive),
		Effect.provide(TickerLive),
		Effect.provide(RendererLive),
		Effect.provide(StageLive),
		Effect.provide(ConfigLive),
		Logger.withMinimumLogLevel(LogLevel.Debug),
	),
);
