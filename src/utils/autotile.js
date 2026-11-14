import { TILE } from './constants.js';

/**
 * Picks which tileset frame to draw for a level cell, based on its solid
 * neighbours, so islands get rounded caps and carved undersides instead of
 * every tile looking identical. Level data stays three plain tile types.
 *
 * Tileset frame layout (16px each):
 *   0 grass   1 stone   2 spike   3 (flag, unused by maps)
 *   4-6   grass  left cap / right cap / single
 *   7-9   stone  left edge / right edge / single
 *   10-13 stone with open air below: middle / left / right / single
 */
export const FRAME = { GRASS: 0, STONE: 1, SPIKE: 2 };

const GRASS_FRAMES = [0, 4, 5, 6];
const STONE_FRAMES = [1, 7, 8, 9];
const STONE_BOTTOM_FRAMES = [10, 11, 12, 13];

export const SOLID_FRAMES = [...GRASS_FRAMES, ...STONE_FRAMES, ...STONE_BOTTOM_FRAMES];

export function isSolidTile(tile) {
  return tile === TILE.GRASS || tile === TILE.STONE;
}

/** Frame index for the cell at (x, y), or -1 for empty space. */
export function frameFor(tiles, x, y) {
  const tile = tiles[y]?.[x];
  if (tile === TILE.SPIKE) return FRAME.SPIKE;
  if (!isSolidTile(tile)) return -1;

  const width = tiles[y].length;
  // Beyond the left/right map edge counts as solid, so ground running off the
  // level looks like it continues rather than ending in a rounded cap.
  const solidAt = (cx, cy) => (cx < 0 || cx >= width ? true : isSolidTile(tiles[cy]?.[cx]));

  const openLeft = !solidAt(x - 1, y);
  const openRight = !solidAt(x + 1, y);
  const edge = openLeft && openRight ? 3 : openLeft ? 1 : openRight ? 2 : 0;

  if (tile === TILE.GRASS) return GRASS_FRAMES[edge];
  return solidAt(x, y + 1) ? STONE_FRAMES[edge] : STONE_BOTTOM_FRAMES[edge];
}

/**
 * Runs of underside cells (solid with open air below), used to hang tapered
 * rock beneath each island. Returns [{ xStart, xEnd, y }] in tile units.
 */
export function undersideRuns(tiles) {
  const runs = [];
  for (let y = 0; y < tiles.length; y++) {
    let run = null;
    for (let x = 0; x <= tiles[y].length; x++) {
      const open = x < tiles[y].length && isSolidTile(tiles[y][x]) && !isSolidTile(tiles[y + 1]?.[x]);
      if (open) {
        if (run) run.xEnd = x;
        else run = { xStart: x, xEnd: x, y };
      } else if (run) {
        runs.push(run);
        run = null;
      }
    }
  }
  return runs;
}
