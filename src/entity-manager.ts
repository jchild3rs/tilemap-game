import type { Component } from "./types.ts";

export class EntityManager {
	private nextEntityId = 0;
	private entities = new Map<number, Entity>();

	createEntity(): Entity {
		const id = this.nextEntityId++;
		const entity = new Entity(id);
		this.entities.set(id, entity);
		return entity;
	}

	removeEntity(id: number): void {
		this.entities.delete(id);
	}

	getEntity(id: number): Entity | undefined {
		return this.entities.get(id);
	}

	getAllEntities(): Entity[] {
		return Array.from(this.entities.values());
	}

	getAllEntitiesWithComponents(types: string[]): Entity[] {
		return this.getAllEntities().filter((entity) =>
			types.every((type) => entity.hasComponent(type)),
		);
	}
}

export class Entity {
	private components = new Map<string, Component>();

	constructor(public readonly id: number) {}

	addComponent<T extends Component>(component: T): this {
		this.components.set(component.type, component);
		return this;
	}

	removeComponent(type: string): boolean {
		return this.components.delete(type);
	}

	getComponent<T extends Component>(type: string): T {
		return this.components.get(type) as T;
	}

	hasComponent(type: string): boolean {
		return this.components.has(type);
	}
}
