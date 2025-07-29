import { Effect } from "effect";
import * as PIXI from "pixi.js";
import { Config } from "../app/config.ts";
import { EntityManager } from "../app/entity-manager.ts";
import { type CombatStatus, Components } from "../components.ts";
import { MovementDirection, type PositionLiteral } from "../types.ts";

export class PawnEntity extends Effect.Service<PawnEntity>()("entities/Pawn", {
	effect: Effect.gen(function* () {
		const config = yield* Config;
		const entityManager = yield* EntityManager;

		const makeBody = (status: CombatStatus) => {
			const container = new PIXI.Container({ label: "Body" });

			const torsoContainer = container.addChild(
				new PIXI.Container({ label: "Torso" }),
			);
			const skinColor = "#f3c4c4";
			torsoContainer.addChild(
				new PIXI.Graphics({ label: "Torso" })
					.ellipse(
						config.CELL_SIZE / 2,
						config.CELL_SIZE / 1.8,
						config.CELL_SIZE / 3.5,
						config.CELL_SIZE / 2.5,
					)
					.fill(skinColor)
					.stroke({ width: 2, color: 0x000000 }),
			);

			const shirtMask = torsoContainer.addChild(
				new PIXI.Graphics({ label: "Shirt Mask" })
					.ellipse(
						config.CELL_SIZE / 2,
						config.CELL_SIZE / 2,
						config.CELL_SIZE / 2,
						config.CELL_SIZE / 4,
					)
					.fill("#000000")
					.stroke({ width: 2, color: 0x000000 }),
			);

			const shirt = torsoContainer.addChild(
				new PIXI.Graphics({ label: "Shirt" })
					.ellipse(
						config.CELL_SIZE / 2,
						config.CELL_SIZE / 1.8,
						config.CELL_SIZE / 3.5,
						config.CELL_SIZE / 2.5,
					)
					.fill(status === "hostile" ? "#ff0c0c" : "#0cbfff")
					.stroke({ width: 2, color: 0x000000 }),
			);
			shirt.position.set(0, 0);
			shirt.mask = shirtMask;

			const legsContainer = container.addChild(
				new PIXI.Container({ label: "Legs" }),
			);
			legsContainer.position.set(0, 0);

			const pantsMask = legsContainer.addChild(
				new PIXI.Graphics({ label: "Pants Mask" })
					.rect(
						0,
						config.CELL_SIZE * 0.7,
						config.CELL_SIZE,
						config.CELL_SIZE / 2,
					)
					.fill("transparent"),
			);
			const pants = legsContainer.addChild(
				new PIXI.Graphics({ label: "Pants" })
					.ellipse(
						config.CELL_SIZE / 2,
						config.CELL_SIZE / 1.8,
						config.CELL_SIZE / 3.5,
						config.CELL_SIZE / 2.5,
					)
					.fill(0x0000ff)
					.stroke({ width: 2, color: 0x000000 }),
			);
			pants.position.set(0, 0);
			pants.mask = pantsMask;

			const headContainer = container.addChild(
				new PIXI.Container({ label: "Head" }),
			);
			headContainer.addChild(
				new PIXI.Graphics({ label: "Head" })
					.circle(
						config.CELL_SIZE / 2,
						config.CELL_SIZE / 3.5,
						config.CELL_SIZE / 4,
					)
					.fill(skinColor)
					.stroke({ width: 2, color: 0x000000 }),
			);

			// Eyes
			const leftEye = headContainer.addChild(
				new PIXI.Graphics({ label: "Left Eye" })
					.circle(
						config.CELL_SIZE / 2 - config.CELL_SIZE / 16,
						config.CELL_SIZE / 4,
						config.CELL_SIZE / 24,
					)
					.fill(0x000000),
			);
			leftEye.position.set(0, 0);

			headContainer.addChild(
				new PIXI.Graphics({ label: "Right Eye" })
					.circle(
						config.CELL_SIZE / 2 + config.CELL_SIZE / 16,
						config.CELL_SIZE / 4,
						config.CELL_SIZE / 24,
					)
					.fill(0x000000),
			);

			const gunHeight = config.CELL_SIZE / 6;
			const gunWidth = config.CELL_SIZE;
			const gunStartX = config.CELL_SIZE / 2;
			const gunStartY = config.CELL_SIZE / 2;
			const gunGraphic = container.addChild(
				new PIXI.Graphics({ label: "Gun", visible: false })
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
					.stroke({ width: 2, color: 0x000000 }),
			);
			// Set pivot point to center for proper rotation
			gunGraphic.pivot.set(gunStartX, gunStartY);

			// Position relative to a container center
			gunGraphic.position.set(config.CELL_SIZE / 2, config.CELL_SIZE / 2);
			// gunGraphic.rotation = Pawn.DEFAULT_GUN_ROTATION;

			const BASE_GUN_RANGE = 5;
			const gunRadiusGraphic = container.addChild(
				new PIXI.Graphics({ alpha: 0.25, label: "Gun Radius" })
					.circle(
						config.CELL_SIZE / 2,
						config.CELL_SIZE / 2,
						config.CELL_SIZE * BASE_GUN_RANGE,
					)
					.stroke({ width: 2, color: 0xffffff }),
			);
			gunRadiusGraphic.visible = false;

			return container;
		};

		const create = (position: PositionLiteral, status: CombatStatus) =>
			Effect.gen(function* () {
				const container = makeBody(status);
				// const graphic = new PIXI.Graphics({ label: "pawn" })
				// 	.circle(
				// 		config.CELL_SIZE / 2,
				// 		config.CELL_SIZE / 2,
				// 		config.CELL_SIZE / 2,
				// 	)
				// 	.stroke({
				// 		color: status === "friendly" ? 0xffffff : 0xff0000,
				// 		width: 1,
				// 		alpha: 0.5,
				// 	});
				//
				// const container = new PIXI.Container({ label: "pawn container" });
				// container.addChild(graphic);

				const entity = yield* entityManager.createEntity();

				entity.addComponent(Components.Position(position));
				entity.addComponent(Components.Selectable({ isSelected: false }));
				entity.addComponent(Components.Graphics({ graphic: container }));
				entity.addComponent(
					Components.Movement({
						speed: config.pawn.baseMovementSpeed,
						path: [],
						currentPathIndex: 0,
						direction: MovementDirection.Down,
						isMoving: false,
						isWandering: true,
						pendingPath: [],
						currentStepIndex: 0,
					}),
				);

				entity.addComponent(
					Components.Health({ maxHealth: 100, currentHealth: 100 }),
				);
				entity.addComponent(Components.CombatStatus({ status }));

				// render layer
				entity.addComponent(Components.Objects());

				entity.addComponent(
					Components.Input({
						isPlayerControlled: status === "friendly",
						moveUp: "",
						moveDown: "",
						moveLeft: "",
						moveRight: "",
						action1: "",
					}),
				);

				if (status === "friendly") {
					entity.addComponent(
						Components.Draftable({
							isDrafted: false,
							fireAtWill: false,
						}),
					);
					entity.addComponent(
						Components.Weapon({
							isFiring: false,
							target: null,
							range: 6,
							damagePerHit: 10,
							hitPercentage: 0.7,
						}),
					);
				}

				// entity.addComponent(Components.Position(position))
				// entity.addComponent(Components.Graphics({graphic: container}))
				// entity.addComponent(Components.Objects())

				return entity;

				// const entity = yield* entityManager.createEntity([
				// 	Components.CombatStatus({ status }),
				// 	Components.Highlightable(),
				// 	Components.Selectable({
				// 		isSelected: false,
				// 		isDrafted: false,
				// 	}),
				// 	Components.Objects(),
				// 	Components.Health({
				// 		maxHealth: 100,
				// 		currentHealth: 100,
				// 	}),
				// 	Components.Position(position),
				// 	Components.Movement({
				// 		speed: config.pawn.baseMovementSpeed,
				// 		path: [],
				// 		currentPathIndex: 0,
				// 		direction: MovementDirection.Down,
				// 		isMoving: false,
				// 		isWandering: true,
				// 		pendingPath: [],
				// 		currentStepIndex: 0,
				// 	}),
				// 	Components.Weapon({
				// 		isFiring: false,
				// 		target: null,
				// 		range: 2,
				// 		damagePerHit: 10,
				// 		hitPercentage: 0.7,
				// 	}),
				// ]);
				//
				// if (status === "friendly") {
				// 	entity.addComponent(
				// 		Components.Input({
				// 			isPlayerControlled: false,
				// 			moveUp: "",
				// 			moveDown: "",
				// 			moveLeft: "",
				// 			moveRight: "",
				// 			action1: "",
				// 		}),
				// 	);
				// 	entity.addComponent(
				// 		Components.Draftable({ isDrafted: false, fireAtWill: true }),
				// 	);
				// 	// entity.addComponent(
				// 	// 	// Components.Graphics({
				// 	// 	// 	graphic: container,
				// 	// 	// 	// graphic: container
				// 	// 	// 	// graphic: new PIXI.Graphics({ label: "pawn" })
				// 	// 	// 	// 	.rect(0, 0, config.CELL_SIZE, config.CELL_SIZE)
				// 	// 	// 	// 	.fill("red"),
				// 	// 	// }),
				// 	// );
				// } else {
				// 	// entity.addComponent(
				// 	// 	// Components.Graphics({
				// 	// 	// 	graphic: container
				// 	// 	// }),
				// 	// );
				// }
				//
				//
				// const container = new PIXI.Container({label: 'pawn container'});
				// // console.log(container, graphic)
				//
				// container.addChild(
				// 	new PIXI.Graphics({ label: "pawn" })
				// 		.circle(
				// 			config.CELL_SIZE / 2,
				// 			config.CELL_SIZE / 2,
				// 			config.CELL_SIZE / 2,
				// 		)
				// 		.stroke({
				// 			color: 0xffffff,
				// 			width: 1,
				// 			alpha: 0.5,
				// 		}),
				// )
				//
				// // graphic.position.set(0, 0);
				// container.position.set(0, 0);
				// entity.addComponent(Components.Graphics({
				// 	graphic: container
				// }))
				//
				// return entity;
			});

		return { create } as const;
	}),
	accessors: true,
}) {}
