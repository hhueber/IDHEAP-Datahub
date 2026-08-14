/**
 * Visual constants for the 3D choropleth mode.
 * Centralised here so they can be tuned without hunting through component code.
 */

/** Pitch angle (degrees) applied automatically when entering 3D mode. */
export const PITCH_3D = 40;

/** Bearing when entering 3D mode. 0 = north-up. */
export const BEARING_3D = 0;

/**
 * Maximum extrusion height in metres for the highest data value.
 * At zoom 8 (Switzerland overview) with pitch 40°, 50 000 m produces a
 * readable relief without the extrusion dominating the choropleth colour.
 */
export const MAX_ELEVATION = 50_000;

/**
 * When the user tilts the view below this pitch (degrees), the map
 * automatically reverts to 2D mode.
 */
export const PITCH_2D_THRESHOLD = 5;

/**
 * Hard ceiling on the pitch the MapController will allow during drag-rotate.
 * Deck.gl default is 60°; keeping it there is fine for a first prototype.
 */
export const MAX_PITCH_3D = 60;

/**
 * Background colour for the 3D canvas (shown behind polygons and below the horizon).
 * Dark navy gives contrast with the choropleth fill colours.
 */
export const BACKGROUND_3D = '#0d1117';
