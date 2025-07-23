import { Array, Context, Effect, HashMap, Layer, type Option } from "effect";
import type { Component, ComponentTag } from "../components.ts";
import { Entity } from "./entity.ts";

export class EntityManager extends Context.Tag("EntityManager")<
	EntityManager,
	{
		createEntity: (components?: Component[]) => Effect.Effect<Entity>;
		removeEntity(id: number): Effect.Effect<void>;
		getEntity(id: number): Option.Option<Entity>;
		getAllEntities: Effect.Effect<Entity[]>;
		getAllEntitiesWithComponents(
			types: ComponentTag[],
		): Effect.Effect<Entity[]>;
	}
>() {}

export type IEntityManager = (typeof EntityManager)["Service"];

const makeEntityManager = Effect.gen(function* () {
	let nextEntityId = 0;
	let entities = HashMap.make<ReadonlyArray<[number, Entity]>>();

	const createEntity = (components?: Component[]) =>
		Effect.sync(() => {
			const id = nextEntityId++;
			const entity = new Entity({ id });
			if (components) {
				entity.addComponents(components);
			}
			entities = HashMap.set(entities, id, entity);
			return entity;
		});

	const removeEntity = (id: number) =>
		Effect.sync(() => {
			entities = HashMap.remove(entities, id);
		});

	const getEntity = (id: number) => HashMap.get(entities, id);

	const getAllEntities = Effect.sync(() =>
		Array.fromIterable(HashMap.values(entities)),
	);

	const getAllEntitiesWithComponents = (types: ComponentTag[]) =>
		Effect.sync(() =>
			Array.fromIterable(
				HashMap.values(
					HashMap.filter(entities, (entity) =>
						types.every((type) => entity.hasComponent(type)),
					),
				),
			),
		);

	return {
		createEntity,
		removeEntity,
		getEntity,
		getAllEntities,
		getAllEntitiesWithComponents,
	} as const;
});

export const EntityManagerLive = Layer.effect(EntityManager, makeEntityManager);
