import { Effect } from "effect";
import type * as PIXI from "pixi.js";
import { EntityManager } from "../app/entity-manager.ts";
import { PositionConversion } from "../services/position-conversion.ts";
import type { PositionLiteral, System } from "../types.ts";

export const DamageSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;
	const positionConversion = yield* PositionConversion;

	const audio = new Audio("/assets/sounds/pistol-shot.mp3");
	const audioContext = new AudioContext();
	audioContext
		.createMediaElementSource(audio)
		.connect(audioContext.destination);

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
				// const health = entity.getComponent("Health");
				const weapon = entity.getComponent("Weapon");
				const draftable = entity.getComponent("Draftable");
				const person = entity.getComponent("Person");
				const position = entity.getComponent("Position");
				// const graphics = entity.getComponent("Graphics");
				//
				// if (health.currentHealth === 0) {
				// 	if (person && graphics) {
				// 		graphics.graphic.pivot.set(config.CELL_SIZE / 2, config.CELL_SIZE / 2)
				// 		graphics.graphic.rotation = Math.PI / 4; // Rotate 45 degrees
				// 	}
				// 	continue;
				// }

				if (weapon.target && weapon.isFiring && draftable.isDrafted) {
					const targetedEntity = getEntityAtPosition(weapon.target);
					if (!targetedEntity) continue;

					const targetedEntityHealth = targetedEntity.getComponent("Health");
					const targetedEntityMovement =
						targetedEntity.getComponent("Movement");
					const isTargetMoving = targetedEntityMovement?.isMoving ?? false;

					const targetPerson = targetedEntity.getComponent("Person");
					if (targetedEntityHealth.currentHealth === 0) {
						yield* Effect.logDebug(`${targetPerson.firstName} is dead.`);
					}

					if (weapon.cooldownTimer === 0) {
						weapon.cooldownTimer = weapon.cooldown;
					} else {
						weapon.cooldownTimer = Math.max(
							0,
							weapon.cooldownTimer - ticker.deltaTime * 10,
						);
					}

					if (
						weapon.cooldownTimer === 0 &&
						targetedEntityHealth.currentHealth > 0
					) {
						const isHit =
							weapon.hitPercentage - (isTargetMoving ? 0.4 : 0) > Math.random();

						yield* Effect.log("queuing bullet");

						weapon.bullets = [
							{
								position: position,
								target: weapon.target,
								speed: 0.1,
								timestamp: performance.now(),
							},
						];

						if (!isHit) {
							yield* Effect.logDebug(
								`${person.firstName} missed ${targetPerson.firstName}`,
							);
						} else {
							void audio.play();
							const damage = weapon.damagePerHit;

							targetedEntityHealth.currentHealth = Math.max(
								0,
								targetedEntityHealth.currentHealth - damage,
							);

							yield* Effect.logDebug(
								`${person.firstName} applying ${damage} damage to ${targetPerson.firstName} (${targetedEntityHealth.currentHealth}/${targetedEntityHealth.maxHealth})`,
							);

							if (targetedEntityHealth.currentHealth === 0) {
								yield* Effect.logDebug(`${targetPerson.firstName} is dead.`);
							}
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
		mount: () =>
			Effect.sync(() => {
				window.addEventListener(
					"load",
					() => {
						if (audioContext.state === "suspended") {
							void audioContext.resume();
						}

						void audio.play();
						void audio.pause();
					},
					{ once: true },
				);
			}),
	} as const satisfies System;
});
