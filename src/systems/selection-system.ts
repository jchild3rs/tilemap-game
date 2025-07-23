import { Chunk, Effect, Stream, type StreamEmit } from "effect";
import type { FederatedPointerEvent } from "pixi.js";
import * as PIXI from "pixi.js";
import { EntityManager } from "../app/entity-manager.ts";
import { Viewport } from "../app/viewport.ts";
import type { PositionLiteral, System } from "../types.ts";

export const SelectionSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;
	const viewport = yield* Viewport;

	const selectionGraphic = viewport.addChild(
		new PIXI.Graphics({
			alpha: 0.5,
			label: "selection",
		})
			.rect(0, 0, 0, 0)
			.fill(0xffffff),
	);

	let selectionBounds: {
		x: number;
		y: number;
		width: number;
		height: number;
	} | null = null;
	let selectionStart: PositionLiteral | null = null;
	let selectionEnd: PositionLiteral | null = null;

	const handleMouseDown = (event: FederatedPointerEvent) =>
		Effect.sync(() => {
			selectionStart = viewport.toWorld(event.screen);
			selectionBounds = null;
		});

	yield* Stream.async(
		(emit: StreamEmit.Emit<never, never, FederatedPointerEvent, void>) => {
			viewport.on("mousedown", (event) => {
				void emit(Effect.succeed(Chunk.of(event)));
			});
		},
	).pipe(
		Stream.tap((event) => handleMouseDown(event)),
		Stream.runDrain,
		Effect.forkDaemon,
	);

	const handleMouseMove = (event: FederatedPointerEvent) =>
		Effect.gen(function* () {
			selectionEnd = viewport.toWorld(event.screen);

			if (!selectionStart) {
				return;
			}
			selectionBounds = {
				x: Math.min(selectionStart.x, selectionEnd.x),
				y: Math.min(selectionStart.y, selectionEnd.y),
				width: Math.abs(selectionStart.x - selectionEnd.x),
				height: Math.abs(selectionStart.y - selectionEnd.y),
			};

			const screenPosition = viewport.toGlobal(selectionBounds);

			const selectionRect = new PIXI.Rectangle(
				screenPosition.x,
				screenPosition.y,
				selectionBounds.width,
				selectionBounds.height,
			);

			const entities = yield* entityManager.getAllEntitiesWithComponents([
				"Highlightable",
				"Selectable",
				"Graphics",
			]);

			for (const selectableGraphic of entities) {
				const graphics = selectableGraphic.getComponent("Graphics");
				const selectable = selectableGraphic.getComponent("Selectable");

				selectable.isSelected = selectionRect.intersects(
					graphics.graphic.getBounds().rectangle,
				);
			}
		});

	yield* Stream.async(
		(emit: StreamEmit.Emit<never, never, FederatedPointerEvent, void>) => {
			viewport.on("globalmousemove", (event) => {
				void emit(Effect.succeed(Chunk.of(event)));
			});
		},
	).pipe(
		Stream.tap((event) => handleMouseMove(event)),
		Stream.runDrain,
		Effect.forkDaemon,
	);

	const handleMouseUp = (event: FederatedPointerEvent) =>
		Effect.gen(function* () {
			selectionStart = null;
			selectionEnd = null;
			selectionGraphic.clear();
			selectionGraphic.width = 0;
			selectionGraphic.height = 0;
			if (selectionBounds) {
				selectionBounds = null;
				return;
			}

			const entities = yield* entityManager.getAllEntitiesWithComponents([
				"Selectable",
				"Graphics",
			]);

			for (const selectableGraphic of entities) {
				const graphics = selectableGraphic.getComponent("Graphics");
				const selectable = selectableGraphic.getComponent("Selectable");

				selectable.isSelected = graphics.graphic
					.getBounds()
					.rectangle.contains(event.screenX, event.screenY);
			}
		});

	yield* Stream.async(
		(emit: StreamEmit.Emit<never, never, FederatedPointerEvent, void>) => {
			viewport.on("mouseup", (event) => {
				void emit(Effect.succeed(Chunk.of(event)));
			});
		},
	).pipe(
		Stream.tap((event) => handleMouseUp(event)),
		Stream.runDrain,
		Effect.forkDaemon,
	);

	// draw selection box in animation loop
	const update = (_ticker: PIXI.Ticker) =>
		Effect.gen(function* () {
			const entities = yield* entityManager.getAllEntitiesWithComponents([
				"Selectable",
				"Graphics",
			]);

			for (const selectableGraphic of entities) {
				const graphics = selectableGraphic.getComponent("Graphics");
				const selectable = selectableGraphic.getComponent("Selectable");

				graphics.graphic.alpha = selectable.isSelected ? 0.5 : 1;
			}

			if (!selectionBounds) {
				return;
			}

			selectionGraphic.clear();
			selectionGraphic
				.rect(0, 0, selectionBounds.width, selectionBounds.height)
				.fill(0xffffff);
			selectionGraphic.position.set(selectionBounds.x, selectionBounds.y);
			selectionGraphic.width = selectionBounds.width;
			selectionGraphic.height = selectionBounds.height;
		});

	return { update } as const satisfies System;
});
