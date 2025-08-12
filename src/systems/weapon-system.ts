import { Effect } from "effect";
import * as PIXI from "pixi.js";
import { Config } from "../app/config.ts";
import type { Entity } from "../app/entity.ts";
import { EntityManager } from "../app/entity-manager.ts";
import type { PositionLiteral, System } from "../types.ts";
import { findClosestPosition } from "../utils.ts";

export const WeaponSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;
	const config = yield* Config;

	function updateWeaponState(entities: Entity[], targets: PositionLiteral[]) {
		for (const entity of entities) {
			const weapon = entity.getComponent("Weapon");
			const drafted = entity.getComponent("Draftable");
			const position = entity.getComponent("Position");

			if (!drafted.isDrafted) continue;

			weapon.target =
				findClosestPosition(
					position,
					targets,
					weapon.range * config.CELL_SIZE,
				) || null;

			if (weapon.target) {
				// const noObstacles = getGridLinePoints(
				// 	positionConversion.worldToGrid(position),
				// 	positionConversion.worldToGrid(weapon.target),
				// ).every((point) => tilemap.isWalkableAt(point[0], point[1]));

				const isWithinRange =
					position.x > weapon.target.x - config.CELL_SIZE * weapon.range &&
					position.y > weapon.target.y - config.CELL_SIZE * weapon.range &&
					position.x < weapon.target.x + config.CELL_SIZE * weapon.range &&
					position.y < weapon.target.y + config.CELL_SIZE * weapon.range;

				// weapon.isFiring = noObstacles && isWithinRange;
				weapon.isFiring = isWithinRange;
			}
		}
	}

	const stateSystem = Effect.gen(function* () {
		const entities = yield* entityManager.getAllEntitiesWithComponents([
			"CombatStatus",
			"Weapon",
			"Draftable",
			"Position",
			"Health",
		]);

		const friendlies = entities.filter(
			(entity) =>
				entity.getComponent("CombatStatus").status === "friendly" &&
				entity.getComponent("Health").currentHealth > 0,
		);

		const friendlyPositions = friendlies.map((entity) =>
			entity.getComponent("Position"),
		);

		const enemies = entities.filter(
			(entity) =>
				entity.getComponent("CombatStatus").status === "hostile" &&
				entity.getComponent("Health").currentHealth > 0,
		);

		const enemyPositions = enemies.map((entity) =>
			entity.getComponent("Position"),
		);

		updateWeaponState(friendlies, enemyPositions);
		updateWeaponState(enemies, friendlyPositions);
	});

	const uiSystem = (_ticker: PIXI.Ticker) =>
		Effect.gen(function* () {
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

				let gunGraphic = graphics.graphic.getChildByLabel("Gun");
				if (!gunGraphic) {
					const gunHeight = config.CELL_SIZE / 6;
					const gunWidth = config.CELL_SIZE;
					const gunStartX = config.CELL_SIZE / 2;
					const gunStartY = config.CELL_SIZE / 2;
					const gunContainer = new PIXI.Container({ label: "Gun" });
					gunGraphic = new PIXI.Graphics({ label: "Gun Graphic" })
						.poly([
							// Grip
							gunStartX - gunHeight / 4,
							gunStartY,
							gunStartX + gunHeight / 4,
							gunStartY,
							gunStartX + gunHeight / 4,
							gunStartY + gunHeight,
							gunStartX - gunHeight / 4,
							gunStartY + gunHeight,
							// Barrel
							gunStartX - gunHeight / 4,
							gunStartY,
							gunStartX - gunHeight / 4,
							gunStartY - gunHeight / 4,
							gunStartX + gunWidth / 2,
							gunStartY - gunHeight / 4,
							gunStartX + gunWidth / 2,
							gunStartY,
						])
						.fill(0x000000)
						.stroke({ width: 2, color: 0x000000 });

					gunContainer.position.set(17, 25);
					gunContainer.pivot.set(-9, 4);
					gunGraphic.pivot.set(config.CELL_SIZE / 2, config.CELL_SIZE / 2);
					gunContainer.addChild(gunGraphic);
					graphics.graphic.addChild(gunContainer);
				}

				if (!drafted.isDrafted) continue;

				// const existingRangeGraphic = graphics.graphic.getChildByLabel(
				// 	"range",
				// ) as PIXI.Graphics | undefined;

				// const rangeRadiusGraphic =
				// 	existingRangeGraphic ||
				// 	new PIXI.Graphics({
				// 		label: "range",
				// 		eventMode: "none",
				// 	})
				// 		.circle(
				// 			config.CELL_SIZE / 2,
				// 			config.CELL_SIZE / 2,
				// 			config.CELL_SIZE * (weapon.range - 0.8),
				// 		)
				// 		.fill({
				// 			alpha: 0.05,
				// 			color: 0xffffff,
				// 		})
				// 		.stroke({
				// 			width: 1,
				// 			alpha: 0.2,
				// 			color: 0xffffff,
				// 		});
				//
				// rangeRadiusGraphic.visible = Boolean(weapon.target)

				// if (!existingRangeGraphic) {
				// 	graphics.graphic.addChild(rangeRadiusGraphic);
				// }

				const existingTargetLineGraphic = graphics.graphic.getChildByLabel(
					"target line",
				) as PIXI.Graphics | undefined;

				const targetLineGraphic =
					existingTargetLineGraphic ||
					new PIXI.Graphics({
						label: "target line",
						visible: false,
						alpha: 0.2,
					});

				if (!existingTargetLineGraphic) {
					graphics.graphic.addChild(targetLineGraphic);
				}
				targetLineGraphic.visible = Boolean(weapon.target);

				if (!weapon.target) continue;

				const rotation = Math.atan2(
					weapon.target.y - position.y,
					weapon.target.x - position.x,
				);
				const gunContainer = graphics.graphic
					.getChildByLabel("Gun")
					?.getChildByLabel("Gun Graphic");
				if (gunContainer) {
					gunContainer.rotation = rotation;
				}

				targetLineGraphic.clear();
				targetLineGraphic
					.moveTo(0, 0)
					.lineTo(weapon.target.x - position.x, weapon.target.y - position.y)
					.stroke(0xffffff);

				targetLineGraphic.position.set(
					config.CELL_SIZE / 2,
					config.CELL_SIZE / 2,
				);
				// }
			}
		});

	const update = (ticker: PIXI.Ticker) =>
		Effect.gen(function* () {
			yield* stateSystem;
			yield* uiSystem(ticker);
		});

	return { update } as const satisfies System;
});
