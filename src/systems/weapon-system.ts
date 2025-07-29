import { Effect } from "effect";
import * as PIXI from "pixi.js";
import { Config } from "../app/config.ts";
import { EntityManager } from "../app/entity-manager.ts";
import { Tilemap } from "../app/tilemap.ts";
import { PositionConversion } from "../services/position-conversion.ts";
import type { System } from "../types.ts";
import { findClosestPosition, getGridLinePoints } from "../utils.ts";

export const WeaponSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;
	const config = yield* Config;
	const tilemap = yield* Tilemap;
	const positionConversion = yield* PositionConversion;

	const stateSystem = Effect.gen(function* () {
		const entities = yield* entityManager.getAllEntitiesWithComponents([
			"CombatStatus",
			"Weapon",
			"Draftable",
			"Position",
		]);

		const enemyPositions = yield* entityManager
			.getAllEntitiesWithComponents(["CombatStatus", "Position"])
			.pipe(
				Effect.map((entities) =>
					entities
						.filter(
							(entity) =>
								entity.getComponent("CombatStatus").status === "hostile",
						)
						.map((entity) => entity.getComponent("Position")),
				),
			);

		for (const entity of entities) {
			const weapon = entity.getComponent("Weapon");
			const drafted = entity.getComponent("Draftable");
			const position = entity.getComponent("Position");

			if (!drafted.isDrafted) continue;

			weapon.target = findClosestPosition(position, enemyPositions) || null;
			if (weapon.target) {
				const noObstacles = getGridLinePoints(
					positionConversion.worldToGrid(position),
					positionConversion.worldToGrid(weapon.target),
				).every((point) => tilemap.isWalkableAt(point[0], point[1]));

				const isWithinRange =
					position.x > weapon.target.x - config.CELL_SIZE * weapon.range &&
					position.y > weapon.target.y - config.CELL_SIZE * weapon.range &&
					position.x < weapon.target.x + config.CELL_SIZE * weapon.range &&
					position.y < weapon.target.y + config.CELL_SIZE * weapon.range;

				weapon.isFiring = noObstacles && isWithinRange;
			}
		}
	});

	const uiSystem = Effect.gen(function* () {
		const entities = yield* entityManager.getAllEntitiesWithComponents([
			"CombatStatus",
			"Weapon",
			"Draftable",
			"Graphics",
			"Position",
		]);

		for (const entity of entities) {
			const weapon = entity.getComponent("Weapon");
			const drafted = entity.getComponent("Draftable");
			const position = entity.getComponent("Position");
			const graphics = entity.getComponent("Graphics");

			if (!drafted.isDrafted) continue;

			const bulletContainer = new PIXI.Container({ label: "bullet" });
			const bulletGraphic = bulletContainer.addChild(new PIXI.Graphics({ label: "bullet-graphic" })
				.circle(config.CELL_SIZE / 2, config.CELL_SIZE / 2, 1)
				.fill(0xffffff));

			if (!graphics.graphic.getChildByLabel("bullet")) {
				graphics.graphic.addChild(bulletContainer);
			}



			// for (const point of points) {
			// 	const graphic = bulletGraphic.clone();
			// 	graphic.position.set(point[0] * config.CELL_SIZE + config.CELL_SIZE / 2, point[1] * config.CELL_SIZE + config.CELL_SIZE / 2);
			// 	bulletContainer.addChild(graphic);
			// }

			const existingRangeGraphic = graphics.graphic.getChildByLabel("range") as
				| PIXI.Graphics
				| undefined;

			const rangeRadiusGraphic =
				existingRangeGraphic ||
				new PIXI.Graphics({ label: "range", eventMode: "none" })
					.circle(
						config.CELL_SIZE / 2,
						config.CELL_SIZE / 2,
						config.CELL_SIZE * (weapon.range - 0.8),
					)
					.stroke({
						width: 4,
						color: 0xff0000,
					});


			rangeRadiusGraphic.visible = weapon.isFiring;

			if (!existingRangeGraphic) {
				graphics.graphic.addChild(rangeRadiusGraphic);
			}

			const existingTargetLineGraphic = graphics.graphic.getChildByLabel(
				"target line",
			) as PIXI.Graphics | undefined;

			const targetLineGraphic =
				existingTargetLineGraphic ||
				new PIXI.Graphics({ label: "target line", visible: false });

			if (!existingTargetLineGraphic) {
				graphics.graphic.addChild(targetLineGraphic);
			}

			// rangeRadiusGraphic.alpha = 0.2;
			targetLineGraphic.visible = weapon.isFiring; // is debug for now
			// targetLineGraphic.visible = false

			if (weapon.target) {
				targetLineGraphic.clear();
				targetLineGraphic
					.moveTo(0, 0)
					.lineTo(weapon.target.x - position.x, weapon.target.y - position.y)
					.stroke(0xff0000);

				targetLineGraphic.position.set(
					config.CELL_SIZE / 2,
					config.CELL_SIZE / 2,
				);
			}
		}
	});

	const update = (_ticker: PIXI.Ticker) =>
		Effect.gen(function* () {
			yield* stateSystem;
			yield* uiSystem;
		});

	return { update } as const satisfies System;
});
