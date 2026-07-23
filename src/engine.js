(function (root) {
  "use strict";

  const DIRECTIONS = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 }
  ];

  function key(x, y) {
    return `${x},${y}`;
  }

  function createRng(seed) {
    let value = (Number(seed) >>> 0) || 0x7f4a7c15;
    return function random() {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function randomInt(random, min, max) {
    return min + Math.floor(random() * (max - min + 1));
  }

  function roomCenter(room) {
    return {
      x: room.x + Math.floor(room.w / 2),
      y: room.y + Math.floor(room.h / 2)
    };
  }

  function roomsOverlap(a, b, padding) {
    return !(
      a.x + a.w + padding <= b.x ||
      b.x + b.w + padding <= a.x ||
      a.y + a.h + padding <= b.y ||
      b.y + b.h + padding <= a.y
    );
  }

  function carveRoom(grid, room) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        grid[y][x] = 1;
      }
    }
  }

  function carveCorridor(grid, from, to, horizontalFirst) {
    let x = from.x;
    let y = from.y;

    function carve(xPos, yPos) {
      if (grid[yPos]?.[xPos] !== undefined) grid[yPos][xPos] = 1;
    }

    carve(x, y);
    const axes = horizontalFirst ? ["x", "y"] : ["y", "x"];
    for (const axis of axes) {
      const target = axis === "x" ? to.x : to.y;
      while ((axis === "x" ? x : y) !== target) {
        if (axis === "x") x += Math.sign(target - x);
        else y += Math.sign(target - y);
        carve(x, y);
      }
    }
  }

  function buildFallbackRooms(grid) {
    const rooms = [
      { x: 2, y: 3, w: 6, h: 6 },
      { x: 11, y: 2, w: 6, h: 5 },
      { x: 18, y: 8, w: 6, h: 6 },
      { x: 10, y: 12, w: 7, h: 6 },
      { x: 3, y: 19, w: 6, h: 5 },
      { x: 18, y: 20, w: 6, h: 5 }
    ];
    for (const row of grid) row.fill(0);
    for (const room of rooms) carveRoom(grid, room);
    return rooms;
  }

  function floorCellsInRoom(grid, room) {
    const cells = [];
    for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
      for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
        if (grid[y][x] === 1) cells.push({ x, y });
      }
    }
    return cells;
  }

  function chooseFreeCell(random, cells, occupied) {
    const available = cells.filter(cell => !occupied.has(key(cell.x, cell.y)));
    if (!available.length) return null;
    return available[Math.floor(random() * available.length)];
  }

  function manhattan(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  function normalizeBlocked(blocked) {
    if (blocked instanceof Set) return blocked;
    const items = blocked && typeof blocked[Symbol.iterator] === "function" ? [...blocked] : [];
    return new Set(items.map(item => typeof item === "string" ? item : key(item.x, item.y)));
  }

  function getNeighbors(grid, point, blocked) {
    const blockedSet = normalizeBlocked(blocked);
    return DIRECTIONS
      .map(direction => ({ x: point.x + direction.x, y: point.y + direction.y }))
      .filter(next => grid[next.y]?.[next.x] === 1 && !blockedSet.has(key(next.x, next.y)));
  }

  function findPath(grid, start, goal, blocked) {
    const startKey = key(start.x, start.y);
    const goalKey = key(goal.x, goal.y);
    const blockedSet = normalizeBlocked(blocked);
    blockedSet.delete(startKey);
    blockedSet.delete(goalKey);

    const queue = [{ x: start.x, y: start.y }];
    const cameFrom = new Map([[startKey, null]]);
    let head = 0;

    while (head < queue.length) {
      const current = queue[head++];
      const currentKey = key(current.x, current.y);
      if (currentKey === goalKey) break;
      for (const next of getNeighbors(grid, current, blockedSet)) {
        const nextKey = key(next.x, next.y);
        if (cameFrom.has(nextKey)) continue;
        cameFrom.set(nextKey, currentKey);
        queue.push(next);
      }
    }

    if (!cameFrom.has(goalKey)) return [];
    const path = [];
    let cursor = goalKey;
    while (cursor) {
      const [x, y] = cursor.split(",").map(Number);
      path.push({ x, y });
      cursor = cameFrom.get(cursor);
    }
    return path.reverse();
  }

  function lineOfSight(grid, from, to, blocked) {
    const blockedSet = normalizeBlocked(blocked);
    let x0 = from.x;
    let y0 = from.y;
    const x1 = to.x;
    const y1 = to.y;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let error = dx - dy;

    while (!(x0 === x1 && y0 === y1)) {
      const twice = error * 2;
      if (twice > -dy) {
        error -= dy;
        x0 += sx;
      }
      if (twice < dx) {
        error += dx;
        y0 += sy;
      }
      if (x0 === x1 && y0 === y1) return true;
      if (grid[y0]?.[x0] !== 1 || blockedSet.has(key(x0, y0))) return false;
    }
    return true;
  }

  function generateFloor(options) {
    const settings = options || {};
    const size = settings.size || 27;
    const floor = Math.max(1, settings.floor || 1);
    const sideMission = Boolean(settings.sideMission);
    const seed = (settings.seed || 1) + floor * 7919 + (sideMission ? 31337 : 0);
    const random = createRng(seed);
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    const targetRooms = Math.min(9, (sideMission ? 5 : 6) + Math.floor(floor / 2));
    let rooms = [];

    for (let attempt = 0; attempt < 240 && rooms.length < targetRooms; attempt++) {
      const room = {
        x: randomInt(random, 2, size - 9),
        y: randomInt(random, 2, size - 9),
        w: randomInt(random, 4, 7),
        h: randomInt(random, 4, 7)
      };
      if (room.x + room.w >= size - 1 || room.y + room.h >= size - 1) continue;
      if (rooms.some(existing => roomsOverlap(room, existing, 1))) continue;
      rooms.push(room);
      carveRoom(grid, room);
    }

    if (rooms.length < 5) rooms = buildFallbackRooms(grid);

    for (let index = 1; index < rooms.length; index++) {
      const current = roomCenter(rooms[index]);
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      for (let candidate = 0; candidate < index; candidate++) {
        const distance = manhattan(current, roomCenter(rooms[candidate]));
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = candidate;
        }
      }
      carveCorridor(grid, current, roomCenter(rooms[nearestIndex]), random() > 0.5);
    }

    const start = roomCenter(rooms[0]);
    const exit = roomCenter(rooms[rooms.length - 1]);
    const reservedPath = new Set(findPath(grid, start, exit).map(cell => key(cell.x, cell.y)));
    const occupied = new Set([key(start.x, start.y), key(exit.x, exit.y)]);
    const covers = [];

    for (let index = 1; index < rooms.length; index++) {
      const cells = floorCellsInRoom(grid, rooms[index])
        .filter(cell => !reservedPath.has(key(cell.x, cell.y)));
      const coverCount = random() < 0.55 ? 1 : 2;
      for (let count = 0; count < coverCount; count++) {
        const cell = chooseFreeCell(random, cells, occupied);
        if (!cell) break;
        occupied.add(key(cell.x, cell.y));
        covers.push(cell);
      }
    }

    const spawnPoints = [];
    const pickupPoints = [];
    for (let index = 1; index < rooms.length; index++) {
      const cells = floorCellsInRoom(grid, rooms[index]);
      const enemyCount = 1 + (floor >= 3 && random() < 0.58 ? 1 : 0);
      for (let count = 0; count < enemyCount; count++) {
        const cell = chooseFreeCell(random, cells, occupied);
        if (!cell) break;
        occupied.add(key(cell.x, cell.y));
        spawnPoints.push(cell);
      }
      if (index % 2 === 0 || random() < 0.35) {
        const cell = chooseFreeCell(random, cells, occupied);
        if (cell) {
          occupied.add(key(cell.x, cell.y));
          pickupPoints.push(cell);
        }
      }
    }

    return {
      seed,
      size,
      grid,
      rooms,
      start,
      exit,
      covers,
      spawnPoints,
      pickupPoints
    };
  }

  root.RiftEngine = Object.freeze({
    DIRECTIONS,
    createRng,
    findPath,
    generateFloor,
    getNeighbors,
    key,
    lineOfSight,
    manhattan
  });
})(typeof window !== "undefined" ? window : globalThis);
