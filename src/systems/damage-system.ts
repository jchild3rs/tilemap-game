import { Effect, Equal } from "effect";
import type * as PIXI from "pixi.js";
import { Config } from "../app/config.ts";
import { EntityManager } from "../app/entity-manager.ts";
import { PositionConversion } from "../services/position-conversion.ts";
import type { PositionLiteral, System } from "../types.ts";
import { findClosestPosition } from "../utils.ts";

export const DamageSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;
	const config = yield* Config;
	const positionConversion = yield* PositionConversion;

	const update = (ticker: PIXI.Ticker) =>
		Effect.gen(function* () {
			const entities = yield* entityManager.getAllEntitiesWithComponents([
				"Weapon",
				"Health",
				"Position",
				"Draftable",
				// "Graphics",
			]);

			function getEntityAtPosition(position: PositionLiteral) {
				return entities.find((entity) => {
					const entityPosition = entity.getComponent("Position");
					const entityPositionGrid =
						positionConversion.worldToGrid(entityPosition);
					const positionGrid = positionConversion.worldToGrid(position);
					return (
						entityPositionGrid.x === positionGrid.x &&
						entityPositionGrid.y === positionGrid.y
					);
				});
			}

			const friendlyPositions = entities
				.filter(
					(entity) =>
						entity.getComponent("CombatStatus").status === "friendly" &&
						entity.getComponent("Health").currentHealth > 0,
				)
				.map((entity) => entity.getComponent("Position"));

			const enemyPositions = entities
				.filter(
					(entity) =>
						entity.getComponent("CombatStatus").status === "hostile" &&
						entity.getComponent("Health").currentHealth > 0,
				)
				.map((entity) => entity.getComponent("Position"));

			for (const entity of entities) {
				const status = entity.getComponent("CombatStatus");
				const weapon = entity.getComponent("Weapon");
				const draftable = entity.getComponent("Draftable");
				const person = entity.getComponent("Person");
				const position = entity.getComponent("Position");

				if (draftable.isDrafted) {
					weapon.target = findClosestPosition(
						position,
						status.status === "hostile" ? friendlyPositions : enemyPositions,
						weapon.range * config.CELL_SIZE,
					);
					if (!weapon.target) continue;

					const targetedEntity = getEntityAtPosition(weapon.target);
					if (!targetedEntity) continue;

					const targetPerson = targetedEntity.getComponent("Person");
					const targetedEntityHealth = targetedEntity.getComponent("Health");

					const targetedEntityMovement =
						targetedEntity.getComponent("Movement");

					if (weapon.cooldownTimer === 0) {
						weapon.cooldownTimer = weapon.cooldown;
					} else {
						weapon.cooldownTimer = Math.max(
							0,
							weapon.cooldownTimer - ticker.deltaTime * 10,
						);
					}

					if (targetedEntityHealth.currentHealth === 0) {
						console.debug(`${targetPerson.firstName} is dead.`);
					}

					if (
						!Equal.equals(person, targetPerson) &&
						weapon.cooldownTimer === 0 &&
						targetedEntityHealth.currentHealth > 0
					) {
						const isTargetMoving = targetedEntityMovement.isMoving;
						const isHit =
							weapon.hitPercentage - (isTargetMoving ? 0.4 : 0) > Math.random();

						weapon.bullets = [
							{
								position: position,
								target: weapon.target,
								speed: 0.1,
								timestamp: performance.now(),
							},
						];

						if (isHit) {
							const damage = weapon.damagePerHit;

							targetedEntityHealth.currentHealth = Math.max(
								0,
								targetedEntityHealth.currentHealth - damage,
							);

							console.debug(
								`${person.firstName} applying ${damage} damage to ${targetPerson.firstName} (${targetedEntityHealth.currentHealth}/${targetedEntityHealth.maxHealth})`,
							);

							if (targetedEntityHealth.currentHealth === 0) {
								console.debug(`${targetPerson.firstName} is dead.`);
							}
						} else {
							console.debug(
								`${person.firstName} missed ${targetPerson.firstName}`,
							);
						}
					}
				}
			}
		}).pipe(
			Effect.annotateLogs({ system: "DamageSystem" }),
			Effect.withSpan("DamageSystem.update"),
		);

	return {
		update,
	} as const satisfies System;
});
