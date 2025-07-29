import type { PositionLiteral } from "./types.ts";

export function clamp(min: number, max: number, value: number): number {
	return Math.max(min, Math.min(max, value));
}

export function getGridLinePoints(
	start: PositionLiteral,
	end: PositionLiteral,
): number[][] {
	const points: number[][] = [];

	const xDiff = Math.abs(end.x - start.x);
	const yDiff = Math.abs(end.y - start.y);
	const x = start.x < end.x ? 1 : -1;
	const y = start.y < end.y ? 1 : -1;
	let err = xDiff - yDiff;
	while (true) {
		points.push([start.x, start.y]);
		if (start.x === end.x && start.y === end.y) break;
		const e2 = 2 * err;
		if (e2 > -yDiff) {
			err -= yDiff;
			start.x += x;
		}
		if (e2 < xDiff) {
			err += xDiff;
			start.y += y;
		}
	}

	return points;
}

export const findClosestPosition = (
	current: PositionLiteral,
	targets: PositionLiteral[],
) => {
	let closest:
		| (PositionLiteral & {
				distance: number;
		  })
		| undefined;

	for (const target of targets) {
		const distance = Math.sqrt(
			(target.x - current.x) ** 2 + (target.y - current.y) ** 2,
		);

		if (!closest || distance < closest.distance) {
			closest = {
				x: target.x,
				y: target.y,
				distance,
			};
		}
	}

	return closest;
};
