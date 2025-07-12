export const clamp = (min: number, max: number, value: number) =>
	Math.min(max, Math.max(min, value));

// Helper function to interpolate between colors (lerp = "linear interpolation")
export const lerpColor = (color1: number, color2: number, t: number): number => {
	const r1 = (color1 >> 16) & 0xff;
	const g1 = (color1 >> 8) & 0xff;
	const b1 = color1 & 0xff;

	const r2 = (color2 >> 16) & 0xff;
	const g2 = (color2 >> 8) & 0xff;
	const b2 = color2 & 0xff;

	const r = Math.round(r1 + (r2 - r1) * t);
	const g = Math.round(g1 + (g2 - g1) * t);
	const b = Math.round(b1 + (b2 - b1) * t);

	return (r << 16) | (g << 8) | b;
};
