import { Effect } from "effect";
import type * as PIXI from "pixi.js";
import { EntityManager } from "../app/entity-manager.ts";
import { PositionConversion } from "../services/position-conversion.ts";
import type { PositionLiteral, System } from "../types.ts";

export const DamageSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;
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

			for (const entity of entities) {
				const health = entity.getComponent("Health");
				const weapon = entity.getComponent("Weapon");
				const draftable = entity.getComponent("Draftable");
				const person = entity.getComponent("Person");

				if (health.currentHealth === 0) {
					continue;
				}

				if (weapon.target && weapon.isFiring && draftable.isDrafted) {
					// console.log('start')
					// yield* Effect.sleep(weapon.cooldownTimer)
					// console.log('stop')
					const targetedEntity = getEntityAtPosition(weapon.target);
					// console.log({targetedEntity})
					if (!targetedEntity) continue;

					const targetedEntityHealth = targetedEntity.getComponent("Health");
					// const targetedEntityGraphics =
					// 	targetedEntity.getComponent("Graphics");

					const targetPerson = targetedEntity.getComponent("Person");
					if (targetedEntityHealth.currentHealth === 0) {
						yield* Effect.logDebug(`${targetPerson.firstName} is dead.`);
					}

					if (
						weapon.cooldownTimer === 0 &&
						targetedEntityHealth.currentHealth > 0
					) {
						const isHit = weapon.hitPercentage > Math.random();

						if (!isHit) {
							yield* Effect.logDebug(
								`${person.firstName} missed ${targetPerson.firstName}`,
							);
						} else {
							const damage = weapon.damagePerHit;

							targetedEntityHealth.currentHealth = Math.max(
								0,
								targetedEntityHealth.currentHealth - damage,
							);
							// targetedEntityGraphics.graphic.alpha =
							// 	targetedEntityHealth.currentHealth / targetedEntityHealth.maxHealth;

							if (targetedEntityHealth.currentHealth === 0) {
								yield* Effect.logDebug(`${targetPerson.firstName} is dead.`);
							}
							yield* Effect.logDebug(
								`${person.firstName} applying ${damage} damage to ${targetPerson.firstName} (${targetedEntityHealth.currentHealth}/${targetedEntityHealth.maxHealth})`,
							);
						}
					}

					if (weapon.cooldownTimer === 0) {
						weapon.cooldownTimer = weapon.cooldown;
					} else {
						weapon.cooldownTimer = Math.max(
							0,
							weapon.cooldownTimer - ticker.deltaTime * 10,
						);
					}
				}
			}
		}).pipe(
			Effect.annotateLogs({ system: "DamageSystem" }),
			Effect.withSpan("DamageSystem.update"),
		);

	return { update } as const satisfies System;
});
