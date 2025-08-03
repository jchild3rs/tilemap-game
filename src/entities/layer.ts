import { Layer } from "effect";
import { MountainEntity } from "./mountain.ts";
import { PersonEntity } from "./person.ts";
import { WallEntity } from "./wall.ts";
import { WaterEntity } from "./water.ts";

export const EntityLayer = Layer.mergeAll(
	WallEntity.Default,
	WaterEntity.Default,
	PersonEntity.Default,
	MountainEntity.Default,
);
