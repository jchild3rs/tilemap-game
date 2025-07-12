/**
 * Viewport width in cells
 */
export const WORLD_WIDTH = 24;

/**
 * Viewport height in cells
 */
export const WORLD_HEIGHT = 24;

/**
 * Cell size in pixels
 */
export const CELL_SIZE = 32;

/**
 * Game speed percentage
 */
export const GAME_SPEED_SLOW = 0.5;
export const GAME_SPEED_NORMAL = 1;
export const GAME_SPEED_FAST = 2;

/**
 * Represents the size of the world in terms of its width and height dimensions.
 * The dimensions are calculated by multiplying the respective constants for
 * world width and height by the size of a single cell.
 *
 * @constant {Object} WORLD_SIZE
 * @property {number} width - The total width of the world.
 * @property {number} height - The total height of the world.
 */
export const VIEWPORT_WIDTH = 1000;
export const VIEWPORT_HEIGHT = 1000;
export const WORLD_SIZE = {
	width: WORLD_WIDTH * CELL_SIZE,
	height: WORLD_HEIGHT * CELL_SIZE,
} as const;

/**
 * Represents the minimum allowable zoom scale factor.
 * This value determines the smallest scale limit at which
 * zooming is permitted within the application or interface.
 *
 * @constant {number} MIN_ZOOM_SCALE
 * @default 0.9
 */
export const MIN_ZOOM_SCALE = 0.9;

/**
 * Represents the maximum zoom scale allowed for an element or functionality.
 * The value defines the upper limit to which a zooming operation can scale
 * an object or content. It is used to restrict zooming beyond a particular limit.
 *
 * @constant {number} MAX_ZOOM_SCALE
 * @default 2
 */
export const MAX_ZOOM_SCALE = 2;
