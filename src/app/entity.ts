import { Data, HashMap, Option } from "effect";
import type {
	Component,
	ComponentForTag,
	ComponentTag,
} from "../components.ts";

export class Entity extends Data.Class<{
	readonly id: number;
}> {
	private components = HashMap.make<ReadonlyArray<[ComponentTag, Component]>>();

	hasComponent(tag: ComponentTag) {
		return HashMap.has(this.components, tag);
	}

	getComponent<T extends ComponentTag>(tag: T) {
		return Option.getOrThrow(
			HashMap.get(this.components, tag) as Option.Option<ComponentForTag<T>>,
		);
	}

	addComponent<T extends Component>(component: T) {
		this.components = HashMap.set(this.components, component._tag, component);
	}

	addComponents(components: Component[]) {
		for (const component of components) {
			this.addComponent(component);
		}
	}

	removeComponent(tag: ComponentTag) {
		this.components = HashMap.remove(this.components, tag);
	}
}
