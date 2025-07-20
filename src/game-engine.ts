import { Viewport } from "pixi-viewport";
import { type Application, Graphics } from "pixi.js";
import { ObjectsComponent } from "./components/objects.ts";
import type { PositionLiteral, System } from "./types.ts";

import { GraphicsComponent } from "./components/graphics.ts";
import { GroundComponent } from "./components/ground.ts";
import { HealthComponent } from "./components/health.ts";
import { MovementComponent } from "./components/movement.ts";
import { PositionComponent } from "./components/position.ts";
import { SelectableComponent } from "./components/selectable.ts";
import { GameConfig } from "./config.ts";
import { type Entity, EntityManager } from "./entity-manager.ts";
import { MapFactory } from "./factories/map-factory.ts";
import { TileFactory } from "./factories/tile-factory.ts";
import { MapService } from "./services/map-service.ts";
import { FlowFieldSystem } from "./systems/flow-field-system.ts";
import { PathfindingSystem } from "./systems/pathfinding-system.ts";
import { PositionConversionSystem } from "./systems/position-conversion-system.ts";
// import type { TilemapRenderSystem } from "./systems/tilemap-render-system.ts";
import { SelectionSystem } from "./systems/selection.ts";
import { RenderSystem } from "./systems/render.ts";
import { MovementSystem } from "./systems/movement.ts";

export class GameEngine {
	private entityManager = new EntityManager();
	private readonly systems: System[] = [];
	private config = GameConfig.getInstance();
	private readonly viewport: Viewport;

	// Systems
	// private readonly tilemapRenderSystem: TilemapRenderSystem;
	private readonly pathfindingSystem: PathfindingSystem;
	private readonly positionConversionSystem: PositionConversionSystem;
	private readonly flowFieldSystem: FlowFieldSystem;

	// Factories
	private readonly tileFactory: TileFactory;
	private mapFactory: MapFactory;

	// Services
	private mapService: MapService;

	constructor(private readonly app: Application) {
		this.viewport = this.app.stage.addChild(
			new Viewport({
				screenWidth: window.innerWidth,
				screenHeight: window.innerHeight,
				worldWidth: this.config.worldSize.width,
				worldHeight: this.config.worldSize.height,
				passiveWheel: false,
				events: this.app.renderer.events,
				ticker: this.app.ticker,
				allowPreserveDragOutside: true,
			}),
		);
		// this.app.stage.label = 'Stage';
		// this.viewport.label = 'Viewport';

		this.viewport
			.drag()
			.pinch()
			.wheel()
			.zoom(0, true)
			// .clampZoom({
			// 	minScale: this.config.zoom.min,
			// 	maxScale: this.config.zoom.max,
			// })
			.decelerate()
			.fitWorld()
			.moveCenter(this.config.worldSize.width / 2, this.config.worldSize.height / 2);

		// Create factories
		this.tileFactory = new TileFactory(this.entityManager);
		this.mapFactory = new MapFactory(
			this.entityManager,
			this.tileFactory,
		);


		// Initialize the map
		this.initializeMap();
		// Create systems
		// this.tilemapRenderSystem = new TilemapRenderSystem(
		// 	this.entityManager,
		// 	this.config,
		// );
		this.pathfindingSystem = new PathfindingSystem(this.entityManager);
		this.positionConversionSystem = new PositionConversionSystem(
			this.entityManager,
		);
		this.flowFieldSystem = new FlowFieldSystem(
			this.entityManager,
			this.pathfindingSystem,
		);

		// Add systems to update loop
		this.systems = [
			// Other systems...
			new RenderSystem(this.entityManager, app, this.viewport),
			// this.tilemapRenderSystem,
			new MovementSystem(this.entityManager),
			new SelectionSystem(this.entityManager),
			// More systems...
		];

		// Create services
		this.mapService = new MapService(
			this.entityManager,
			this.pathfindingSystem,
			this.positionConversionSystem,
			this.flowFieldSystem,
		);
		//
		//
		// // Initialize systems
		// this.systems.push(new MovementSystem(this.entityManager));
		// this.systems.push(new RenderSystem(this.entityManager, app));
		// this.systems.push(new SelectionSystem(this.entityManager));

		// Set up game loop
		this.app.ticker.add((time) => {
			this.update(time.deltaTime);
		});
	}

	private initializeMap(): void {
		// Create the map entity with all its tiles
		this.mapFactory.createMap();
	}

	// Facade methods to expose map functionality
	findPath(start: PositionLiteral, end: PositionLiteral): number[][] {
		return this.mapService.findPath(start, end);
	}

	randomGridPosition(type: string = "unknown"): PositionLiteral {
		return this.mapService.randomGridPosition(type);
	}

	getTileAtPosition(position: PositionLiteral): Entity | undefined {
		return this.mapService.getTileAtPosition(position);
	}

	update(deltaTime: number): void {
		// console.log({ deltaTime })

		// Update all systems
		for (const system of this.systems) {
			system.update?.(deltaTime);
		}
	}

	createPawn(x: number, y: number): Entity {
		const entity = this.entityManager.createEntity();

		// Add components
		entity.addComponent(new PositionComponent(x, y));
		entity.addComponent(new GraphicsComponent(new Graphics({ label: "pawn" }).rect(0,0,this.config.CELL_SIZE,this.config.CELL_SIZE).fill('red')));
		entity.addComponent(new HealthComponent(100, 100));
		entity.addComponent(new MovementComponent(1.0));
		entity.addComponent(new SelectableComponent());
		entity.addComponent(new ObjectsComponent());

		return entity;
	}
}
