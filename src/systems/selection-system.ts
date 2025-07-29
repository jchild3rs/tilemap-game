import { Chunk, Effect, Stream, type StreamEmit } from "effect";
import type { FederatedPointerEvent } from "pixi.js";
import * as PIXI from "pixi.js";
import { Config } from '../app/config.ts';
import { EntityManager } from "../app/entity-manager.ts";
import { Viewport } from "../app/viewport.ts";
import type { PositionLiteral, System } from "../types.ts";

export const SelectionSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;
	const viewport = yield* Viewport;
	const config = yield* Config;

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
		Effect.gen(function* () {
			selectionStart = viewport.toWorld(event.screen);
			selectionBounds = null;

			// const entities = yield* entityManager.getAllEntitiesWithComponents(["Selectable",]);
			//
			// for (const entity of entities) {
			// 	const selectable = entity.getComponent("Selectable");
			//
			// 	selectable.isSelected = false;
			// }
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

	const handleMouseUp = (_event: FederatedPointerEvent) =>
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



			for (const selectableGraphic of entities) {
				const graphics = selectableGraphic.getComponent("Graphics");
				const selectable = selectableGraphic.getComponent("Selectable");

				selectable.isSelected = selectionGraphic
					.getBounds()
					.rectangle.intersects(graphics.graphic.getBounds().rectangle);

				const existingHighlight = graphics.graphic.getChildByLabel("highlight");
				const highlightGraphic= existingHighlight || new PIXI.Graphics({label: "highlight"})
					.rect(0, 0, config.CELL_SIZE, config.CELL_SIZE)
					.stroke(0xffffff)
				if (!existingHighlight) {
					graphics.graphic.addChild(highlightGraphic);
				}
				highlightGraphic.visible = selectable.isSelected;

				// graphics.graphic.alpha = selectable.isSelected ? 0.5 : 1;
			}
		});

	const system: System = { update };

	return system;
});
