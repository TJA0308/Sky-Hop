import { TILE } from '../../src/utils/constants.js';

export function entityIssues(level) {
  const issues = [];
  const solid = (x, y) => [TILE.GRASS, TILE.STONE].includes(level.tiles[y]?.[x]);
  const points = [
    ['spawn', level.spawn], ['goal', level.goal], ['checkpoint', level.checkpoint],
    ...level.stars.map(([x, y], i) => [`star ${i}`, { x, y }]),
    ...(level.powerUps || []).map((p, i) => [`power-up ${i}`, p]),
    ...level.enemies.map((p, i) => [`enemy ${i}`, p]),
  ];
  for (const [label, p] of points) {
    if (!p) continue;
    if (p.x < 0 || p.x >= level.width || p.y < 0 || p.y >= level.height) {
      issues.push(`${label} is outside the map`);
    } else if (solid(p.x, p.y)) {
      issues.push(`${label} is embedded in solid terrain at (${p.x},${p.y})`);
    }
  }
  for (const label of ['spawn', 'checkpoint']) {
    const p = level[label];
    if (p && ![1, 2, 3].some((dy) => solid(p.x, p.y + dy))) {
      issues.push(`${label} has no nearby landing surface`);
    }
  }
  for (const e of level.enemies.filter((e) => e.type !== 'wisp')) {
    for (let x = e.x; x <= e.x + e.patrol; x++) {
      if (!solid(x, e.y + 1) || solid(x, e.y)) {
        issues.push(`Puffling patrol leaves its surface at (${x},${e.y})`);
        break;
      }
    }
  }
  return issues;
}
