import type { Viewport } from "pixi-viewport";
import { type Application, Container } from "pixi.js";
import type { GraphicsComponent } from "../components/graphics.ts";
import type { PositionComponent } from "../components/position.ts";
import { GameConfig } from "../config.ts";
import type { EntityManager } from "../entity-manager.ts";
import type { System } from "../types.ts";

export class RenderSystem implements System {
	private config = GameConfig.getInstance();

	constructor(
		private entityManager: EntityManager,
		private app: Application, // PIXI.js app
		private viewport: Viewport,
	) {
		// Create container layers for different rendering priorities
		this.createRenderLayers();
	}

	private layers = {
		groundLayer: new Container({ label: "Ground" }),
		objectLayer: new Container({ label: "Objects" }),
		effectsLayer: new Container({ label: "Effects" }),
		uiLayer: new Container({ label: "UI" }),
	};

	private createRenderLayers() {
		// Create different containers for rendering order
		// Add layers to viewport in order
		this.viewport.addChild(
			this.layers.groundLayer,
			this.layers.objectLayer,
			this.layers.effectsLayer,
		);
		// UI layer added directly to stage (not affected by viewport)
		this.app.stage.addChild(this.layers.uiLayer);
	}

	update(_deltaTime: number): void {
		// Clear previous frame if needed

		// Render ground tiles
		this.renderGround();

		// Render game objects (pawns, trees, etc.)
		this.renderGameObjects();

		// Render effects (particles, highlights)
		this.renderEffects();

		// Render in-game UI elements (health bars, selection indicators)
		this.renderGameUI();
	}

	private renderGround() {
		// const entities = this.entityManager
		// 	.getAllEntities()
		// 	.filter(
		// 		(entity) =>
		// 			entity.hasComponent('Position') &&
		// 			entity.hasComponent('Ground') &&
		// 			entity.hasComponent('Graphics'),
		// 	);
		const entities = this.entityManager.getAllEntitiesWithComponents([
			"Ground",
			"Position",
			"Graphics",
		]);

		// console.log('renderGround', entities)

		for (const entity of entities) {
			const position = entity.getComponent<PositionComponent>("Position");
			const graphics = entity.getComponent<GraphicsComponent>("Graphics");

			// Update graphic position based on position component
			graphics.graphic.x = position.x * this.config.CELL_SIZE;
			graphics.graphic.y = position.y * this.config.CELL_SIZE;

			// Ensure the graphic is in the correct layer
			if (graphics.graphic.parent !== this.layers.groundLayer) {
				this.layers.groundLayer.addChild(graphics.graphic);
			}
		}
	}

	private renderGameObjects() {
		const entities = this.entityManager.getAllEntitiesWithComponents([
			"Objects",
			"Position",
			"Graphics",
		]);
		// console.log({ entities })

		for (const entity of entities) {
			const position = entity.getComponent<PositionComponent>("Position");
			const graphics = entity.getComponent<GraphicsComponent>("Graphics");

			// Update graphic position based on position component
			graphics.graphic.x = position.x * this.config.CELL_SIZE;
			graphics.graphic.y = position.y * this.config.CELL_SIZE;
			// console.log(graphics.graphic)

			// Ensure the graphic is in the correct layer
			if (graphics.graphic.parent !== this.layers.groundLayer) {
				this.layers.objectLayer.addChild(graphics.graphic);
			}
		}
	}

	private renderEffects() {
		// Render particle effects, highlights, etc.
		// Use effectsLayer
	}

	private renderGameUI() {
		// Render in-game UI elements like health bars
		// These are PIXI elements that follow game objects
		// Use uiLayer
	}
}
