export const TILE_SIZE = 16;

export const GRAVITY = 900;
export const PLAYER_SPEED = 160;
export const JUMP_VELOCITY = -400;
export const JUMP_CUT_MULTIPLIER = 0.45;
export const COYOTE_TIME = 100;
export const JUMP_BUFFER = 100;
export const STOMP_BOUNCE = -280;

export const MAX_LIVES = 3;
export const STAR_SCORE = 100;
export const INVULN_TIME = 1500;

export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;

export const TILE = {
  EMPTY: 0,
  GRASS: 1,
  STONE: 2,
  SPIKE: 3,
};

export const LEVELS = [
  'level1', 'level2', 'level3', 'level4', 'level5',
  'level6', 'level7', 'level8', 'level9', 'level10',
];

export const LEVEL_META = [
  { name: 'First Steps', zone: 1, hint: 'Run and jump to the flag!' },
  { name: 'Gap Runner', zone: 1, hint: 'Time your jumps across wide gaps.' },
  { name: 'Spike Trail', zone: 1, hint: 'Avoid spikes — reach the checkpoint!' },
  { name: 'Drift Platforms', zone: 2, hint: 'Ride the drifting islands!' },
  { name: 'Double Jump', zone: 2, hint: 'Grab the sparkle — jump twice!' },
  { name: 'Wind Crossing', zone: 2, hint: 'Ride the drifters — time your jumps!' },
  { name: 'Wisp Hollow', zone: 3, hint: 'Stomp Wisps from above only!' },
  { name: 'Sky Fortress', zone: 3, hint: 'Pufflings and Wisps together.' },
  { name: 'Final Approach', zone: 3, hint: 'Platforms, Wisps, and spikes — all skills!' },
  { name: 'Sunset Summit', zone: 3, hint: 'Find the sparkle before the final climb!' },
];

export const ZONE_NAMES = ['', 'Sky Meadow', 'Storm Pass', 'Twilight Peaks'];
