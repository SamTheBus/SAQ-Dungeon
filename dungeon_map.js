/* ==========================================================================
   PRIMARY PURPOSE: Top-Down Procedural Dungeon Map Generator (BSP),
   Topological Path Solver for Extraction Points, and Frustum-Culled Tile Renderer.
   ========================================================================= */

(function () {
  class DungeonMapGenerator {
    constructor() {
      this.reset();
    }

    reset() {
      this.depth = 1;
      this.width = window.DUNGEON_CONFIG.BASE_WIDTH;
      this.height = window.DUNGEON_CONFIG.BASE_HEIGHT;
      this.tileSize = window.DUNGEON_CONFIG.TILE_SIZE;
      this.grid = [];
      this.exploredGrid = [];
      this.rooms = [];
      this.spawnTile = { x: 0, y: 0 };
      this.extractionTile = { x: 0, y: 0 };
      this.chests = [];
      this.mobSpawns = [];
      this.breakables = [];
      this.stations = [];
      this.torches = [];
      this.shrooms = [];
      this.portalDiscovered = false;
      this.spawnRoomId = null;
      this.needsPreRender = true;
      this.preRenderCanvas = null;
    }

    getGridDimensions(depth) {
      let d = Math.max(1, Number(depth) || 1);
      let width = Math.min(
        100,
        Math.floor(window.DUNGEON_CONFIG.BASE_WIDTH + 1.5 * Math.sqrt(d)),
      );
      let height = Math.min(
        60,
        Math.floor(window.DUNGEON_CONFIG.BASE_HEIGHT + 1.0 * Math.sqrt(d)),
      );
      return { width, height };
    }

    generateHub() {
      this.reset();
      this.width = 25;
      this.height = 17;

      this.grid = Array.from({ length: this.height }, () =>
        Array(this.width).fill(window.TILE_TYPES.WALL),
      );
      this.exploredGrid = Array.from({ length: this.height }, () =>
        Array(this.width).fill(true),
      );

      for (let y = 2; y < this.height - 2; y++) {
        for (let x = 2; x < this.width - 2; x++) {
          this.grid[y][x] = window.TILE_TYPES.FLOOR;
        }
      }

      let cx = Math.floor(this.width / 2); // 12
      let cy = Math.floor(this.height / 2); // 8

      this.spawnTile = { x: cx, y: cy };
      this.grid[cy][cx] = window.TILE_TYPES.SPAWN_PLAYER;

      this.stations = [
        {
          type: window.TILE_TYPES.STATION_PORTAL,
          label: "DUNGEON PORTAL",
          x: cx,
          y: 4,
        },
        {
          type: window.TILE_TYPES.STATION_FORGE,
          label: "BLACKSMITH FORGE",
          x: 5,
          y: cy,
        },
        {
          type: window.TILE_TYPES.STATION_SHOP,
          label: "MERCHANT MARKET",
          x: 5,
          y: 12,
        },
        {
          type: window.TILE_TYPES.STATION_ENCHANT,
          label: "CELESTIAL ALTAR",
          x: cx,
          y: 12,
        },
        {
          type: window.TILE_TYPES.STATION_INN,
          label: "RECOVERY INN",
          x: 19,
          y: cy,
        },
        {
          type: window.TILE_TYPES.STATION_GACHAPON,
          label: "GACHAPON VENDING",
          x: 19,
          y: 12,
        },
      ];

      this.stations.forEach((st) => {
        if (this.grid[st.y] && this.grid[st.y][st.x] !== undefined) {
          this.grid[st.y][st.x] = st.type;
        }
      });

      // Symmetric perimeter wall sconces
      this.torches = [
        { x: 3, y: 1 },
        { x: 7, y: 1 },
        { x: 12, y: 1 },
        { x: 17, y: 1 },
        { x: 21, y: 1 },
        { x: 3, y: 15 },
        { x: 7, y: 15 },
        { x: 12, y: 15 },
        { x: 17, y: 15 },
        { x: 21, y: 15 },
        { x: 1, y: 4 },
        { x: 1, y: 8 },
        { x: 1, y: 12 },
        { x: 23, y: 4 },
        { x: 23, y: 8 },
        { x: 23, y: 12 },
      ];

      return this;
    }

    generateBossArena() {
          this.reset();
          this.depth = 4;
          this.width = 24;
          this.height = 18;

      this.grid = Array.from({ length: this.height }, () =>
        Array(this.width).fill(window.TILE_TYPES.WALL),
      );
      this.exploredGrid = Array.from({ length: this.height }, () =>
        Array(this.width).fill(true),
      );

      for (let y = 2; y < this.height - 2; y++) {
        for (let x = 2; x < this.width - 2; x++) {
          this.grid[y][x] = window.TILE_TYPES.FLOOR;
        }
      }

      let cx = Math.floor(this.width / 2);

      this.spawnTile = { x: cx, y: this.height - 4 };
      this.grid[this.spawnTile.y][this.spawnTile.x] =
        window.TILE_TYPES.SPAWN_PLAYER;

      this.chests = [];
      this.mobSpawns = [];

      // Check if Recovery Chest belongs on this Boss Floor
      let rec = window.playerStats && window.playerStats.recoveryLoot;
      if (
        rec &&
        rec.floor === this.depth &&
        rec.items &&
        rec.items.length > 0
      ) {
        let rcX = cx - 4;
        let rcY = 3;
        this.grid[rcY][rcX] = window.TILE_TYPES.RECOVERY_CHEST;
      }

      return this;
    }

    generate(depth) {
      this.reset();
      this.depth = depth || 1;

      let dims = this.getGridDimensions(depth);
      this.width = dims.width;
      this.height = dims.height;

      this.grid = Array.from({ length: this.height }, () =>
        Array(this.width).fill(window.TILE_TYPES.VOID),
      );
      this.exploredGrid = Array.from({ length: this.height }, () =>
        Array(this.width).fill(false),
      );

      let rootNode = {
        x: 1,
        y: 1,
        w: this.width - 2,
        h: this.height - 2,
        left: null,
        right: null,
      };

      let leaves = [];
      this.splitBSP(rootNode, leaves, 0, 4);

      leaves.forEach((leaf, idx) => {
        let roomW = window.randInt(
          window.DUNGEON_CONFIG.MIN_ROOM_SIZE,
          Math.min(window.DUNGEON_CONFIG.MAX_ROOM_SIZE, leaf.w - 2),
        );
        let roomH = window.randInt(
          window.DUNGEON_CONFIG.MIN_ROOM_SIZE,
          Math.min(window.DUNGEON_CONFIG.MAX_ROOM_SIZE, leaf.h - 2),
        );
        let roomX = window.randInt(leaf.x + 1, leaf.x + leaf.w - roomW - 1);
        let roomY = window.randInt(leaf.y + 1, leaf.y + leaf.h - roomH - 1);

        let room = {
          id: idx,
          x: roomX,
          y: roomY,
          w: roomW,
          h: roomH,
          cx: Math.floor(roomX + roomW / 2),
          cy: Math.floor(roomY + roomH / 2),
        };

        this.rooms.push(room);
        this.carveRoom(room);
      });

      let connected = new Set([0]);
      let unconnected = new Set(this.rooms.map((_, i) => i).slice(1));

      while (unconnected.size > 0) {
        let bestDist = Infinity;
        let bestA = null;
        let bestB = null;

        connected.forEach((aIdx) => {
          let rA = this.rooms[aIdx];
          unconnected.forEach((bIdx) => {
            let rB = this.rooms[bIdx];
            let dist = Math.hypot(rA.cx - rB.cx, rA.cy - rB.cy);
            if (dist < bestDist) {
              bestDist = dist;
              bestA = rA;
              bestB = rB;
            }
          });
        });

        if (bestA && bestB) {
          this.connectRooms(bestA, bestB);
          connected.add(bestB.id);
          unconnected.delete(bestB.id);
        } else {
          break;
        }
      }

      for (let i = 0; i < this.rooms.length; i++) {
        for (let j = i + 1; j < this.rooms.length; j++) {
          let dist = Math.hypot(
            this.rooms[i].cx - this.rooms[j].cx,
            this.rooms[i].cy - this.rooms[j].cy,
          );
          if (dist < 18 && Math.random() < 0.25) {
            this.connectRooms(this.rooms[i], this.rooms[j]);
          }
        }
      }

      this.buildWalls();
      this.placeSpawnAndExtraction();
      this.populateEntities();

      return this;
    }

    splitBSP(node, leaves, currentDepth, maxDepth) {
      if (currentDepth >= maxDepth || (node.w < 12 && node.h < 12)) {
        leaves.push(node);
        return;
      }

      let splitHorizontally = Math.random() > 0.5;
      if (node.w / node.h >= 1.25) splitHorizontally = false;
      else if (node.h / node.w >= 1.25) splitHorizontally = true;

      let max = (splitHorizontally ? node.h : node.w) - 6;
      if (max <= 6) {
        leaves.push(node);
        return;
      }

      let split = window.randInt(6, max);

      if (splitHorizontally) {
        node.left = {
          x: node.x,
          y: node.y,
          w: node.w,
          h: split,
          left: null,
          right: null,
        };
        node.right = {
          x: node.x,
          y: node.y + split,
          w: node.w,
          h: node.h - split,
          left: null,
          right: null,
        };
      } else {
        node.left = {
          x: node.x,
          y: node.y,
          w: split,
          h: node.h,
          left: null,
          right: null,
        };
        node.right = {
          x: node.x + split,
          y: node.y,
          w: node.w - split,
          h: node.h,
          left: null,
          right: null,
        };
      }

      this.splitBSP(node.left, leaves, currentDepth + 1, maxDepth);
      this.splitBSP(node.right, leaves, currentDepth + 1, maxDepth);
    }

    carveRoom(room) {
      for (let y = room.y; y < room.y + room.h; y++) {
        for (let x = room.x; x < room.x + room.w; x++) {
          this.grid[y][x] = window.TILE_TYPES.FLOOR;
        }
      }
    }

    connectRooms(r1, r2) {
      let x = r1.cx;
      let y = r1.cy;

      while (x !== r2.cx) {
        this.grid[y][x] = window.TILE_TYPES.FLOOR;
        if (y + 1 < this.height - 1)
          this.grid[y + 1][x] = window.TILE_TYPES.FLOOR;
        if (y - 1 > 0) this.grid[y - 1][x] = window.TILE_TYPES.FLOOR;
        x += x < r2.cx ? 1 : -1;
      }
      while (y !== r2.cy) {
        this.grid[y][x] = window.TILE_TYPES.FLOOR;
        if (x + 1 < this.width - 1)
          this.grid[y][x + 1] = window.TILE_TYPES.FLOOR;
        if (x - 1 > 0) this.grid[y][x - 1] = window.TILE_TYPES.FLOOR;
        y += y < r2.cy ? 1 : -1;
      }
      this.grid[y][x] = window.TILE_TYPES.FLOOR;
    }

    buildWalls() {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (this.grid[y][x] === window.TILE_TYPES.FLOOR) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                let ny = y + dy;
                let nx = x + dx;
                if (
                  ny >= 0 &&
                  ny < this.height &&
                  nx >= 0 &&
                  nx < this.width &&
                  this.grid[ny][nx] === window.TILE_TYPES.VOID
                ) {
                  this.grid[ny][nx] = window.TILE_TYPES.WALL;
                }
              }
            }
          }
        }
      }
    }

    placeSpawnAndExtraction() {
      if (this.rooms.length === 0) return;

      let startRoomIndex = Math.floor(Math.random() * this.rooms.length);
      let startRoom = this.rooms[startRoomIndex];
      this.spawnRoomId = startRoom.id;
      this.spawnTile = { x: startRoom.cx, y: startRoom.cy };
      this.grid[startRoom.cy][startRoom.cx] = window.TILE_TYPES.SPAWN_PLAYER;

      let candidateRooms = this.rooms
        .filter((r) => r.id !== startRoom.id)
        .map((r) => ({
          room: r,
          dist: Math.hypot(r.cx - startRoom.cx, r.cy - startRoom.cy),
        }))
        .sort((a, b) => b.dist - a.dist);

      if (candidateRooms.length === 0) return;

      let topCandidates = candidateRooms.slice(
        0,
        Math.min(3, candidateRooms.length),
      );
      let chosen =
        topCandidates[Math.floor(Math.random() * topCandidates.length)].room;

      this.extractionTile = { x: chosen.cx, y: chosen.cy };
      this.grid[chosen.cy][chosen.cx] = window.TILE_TYPES.DESCENT_PORTAL;

      // Spawn Recovery Chest in exit room if lost loot matches current floor depth
      let rec = window.playerStats && window.playerStats.recoveryLoot;
      if (
        rec &&
        rec.floor === this.depth &&
        rec.items &&
        rec.items.length > 0
      ) {
        let candidateTiles = [];
        for (let ry = chosen.y; ry < chosen.y + chosen.h; ry++) {
          for (let rx = chosen.x; rx < chosen.x + chosen.w; rx++) {
            let distToPortal = Math.hypot(rx - chosen.cx, ry - chosen.cy);
            if (
              distToPortal >= 2.2 &&
              this.grid[ry][rx] === window.TILE_TYPES.FLOOR
            ) {
              candidateTiles.push({ x: rx, y: ry, dist: distToPortal });
            }
          }
        }
        if (candidateTiles.length > 0) {
          candidateTiles.sort((a, b) => b.dist - a.dist);
          let targetTile = candidateTiles[0]; // Tile farthest from portal inside exit room
          this.grid[targetTile.y][targetTile.x] =
            window.TILE_TYPES.RECOVERY_CHEST;
        }
      }
    }

    populateEntities() {
      this.chests = [];
      this.mobSpawns = [];
      this.breakables = [];
      this.torches = [];
      this.shrooms = [];

      let d = this.depth;
      let mobDensityMult = 1.0 + 0.15 * Math.pow(d, 0.6);

      // Populate Wall Torches along south-facing corridor walls
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          if (this.grid[y][x] === window.TILE_TYPES.WALL) {
            let isSouthFloor =
              this.grid[y + 1] &&
              this.grid[y + 1][x] !== window.TILE_TYPES.WALL &&
              this.grid[y + 1][x] !== window.TILE_TYPES.VOID;
            if (isSouthFloor && (x + y * 3) % 4 === 0) {
              this.torches.push({ x: x, y: y });
            }
          }
        }
      }

      this.rooms.forEach((room, idx) => {
        if (room.id === this.spawnRoomId) return;

        // Populate Bioluminescent Mushroom clusters in room corners
        if (Math.random() < 0.45) {
          let mx = Math.random() < 0.5 ? room.x + 1 : room.x + room.w - 2;
          let my = Math.random() < 0.5 ? room.y + 1 : room.y + room.h - 2;
          if (this.grid[my][mx] === window.TILE_TYPES.FLOOR) {
            this.shrooms.push({ x: mx, y: my });
          }
        }

        if (Math.random() < 0.2) {
          let cx = window.randInt(room.x + 1, room.x + room.w - 2);
          let cy = window.randInt(room.y + 1, room.y + room.h - 2);
          if (this.grid[cy][cx] === window.TILE_TYPES.FLOOR) {
            this.grid[cy][cx] = window.TILE_TYPES.CHEST_SPAWN;
            this.chests.push({ x: cx, y: cy, opened: false });
          }
        }

        let baseCount = Math.floor((room.w * room.h) / 16);
        let mobCount = Math.floor(baseCount * mobDensityMult);

        for (let m = 0; m < mobCount; m++) {
          let mx = window.randInt(room.x + 1, room.x + room.w - 2);
          let my = window.randInt(room.y + 1, room.y + room.h - 2);
          if (this.grid[my][mx] === window.TILE_TYPES.FLOOR) {
            this.grid[my][mx] = window.TILE_TYPES.MOB_SPAWN;
            this.mobSpawns.push({ x: mx, y: my, room: idx });
          }
        }

        // Populate Breakable Pottery, Urns & Barrels along walls/corners
        let propCount = window.randInt(0, 4);
        let propTypes = ["clay_pot", "ancient_urn", "wooden_barrel"];
        for (let pIdx = 0; pIdx < propCount; pIdx++) {
          let side = Math.floor(Math.random() * 4);
          let px = room.x + 1;
          let py = room.y + 1;

          if (side === 0) {
            px = window.randInt(room.x + 1, room.x + room.w - 2);
            py = room.y + 1;
          } else if (side === 1) {
            px = window.randInt(room.x + 1, room.x + room.w - 2);
            py = room.y + room.h - 2;
          } else if (side === 2) {
            px = room.x + 1;
            py = window.randInt(room.y + 1, room.y + room.h - 2);
          } else {
            px = room.x + room.w - 2;
            py = window.randInt(room.y + 1, room.y + room.h - 2);
          }

          if (this.grid[py] && this.grid[py][px] === window.TILE_TYPES.FLOOR) {
            this.grid[py][px] = window.TILE_TYPES.POTTERY_SPAWN;
            let chosenProp =
              propTypes[Math.floor(Math.random() * propTypes.length)];
            let hp = chosenProp === "wooden_barrel" ? 2 : 1;
            this.breakables.push({
              id: window.idCounter++,
              type: chosenProp,
              x: px,
              y: py,
              hp: hp,
              maxHp: hp,
              flashTimer: 0,
            });
          }
        }
      });
    }

    revealSightRadius(px, py, pInt = 0) {
      if (!this.exploredGrid || !this.grid) return;
      let tileSize = this.tileSize;
      let centerC = Math.floor(px / tileSize);
      let centerR = Math.floor(py / tileSize);

      let effectiveInt = Math.max(0, (pInt || 0) - 5);
      // Enhanced base sight radius from 7 to 12 tiles, and increased max limit to 18 for optimal widescreen coverage
      let radius = Math.min(18, 12 + Math.floor(effectiveInt / 15));
      let radiusSq = radius * radius;

      let minR = Math.max(0, centerR - radius);
      let maxR = Math.min(this.height - 1, centerR + radius);
      let minC = Math.max(0, centerC - radius);
      let maxC = Math.min(this.width - 1, centerC + radius);

      for (let r = minR; r <= maxR; r++) {
        let dr = r - centerR;
        for (let c = minC; c <= maxC; c++) {
          let dc = c - centerC;
          if (dr * dr + dc * dc <= radiusSq) {
            this.exploredGrid[r][c] = true;
          }
        }
      }
    }

    getVisibleWallSegments(camX, camY, viewW, viewH, pool) {
      let tileSize = this.tileSize;
      let startCol = Math.max(0, Math.floor(camX / tileSize));
      let endCol = Math.min(
        this.width - 1,
        Math.ceil((camX + viewW) / tileSize),
      );
      let startRow = Math.max(0, Math.floor(camY / tileSize));
      let endRow = Math.min(
        this.height - 1,
        Math.ceil((camY + viewH) / tileSize),
      );

      let count = 0;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          let tile = this.grid[r][c];
          let isSolid =
            tile === window.TILE_TYPES.WALL || tile === window.TILE_TYPES.VOID;
          if (!isSolid) continue;

          let px = c * tileSize;
          let py = r * tileSize;

          // North Edge
          if (
            r > 0 &&
            this.grid[r - 1][c] !== window.TILE_TYPES.WALL &&
            this.grid[r - 1][c] !== window.TILE_TYPES.VOID
          ) {
            if (!pool[count]) pool[count] = { x1: 0, y1: 0, x2: 0, y2: 0 };
            pool[count].x1 = px;
            pool[count].y1 = py;
            pool[count].x2 = px + tileSize;
            pool[count].y2 = py;
            count++;
          }
          // South Edge
          if (
            r < this.height - 1 &&
            this.grid[r + 1][c] !== window.TILE_TYPES.WALL &&
            this.grid[r + 1][c] !== window.TILE_TYPES.VOID
          ) {
            if (!pool[count]) pool[count] = { x1: 0, y1: 0, x2: 0, y2: 0 };
            pool[count].x1 = px;
            pool[count].y1 = py + tileSize;
            pool[count].x2 = px + tileSize;
            pool[count].y2 = py + tileSize;
            count++;
          }
          // West Edge
          if (
            c > 0 &&
            this.grid[r][c - 1] !== window.TILE_TYPES.WALL &&
            this.grid[r][c - 1] !== window.TILE_TYPES.VOID
          ) {
            if (!pool[count]) pool[count] = { x1: 0, y1: 0, x2: 0, y2: 0 };
            pool[count].x1 = px;
            pool[count].y1 = py;
            pool[count].x2 = px;
            pool[count].y2 = py + tileSize;
            count++;
          }
          // East Edge
          if (
            c < this.width - 1 &&
            this.grid[r][c + 1] !== window.TILE_TYPES.WALL &&
            this.grid[r][c + 1] !== window.TILE_TYPES.VOID
          ) {
            if (!pool[count]) pool[count] = { x1: 0, y1: 0, x2: 0, y2: 0 };
            pool[count].x1 = px + tileSize;
            pool[count].y1 = py;
            pool[count].x2 = px + tileSize;
            pool[count].y2 = py + tileSize;
            count++;
          }
        }
      }
      return count;
    }
  }

  class Camera {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.viewportW = 750;
      this.viewportH = 320;
      this.zoom = 1.6;
    }

    update(targetX, targetY, mapWidthPx, mapHeightPx) {
          this.zoom = 1.6;

          let effW = this.viewportW / this.zoom;
          let effH = this.viewportH / this.zoom;

      // Offset camera target Y slightly for HUD clearance in landscape mode
      let hudOffset = 20;
      this.x = targetX - effW / 2;
      this.y = targetY - hudOffset - effH / 2;

      if (mapWidthPx <= effW) {
        this.x = (mapWidthPx - effW) / 2;
      } else {
        this.x = Math.max(0, Math.min(this.x, mapWidthPx - effW));
      }

      if (mapHeightPx <= effH) {
        this.y = (mapHeightPx - effH) / 2;
      } else {
        this.y = Math.max(0, Math.min(this.y, mapHeightPx - effH));
      }
    }
  }

  window.drawBreakableProp = function (ctx, prop, px, py, tileSize) {
    if (!prop) return;
    let cx = px + tileSize / 2;
    let cy = py + tileSize / 2;
    let isFlash = prop.flashTimer > 0;

    ctx.save();

    // Base Drop Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (prop.type === "clay_pot") {
      ctx.fillStyle = isFlash ? "#ffffff" : "#d35400";
      ctx.strokeStyle = isFlash ? "#ffffff" : "#000000";
      ctx.lineWidth = 1.5;

      // Bulbous Base
      ctx.beginPath();
      ctx.ellipse(cx, cy + 3, 9, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (!isFlash) {
        // Terracotta Shading Highlight
        ctx.fillStyle = "#e67e22";
        ctx.beginPath();
        ctx.ellipse(cx - 3, cy + 1, 3.5, 4, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        // Banding Lines
        ctx.strokeStyle = "#ba4a00";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(cx, cy + 3, 7, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }

      // Neck & Flared Rim
      ctx.fillStyle = isFlash ? "#ffffff" : "#e67e22";
      ctx.strokeStyle = isFlash ? "#ffffff" : "#000000";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 6, 6, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (prop.type === "ancient_urn") {
      ctx.fillStyle = isFlash ? "#ffffff" : "#1e293b";
      ctx.strokeStyle = isFlash ? "#ffffff" : "#000000";
      ctx.lineWidth = 1.8;

      // Sculpted Urn Body
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 8);
      ctx.quadraticCurveTo(cx - 11, cy - 2, cx - 8, cy + 8);
      ctx.lineTo(cx + 8, cy + 8);
      ctx.quadraticCurveTo(cx + 11, cy - 2, cx + 5, cy - 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (!isFlash) {
        // Gold Runic Middle Band
        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(cx - 9, cy - 2, 18, 3.5);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 0.8;
        ctx.strokeRect(cx - 9, cy - 2, 18, 3.5);

        // Bronze Handles
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(cx - 9, cy - 3, 4, Math.PI / 2, (Math.PI * 3) / 2);
        ctx.arc(cx + 9, cy - 3, 4, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      }

      // Rim Collar
      ctx.fillStyle = isFlash ? "#ffffff" : "#334155";
      ctx.strokeStyle = isFlash ? "#ffffff" : "#000000";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 9, 6.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (prop.type === "wooden_barrel") {
      ctx.fillStyle = isFlash ? "#ffffff" : "#5c3a21";
      ctx.strokeStyle = isFlash ? "#ffffff" : "#000000";
      ctx.lineWidth = 2.0;

      // Curved Stave Body
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 10);
      ctx.quadraticCurveTo(cx - 12, cy, cx - 8, cy + 10);
      ctx.lineTo(cx + 8, cy + 10);
      ctx.quadraticCurveTo(cx + 12, cy, cx + 8, cy - 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (!isFlash) {
        // Vertical Stave Dividers
        ctx.strokeStyle = "#3d1d0b";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(cx - 3, cy - 10);
        ctx.lineTo(cx - 3, cy + 10);
        ctx.moveTo(cx + 3, cy - 10);
        ctx.lineTo(cx + 3, cy + 10);
        ctx.stroke();

        // Iron Hoops
        ctx.fillStyle = "#334155";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.ellipse(cx, cy - 5, 10, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(cx, cy + 5, 10, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Top Cap
      ctx.fillStyle = isFlash ? "#ffffff" : "#78350f";
      ctx.strokeStyle = isFlash ? "#ffffff" : "#000000";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 10, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  };

  window.DungeonMapGenerator = DungeonMapGenerator;
  window.DungeonCamera = new Camera();
  window.activeDungeonMap = new DungeonMapGenerator();

  window.preRenderStaticMap = function (map) {
    if (!map || !map.grid || map.grid.length === 0) return;
    let tileSize = map.tileSize;

    map.preRenderCanvas = document.createElement("canvas");
    map.preRenderCanvas.width = map.width * tileSize;
    map.preRenderCanvas.height = map.height * tileSize;
    let pCtx = map.preRenderCanvas.getContext("2d");

    let isHub = window.currentGameState === window.GAME_STATES.HUB;
    let depth = window.player ? window.player.depth || 1 : 1;
    let sector = Math.floor((depth - 1) / 12);

    const BIOME_PALETTES = [
      {
        stone1: "#223326",
        stone2: "#1d2e21",
        stone3: "#17261b",
        stoneHighlight: "rgba(163, 253, 131, 0.05)",
        stoneShadow: "rgba(0, 0, 0, 0.25)",
        mortar: "#14241a",
        seamGlow: "rgba(46, 204, 113, 0.08)",
        wallCap: "#22382a",
        wallTop: "#2e4a37",
        wallFace: "#14241a",
        wallShadow: "#080f0c",
        wallMortar: "rgba(10, 20, 14, 0.8)",
        accent: "#2ecc71",
      },
      {
        stone1: "#222a38",
        stone2: "#1d2532",
        stone3: "#161c28",
        stoneHighlight: "rgba(224, 242, 254, 0.06)",
        stoneShadow: "rgba(0, 0, 0, 0.25)",
        mortar: "#121822",
        seamGlow: "rgba(56, 189, 248, 0.08)",
        wallCap: "#2a3548",
        wallTop: "#3a475c",
        wallFace: "#161e2b",
        wallShadow: "#0a0e17",
        wallMortar: "rgba(12, 18, 28, 0.8)",
        accent: "#38bdf8",
      },
      {
        stone1: "#241612",
        stone2: "#1f110c",
        stone3: "#170a07",
        stoneHighlight: "rgba(254, 215, 170, 0.05)",
        stoneShadow: "rgba(0, 0, 0, 0.30)",
        mortar: "#140a07",
        seamGlow: "rgba(249, 115, 22, 0.10)",
        wallCap: "#331a14",
        wallTop: "#47231c",
        wallFace: "#1a0b07",
        wallShadow: "#080201",
        wallMortar: "rgba(22, 8, 6, 0.85)",
        accent: "#f97316",
      },
      {
        stone1: "#16281e",
        stone2: "#122117",
        stone3: "#0d1a11",
        stoneHighlight: "rgba(167, 243, 208, 0.06)",
        stoneShadow: "rgba(0, 0, 0, 0.28)",
        mortar: "#0c1b12",
        seamGlow: "rgba(52, 211, 153, 0.09)",
        wallCap: "#1d3827",
        wallTop: "#284d32",
        wallFace: "#102116",
        wallShadow: "#050e08",
        wallMortar: "rgba(8, 22, 14, 0.85)",
        accent: "#34d399",
      },
      {
        stone1: "#180d2b",
        stone2: "#130923",
        stone3: "#0e051b",
        stoneHighlight: "rgba(245, 208, 254, 0.06)",
        stoneShadow: "rgba(0, 0, 0, 0.32)",
        mortar: "#0d041c",
        seamGlow: "rgba(232, 121, 249, 0.10)",
        wallCap: "#22113b",
        wallTop: "#33184f",
        wallFace: "#130726",
        wallShadow: "#04010d",
        wallMortar: "rgba(16, 4, 30, 0.85)",
        accent: "#e879f9",
      },
    ];

    let biomeIndex = Math.min(sector, BIOME_PALETTES.length - 1);
    let biome = BIOME_PALETTES[biomeIndex];

    for (let r = 0; r < map.height; r++) {
      for (let c = 0; c < map.width; c++) {
        let tile = map.grid[r][c];
        let px = c * tileSize;
        let py = r * tileSize;

        let tileHash =
          Math.abs(Math.sin(c * 12.9898 + r * 78.233) * 43758.5453) % 1.0;

        if (tile === window.TILE_TYPES.VOID) {
          pCtx.fillStyle = "#05030a";
          pCtx.fillRect(px, py, tileSize, tileSize);
        } else if (tile === window.TILE_TYPES.WALL) {
          if (isHub) {
            let isSouthFloor =
              r + 1 < map.height &&
              map.grid[r + 1][c] !== window.TILE_TYPES.WALL &&
              map.grid[r + 1][c] !== window.TILE_TYPES.VOID;
            let isNorthFloor =
              r - 1 >= 0 &&
              map.grid[r - 1][c] !== window.TILE_TYPES.WALL &&
              map.grid[r - 1][c] !== window.TILE_TYPES.VOID;

            if (isSouthFloor) {
              pCtx.fillStyle = "#252b38";
              pCtx.fillRect(px, py, tileSize, tileSize - 8);

              pCtx.fillStyle = "#3b4356";
              pCtx.fillRect(px, py, tileSize, 2);

              pCtx.fillStyle = "#d4af37";
              pCtx.fillRect(px, py + tileSize - 10, tileSize, 2);

              pCtx.fillStyle = "#131722";
              pCtx.fillRect(px, py + tileSize - 8, tileSize, 8);
            } else {
              pCtx.fillStyle = "#1a1f2c";
              pCtx.fillRect(px, py, tileSize, tileSize);

              pCtx.strokeStyle = "#0e111a";
              pCtx.lineWidth = 1;
              pCtx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);

              if (isNorthFloor) {
                pCtx.fillStyle = "#3b4356";
                pCtx.fillRect(px, py, tileSize, 2);
              }
            }

            pCtx.strokeStyle = "rgba(212, 175, 55, 0.15)";
            pCtx.lineWidth = 1;
            let midY = py + Math.floor(tileSize / 2);
            pCtx.beginPath();
            pCtx.moveTo(px, midY);
            pCtx.lineTo(px + tileSize, midY);
            if ((c + r) % 2 === 0) {
              pCtx.moveTo(px + 16, py);
              pCtx.lineTo(px + 16, midY);
            } else {
              pCtx.moveTo(px + 16, midY);
              pCtx.lineTo(px + 16, py + tileSize);
            }
            pCtx.stroke();
          } else {
            let isSouthFloor =
              r + 1 < map.height &&
              map.grid[r + 1][c] !== window.TILE_TYPES.WALL &&
              map.grid[r + 1][c] !== window.TILE_TYPES.VOID;
            let isNorthFloor =
              r - 1 >= 0 &&
              map.grid[r - 1][c] !== window.TILE_TYPES.WALL &&
              map.grid[r - 1][c] !== window.TILE_TYPES.VOID;

            if (isSouthFloor) {
              pCtx.fillStyle = biome.wallCap;
              pCtx.fillRect(px, py, tileSize, tileSize - 8);

              pCtx.fillStyle = biome.wallTop;
              pCtx.fillRect(px, py, tileSize, 2);

              pCtx.fillStyle = biome.wallFace;
              pCtx.fillRect(px, py + tileSize - 8, tileSize, 8);

              pCtx.fillStyle = biome.wallShadow;
              pCtx.fillRect(px, py + tileSize - 2, tileSize, 2);

              pCtx.strokeStyle = biome.wallMortar;
              pCtx.lineWidth = 1;
              pCtx.beginPath();
              pCtx.moveTo(px, py + tileSize - 8);
              pCtx.lineTo(px + tileSize, py + tileSize - 8);
              pCtx.stroke();
            } else {
              pCtx.fillStyle = biome.wallCap;
              pCtx.fillRect(px, py, tileSize, tileSize);

              pCtx.strokeStyle = biome.wallShadow;
              pCtx.lineWidth = 1;
              pCtx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);

              if (isNorthFloor) {
                pCtx.fillStyle = biome.wallTop;
                pCtx.fillRect(px, py, tileSize, 2);
              }
            }

            pCtx.strokeStyle = biome.wallMortar;
            pCtx.lineWidth = 1;
            let midY = py + Math.floor((tileSize - (isSouthFloor ? 8 : 0)) / 2);
            pCtx.beginPath();
            pCtx.moveTo(px, midY);
            pCtx.lineTo(px + tileSize, midY);
            if ((c + r) % 2 === 0) {
              pCtx.moveTo(px + 16, py);
              pCtx.lineTo(px + 16, midY);
            } else {
              pCtx.moveTo(px + 16, midY);
              pCtx.lineTo(
                px + 16,
                py + (isSouthFloor ? tileSize - 8 : tileSize),
              );
            }
            pCtx.stroke();

            if (tileHash > 0.65) {
              pCtx.fillStyle = biome.accent;
              let ax = px + 6 + ((tileHash * 17) % 18);
              let ay = py + 3 + ((tileHash * 23) % 10);
              pCtx.fillRect(ax, ay, 2.5, 2.5);
              pCtx.fillRect(ax - 2, ay + 3, 2, 2);
              if (isSouthFloor) {
                pCtx.fillRect(ax, py + tileSize - 8, 2, 4);
              }
            }
          }
        } else {
          if (isHub) {
            let spX = map.spawnTile.x;
            let spY = map.spawnTile.y;

            let isPathway =
              (c === spX && r >= 4 && r <= map.height - 5) ||
              (r === spY && c >= 5 && c <= map.width - 6);

            let stationTile = null;
            if (map.stations) {
              for (let st of map.stations) {
                if (Math.abs(c - st.x) <= 1 && Math.abs(r - st.y) <= 1) {
                  stationTile = st;
                  break;
                }
              }
            }

            if (stationTile) {
              let dx = c - stationTile.x;
              let dy = r - stationTile.y;
              let isAlt = (c + r) % 2 === 0;

              if (stationTile.type === window.TILE_TYPES.STATION_FORGE) {
                pCtx.fillStyle = isAlt ? "#1a1210" : "#140e0c";
                pCtx.fillRect(px, py, tileSize, tileSize);

                pCtx.strokeStyle = "rgba(120, 53, 15, 0.4)";
                pCtx.lineWidth = 1;
                pCtx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);

                pCtx.beginPath();
                pCtx.moveTo(px + 8, py);
                pCtx.lineTo(px + 8, py + tileSize);
                pCtx.moveTo(px + 16, py);
                pCtx.lineTo(px + 16, py + tileSize);
                pCtx.moveTo(px + 24, py);
                pCtx.lineTo(px + 24, py + tileSize);
                pCtx.stroke();

                pCtx.fillStyle = "#b45309";
                pCtx.fillRect(px + 2, py + 2, 3, 3);
                pCtx.fillRect(px + tileSize - 5, py + 2, 3, 3);
                pCtx.fillRect(px + 2, py + tileSize - 5, 3, 3);
                pCtx.fillRect(px + tileSize - 5, py + tileSize - 5, 3, 3);
              } else if (
                stationTile.type === window.TILE_TYPES.STATION_PORTAL
              ) {
                pCtx.fillStyle = isAlt ? "#1e0b2e" : "#160724";
                pCtx.fillRect(px, py, tileSize, tileSize);

                pCtx.strokeStyle = "rgba(168, 85, 247, 0.25)";
                pCtx.lineWidth = 1;
                pCtx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);

                if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
                  pCtx.fillStyle = "#d4af37";
                  let cornerX = dx < 0 ? px + 2 : px + tileSize - 6;
                  let cornerY = dy < 0 ? py + 2 : py + tileSize - 6;
                  pCtx.fillRect(cornerX, cornerY, 4, 4);
                }
              } else if (
                stationTile.type === window.TILE_TYPES.STATION_ENCHANT
              ) {
                pCtx.fillStyle = isAlt ? "#0f0d22" : "#090817";
                pCtx.fillRect(px, py, tileSize, tileSize);

                pCtx.strokeStyle = "rgba(0, 210, 255, 0.25)";
                pCtx.lineWidth = 1;
                pCtx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);

                if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
                  pCtx.fillStyle = "#00d2ff";
                  let cornerX = dx < 0 ? px + 2 : px + tileSize - 4;
                  let cornerY = dy < 0 ? py + 2 : py + tileSize - 4;
                  pCtx.fillRect(cornerX, cornerY, 2, 2);
                }
              } else if (stationTile.type === window.TILE_TYPES.STATION_STASH) {
                pCtx.fillStyle = isAlt ? "#0c1b2d" : "#081322";
                pCtx.fillRect(px, py, tileSize, tileSize);

                pCtx.strokeStyle = "rgba(2, 132, 199, 0.35)";
                pCtx.lineWidth = 1;
                pCtx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);

                pCtx.fillStyle = "#38bdf8";
                pCtx.fillRect(px + 2, py + 2, 2, 2);
                pCtx.fillRect(px + tileSize - 4, py + 2, 2, 2);
                pCtx.fillRect(px + 2, py + tileSize - 4, 2, 2);
                pCtx.fillRect(px + tileSize - 4, py + tileSize - 4, 2, 2);
              } else if (stationTile.type === window.TILE_TYPES.STATION_INN) {
                pCtx.fillStyle = isAlt ? "#0a3328" : "#06241a";
                pCtx.fillRect(px, py, tileSize, tileSize);

                pCtx.strokeStyle = "rgba(16, 185, 129, 0.35)";
                pCtx.lineWidth = 1;
                pCtx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);

                if (tileHash > 0.4) {
                  pCtx.fillStyle = "rgba(16, 185, 129, 0.25)";
                  pCtx.beginPath();
                  pCtx.arc(px + 4, py + 4, 3, 0, Math.PI * 2);
                  pCtx.arc(
                    px + tileSize - 4,
                    py + tileSize - 4,
                    2.5,
                    0,
                    Math.PI * 2,
                  );
                  pCtx.fill();
                }
              } else if (
                stationTile.type === window.TILE_TYPES.STATION_GACHAPON
              ) {
                pCtx.fillStyle = isAlt ? "#1f1d15" : "#191710";
                pCtx.fillRect(px, py, tileSize, tileSize);

                pCtx.strokeStyle = "rgba(241, 196, 15, 0.25)";
                pCtx.lineWidth = 1;
                pCtx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);
              }

              pCtx.strokeStyle =
                stationTile.type === window.TILE_TYPES.STATION_FORGE
                  ? "#ea580c"
                  : stationTile.type === window.TILE_TYPES.STATION_PORTAL
                    ? "#9333ea"
                    : stationTile.type === window.TILE_TYPES.STATION_ENCHANT
                      ? "#00d2ff"
                      : stationTile.type === window.TILE_TYPES.STATION_STASH
                        ? "#0284c7"
                        : stationTile.type ===
                            window.TILE_TYPES.STATION_GACHAPON
                          ? "#f1c40f"
                          : "#059669";
              pCtx.lineWidth = 1.5;

              if (dx === -1) {
                pCtx.beginPath();
                pCtx.moveTo(px, py);
                pCtx.lineTo(px, py + tileSize);
                pCtx.stroke();
              }
              if (dx === 1) {
                pCtx.beginPath();
                pCtx.moveTo(px + tileSize, py);
                pCtx.lineTo(px + tileSize, py + tileSize);
                pCtx.stroke();
              }
              if (dy === -1) {
                pCtx.beginPath();
                pCtx.moveTo(px, py);
                pCtx.lineTo(px + tileSize, py);
                pCtx.stroke();
              }
              if (dy === 1) {
                pCtx.beginPath();
                pCtx.moveTo(px, py + tileSize);
                pCtx.lineTo(px + tileSize, py + tileSize);
                pCtx.stroke();
              }
            } else {
              let baseColor = isPathway
                ? (c + r) % 2 === 0
                  ? "#1e2433"
                  : "#191e2b"
                : (c + r) % 2 === 0
                  ? "#151822"
                  : "#11131c";

              pCtx.fillStyle = baseColor;
              pCtx.fillRect(px, py, tileSize, tileSize);

              pCtx.strokeStyle = isPathway
                ? "rgba(255, 255, 255, 0.07)"
                : "rgba(255, 255, 255, 0.03)";
              pCtx.lineWidth = 1;
              pCtx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);

              if (isPathway) {
                pCtx.strokeStyle = "rgba(212, 175, 55, 0.15)";
                pCtx.lineWidth = 1;
                if (c === spX - 1) {
                  pCtx.beginPath();
                  pCtx.moveTo(px + tileSize, py);
                  pCtx.lineTo(px + tileSize, py + tileSize);
                  pCtx.stroke();
                }
                if (c === spX + 1) {
                  pCtx.beginPath();
                  pCtx.moveTo(px, py);
                  pCtx.lineTo(px + tileSize, py + tileSize);
                  pCtx.stroke();
                }
                if (r === spY - 1) {
                  pCtx.beginPath();
                  pCtx.moveTo(px, py + tileSize);
                  pCtx.lineTo(px + tileSize, py + tileSize);
                  pCtx.stroke();
                }
                if (r === spY + 1) {
                  pCtx.beginPath();
                  pCtx.moveTo(px, py);
                  pCtx.lineTo(px + tileSize, py);
                  pCtx.stroke();
                }
              }

              if (c === spX && r === spY) {
                let spCx = px + tileSize / 2;
                let spCy = py + tileSize / 2;

                pCtx.save();
                pCtx.strokeStyle = "#f1c40f";
                pCtx.lineWidth = 2;
                pCtx.beginPath();
                pCtx.arc(spCx, spCy, 14, 0, Math.PI * 2);
                pCtx.stroke();

                pCtx.fillStyle = "rgba(241, 196, 15, 0.15)";
                pCtx.beginPath();
                pCtx.arc(spCx, spCy, 14, 0, Math.PI * 2);
                pCtx.fill();

                pCtx.fillStyle = "#ffd700";
                pCtx.beginPath();
                pCtx.moveTo(spCx, spCy - 12);
                pCtx.lineTo(spCx + 2.5, spCy - 2.5);
                pCtx.lineTo(spCx + 12, spCy);
                pCtx.lineTo(spCx + 2.5, spCy + 2.5);
                pCtx.lineTo(spCx, spCy + 12);
                pCtx.lineTo(spCx - 2.5, spCy + 2.5);
                pCtx.lineTo(spCx - 12, spCy);
                pCtx.lineTo(spCx - 2.5, spCy - 2.5);
                pCtx.closePath();
                pCtx.fill();

                pCtx.fillStyle = "#ffffff";
                pCtx.beginPath();
                pCtx.arc(spCx, spCy, 2.5, 0, Math.PI * 2);
                pCtx.fill();
                pCtx.restore();
              }
            }
          } else {
            let worldNoise = Math.sin(c * 0.45 + r * 0.35) * 0.5 + 0.5;
            let baseColor =
              worldNoise > 0.65
                ? biome.stone1
                : worldNoise > 0.3
                  ? biome.stone2
                  : biome.stone3;

            pCtx.fillStyle = baseColor;
            pCtx.fillRect(px, py, tileSize, tileSize);

            let layoutType = (c * 7 + r * 13) % 4;

            let drawFlagstone = (sx, sy, sw, sh, colorIdx) => {
              let stoneCol =
                colorIdx === 0
                  ? biome.stone1
                  : colorIdx === 1
                    ? biome.stone2
                    : biome.stone3;

              pCtx.fillStyle = stoneCol;
              pCtx.fillRect(sx, sy, sw, sh);

              pCtx.fillStyle = biome.stoneHighlight;
              pCtx.fillRect(sx, sy, sw, 1);
              pCtx.fillRect(sx, sy, 1, sh);

              pCtx.fillStyle = biome.stoneShadow;
              pCtx.fillRect(sx, sy + sh - 1, sw, 1);
              pCtx.fillRect(sx + sw - 1, sy, 1, sh);
            };

            if (layoutType === 0) {
              drawFlagstone(px, py, tileSize, 18, (c + r) % 3);
              drawFlagstone(px, py + 18, 15, tileSize - 18, (c * 2 + r) % 3);
              drawFlagstone(
                px + 15,
                py + 18,
                tileSize - 15,
                tileSize - 18,
                (c + r * 2) % 3,
              );
            } else if (layoutType === 1) {
              drawFlagstone(px, py, 14, tileSize, (c + r * 3) % 3);
              drawFlagstone(px + 14, py, tileSize - 14, 15, (c * 3 + r) % 3);
              drawFlagstone(
                px + 14,
                py + 15,
                tileSize - 14,
                tileSize - 15,
                (c + r) % 3,
              );
            } else if (layoutType === 2) {
              drawFlagstone(px, py, 16, 14, (c + r) % 3);
              drawFlagstone(
                px + 16,
                py,
                tileSize - 16,
                14,
                (c * 2 + r * 2) % 3,
              );
              drawFlagstone(
                px,
                py + 14,
                tileSize,
                tileSize - 14,
                (c + r * 3) % 3,
              );
            } else {
              drawFlagstone(px, py, 17, 16, (c * 2 + r) % 3);
              drawFlagstone(px, py + 16, 17, tileSize - 16, (c + r * 2) % 3);
              drawFlagstone(px + 17, py, tileSize - 17, tileSize, (c + r) % 3);
            }

            pCtx.strokeStyle = biome.seamGlow;
            pCtx.lineWidth = 0.8;
            pCtx.beginPath();
            if (layoutType === 0) {
              pCtx.moveTo(px, py + 18);
              pCtx.lineTo(px + tileSize, py + 18);
              pCtx.moveTo(px + 15, py + 18);
              pCtx.lineTo(px + 15, py + tileSize);
            } else if (layoutType === 1) {
              pCtx.moveTo(px + 14, py);
              pCtx.lineTo(px + 14, py + tileSize);
              pCtx.moveTo(px + 14, py + 15);
              pCtx.lineTo(px + tileSize, py + 15);
            } else if (layoutType === 2) {
              pCtx.moveTo(px, py + 14);
              pCtx.lineTo(px + tileSize, py + 14);
              pCtx.moveTo(px + 16, py);
              pCtx.lineTo(px + 16, py + 14);
            } else {
              pCtx.moveTo(px + 17, py);
              pCtx.lineTo(px + 17, py + tileSize);
              pCtx.moveTo(px, py + 16);
              pCtx.lineTo(px + 17, py + 16);
            }
            pCtx.stroke();

            if (r > 0 && map.grid[r - 1][c] === window.TILE_TYPES.WALL) {
              let northShadow = pCtx.createLinearGradient(px, py, px, py + 12);
              northShadow.addColorStop(0, "rgba(0, 0, 0, 0.65)");
              northShadow.addColorStop(1, "rgba(0, 0, 0, 0)");
              pCtx.fillStyle = northShadow;
              pCtx.fillRect(px, py, tileSize, 12);
            }
            if (c > 0 && map.grid[r][c - 1] === window.TILE_TYPES.WALL) {
              let westShadow = pCtx.createLinearGradient(px, py, px + 8, py);
              westShadow.addColorStop(0, "rgba(0, 0, 0, 0.45)");
              westShadow.addColorStop(1, "rgba(0, 0, 0, 0)");
              pCtx.fillStyle = westShadow;
              pCtx.fillRect(px, py, 8, tileSize);
            }

            if (tileHash > 0.82) {
              pCtx.fillStyle = "rgba(255, 255, 255, 0.04)";
              let ax = px + 4 + ((tileHash * 19) % 22);
              let ay = py + 4 + ((tileHash * 29) % 22);
              pCtx.fillRect(ax, ay, 2.5, 2.5);
              pCtx.fillRect(ax + 3, ay - 2, 1.8, 1.8);
            } else if (tileHash > 0.62) {
              pCtx.strokeStyle = "rgba(0, 0, 0, 0.55)";
              pCtx.lineWidth = 1.0;
              pCtx.beginPath();
              let cx1 = px + 5 + ((tileHash * 11) % 12);
              let cy1 = py + 4 + ((tileHash * 13) % 8);
              pCtx.moveTo(cx1, cy1);
              pCtx.lineTo(cx1 + 6, cy1 + 8);
              pCtx.lineTo(cx1 + 2, cy1 + 17);
              pCtx.stroke();
            }
          }
        }
      }
    }
    map.needsPreRender = false;
  };

  window.drawDungeonPortalTile = function (ctx, tileType, cx, cy, tileSize) {
    let time = Date.now();

    let primaryColor, secondaryColor, coreColor, bgGradColor;
    if (tileType === window.TILE_TYPES.EXTRACTION_ZONE) {
      primaryColor = "#00d2ff";
      secondaryColor = "#38bdf8";
      coreColor = "#e0f2fe";
      bgGradColor = "rgba(0, 210, 255, 0.35)";
    } else if (tileType === window.TILE_TYPES.DESCENT_PORTAL) {
      primaryColor = "#a855f7";
      secondaryColor = "#c084fc";
      coreColor = "#f3e8ff";
      bgGradColor = "rgba(168, 85, 247, 0.35)";
    } else if (tileType === window.TILE_TYPES.BOSS_GATE) {
      primaryColor = "#e74c3c";
      secondaryColor = "#fb923c";
      coreColor = "#fef2f2";
      bgGradColor = "rgba(231, 76, 60, 0.4)";
    } else {
      return;
    }

    ctx.save();

    // 1. Dark Runic Base Dais
    ctx.fillStyle = "#0c0d14";
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cx, cy, tileSize * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Metallic Corner Clamps
    ctx.fillStyle = primaryColor;
    for (let i = 0; i < 4; i++) {
      let clampAngle = (i * Math.PI) / 2;
      let clampX = cx + Math.cos(clampAngle) * (tileSize * 0.46);
      let clampY = cy + Math.sin(clampAngle) * (tileSize * 0.46);
      ctx.beginPath();
      ctx.arc(clampX, clampY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Radial Ambient Glow Aura
    let pulse = Math.sin(time / 200) * 2;
    let auraRadius = tileSize * 0.55 + pulse;
    let auraGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, auraRadius);
    auraGrad.addColorStop(0, bgGradColor);
    auraGrad.addColorStop(0.7, bgGradColor.replace(/0\.\d+\)/, "0.1)"));
    auraGrad.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Counter-Rotating Runic Elliptical Rings
    let spin1 = time / 350;
    let spin2 = -time / 220;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.save();
    ctx.rotate(spin1);
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.ellipse(0, 0, tileSize * 0.4, tileSize * 0.18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(spin2);
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      tileSize * 0.35,
      tileSize * 0.22,
      Math.PI / 4,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // 4. Swirling Vortex Arms
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin1 * 1.5);
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([]);
    for (let arm = 0; arm < 3; arm++) {
      let armAngle = (arm * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(0, 0, tileSize * 0.28, armAngle, armAngle + Math.PI * 0.6);
      ctx.stroke();
    }
    ctx.restore();

    // 5. White-Hot Central Singularity Core
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(
      cx,
      cy,
      tileSize * 0.12 + Math.sin(time / 120) * 1.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // 6. Upward Drifting Deterministic Sparks
    for (let i = 0; i < 4; i++) {
      let seed = i * 37.1;
      let progress = (time / 600 + seed) % 1.0;
      let sparkAngle = (time / 400 + i * 1.57) % (Math.PI * 2);
      let sparkDist = progress * (tileSize * 0.42);
      let sx = cx + Math.cos(sparkAngle) * sparkDist;
      let sy = cy + Math.sin(sparkAngle) * (sparkDist * 0.6) - progress * 8;
      let alpha = (1.0 - progress) * 0.9;
      let sz = 1.5 * (1.0 - progress * 0.4);

      let sparkColor =
        i % 2 === 0
          ? `rgba(255, 255, 255, ${alpha})`
          : `rgba(${tileType === window.TILE_TYPES.EXTRACTION_ZONE ? "0, 210, 255" : tileType === window.TILE_TYPES.DESCENT_PORTAL ? "168, 85, 247" : "231, 76, 60"}, ${alpha})`;
      ctx.fillStyle = sparkColor;
      ctx.beginPath();
      ctx.arc(sx, sy, sz, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  window.renderTopDownMap = function (ctx, canvas) {
    let map = window.activeDungeonMap;
    if (!map || !map.grid || map.grid.length === 0) return;

    let tileSize = map.tileSize;
    let camera = window.DungeonCamera;
    camera.viewportW = canvas.width;
    camera.viewportH = canvas.height;

    let effW = camera.viewportW / camera.zoom;
    let effH = camera.viewportH / camera.zoom;

    let startCol = Math.max(0, Math.floor(camera.x / tileSize));
    let endCol = Math.min(
      map.width - 1,
      Math.ceil((camera.x + effW) / tileSize),
    );
    let startRow = Math.max(0, Math.floor(camera.y / tileSize));
    let endRow = Math.min(
      map.height - 1,
      Math.ceil((camera.y + effH) / tileSize),
    );

    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));

    // PASS 1: Base Terrain & Floor Grid Rendering
    if (map.needsPreRender || !map.preRenderCanvas) {
      window.preRenderStaticMap(map);
    }

    let isHub = window.currentGameState === window.GAME_STATES.HUB;

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        let isExplored =
          isHub ||
          (map.exploredGrid && map.exploredGrid[r] && map.exploredGrid[r][c]);
        if (!isExplored) continue;

        let px = c * tileSize;
        let py = r * tileSize;

        ctx.drawImage(
          map.preRenderCanvas,
          px,
          py,
          tileSize,
          tileSize,
          px,
          py,
          tileSize,
          tileSize,
        );
      }
    }

    // PASS 2: Object & Station Overlay Pass (Renders cleanly over floor grid without clipping)
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        let tile = map.grid[r][c];
        let px = c * tileSize;
        let py = r * tileSize;

        if (
          tile === window.TILE_TYPES.EXTRACTION_ZONE ||
          tile === window.TILE_TYPES.DESCENT_PORTAL ||
          tile === window.TILE_TYPES.BOSS_GATE
        ) {
          window.drawDungeonPortalTile(
            ctx,
            tile,
            px + tileSize / 2,
            py + tileSize / 2,
            tileSize,
          );
        }

        if (tile === window.TILE_TYPES.EXTRACTION_ZONE) {
          let cx = px + tileSize / 2;
          let cy = py + tileSize / 2;
          let time = Date.now() / 300;

          ctx.save();
          ctx.strokeStyle = "#00d2ff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, tileSize * 0.38 + Math.sin(time) * 2, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "rgba(0, 210, 255, 0.25)";
          ctx.beginPath();
          ctx.arc(cx, cy, tileSize * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (tile === window.TILE_TYPES.DESCENT_PORTAL) {
          let cx = px + tileSize / 2;
          let cy = py + tileSize / 2;
          let time = Date.now() / 250;

          ctx.save();
          ctx.strokeStyle = "#a855f7";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, tileSize * 0.38 + Math.sin(time) * 2, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "rgba(168, 85, 247, 0.25)";
          ctx.beginPath();
          ctx.arc(cx, cy, tileSize * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (tile === window.TILE_TYPES.BOSS_GATE) {
          let cx = px + tileSize / 2;
          let cy = py + tileSize / 2;
          let time = Date.now() / 200;

          ctx.save();
          ctx.strokeStyle = "#e74c3c";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, tileSize * 0.4 + Math.sin(time) * 3, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "rgba(231, 76, 60, 0.35)";
          ctx.beginPath();
          ctx.arc(cx, cy, tileSize * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    window.drawDungeonStructureTile = function (
      ctx,
      tileType,
      px,
      py,
      tileSize,
    ) {
      if (tileType === window.TILE_TYPES.RECOVERY_CHEST) {
        let cx = px + tileSize / 2;
        let cy = py + tileSize / 2;
        let time = Date.now();

        ctx.save();

        // 1. Pulsing Golden-Cyan Floor Aura
        let pulse = Math.sin(time / 150) * 2;
        let auraRad = 16 + pulse;
        let auraGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, auraRad);
        auraGrad.addColorStop(0, "rgba(241, 196, 15, 0.6)");
        auraGrad.addColorStop(0.5, "rgba(0, 210, 255, 0.3)");
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, auraRad, 0, Math.PI * 2);
        ctx.fill();

        // 2. Base Drop Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.beginPath();
        ctx.ellipse(cx, cy + 8, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. Ornate Soul-Bound Chest Body
        ctx.fillStyle = "#1e132b";
        ctx.strokeStyle = "#f1c40f";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(cx - 12, cy - 8, 24, 18, [3]);
        ctx.fill();
        ctx.stroke();

        // 4. Cyan Steel Corner Brackets
        ctx.fillStyle = "#00d2ff";
        ctx.fillRect(cx - 12, cy - 8, 4, 18);
        ctx.strokeRect(cx - 12, cy - 8, 4, 18);
        ctx.fillRect(cx + 8, cy - 8, 4, 18);
        ctx.strokeRect(cx + 8, cy - 8, 4, 18);

        // 5. Glowing Central Skull Lock
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#f1c40f";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#00d2ff";
        ctx.fillRect(cx - 1, cy - 1, 2, 2);

        // 6. Floating Runic Star Emblem
        let floatY = Math.sin(time / 200) * 2.5;
        ctx.fillStyle = "#f1c40f";
        ctx.font = "900 10px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("!", cx, cy - 15 + floatY);

        ctx.restore();
      } else if (tileType === window.TILE_TYPES.CHEST_SPAWN) {
        let cx = px + tileSize / 2;
        let cy = py + tileSize / 2;

        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(cx - 12, cy - 10, 24, 20, [3]);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "rgba(241, 196, 15, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 9, 6, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#5c3a21";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1.5;
        ctx.fillRect(cx - 8, cy - 8, 16, 12);
        ctx.strokeRect(cx - 8, cy - 8, 16, 12);

        ctx.fillStyle = "#ffd700";
        ctx.fillRect(cx - 2, cy - 4, 4, 4);
      } else if (tileType === window.TILE_TYPES.STATION_PORTAL) {
        let cx = px + tileSize / 2;
        let cy = py + tileSize / 2;
        let time = Date.now();

        ctx.save();

        ctx.fillStyle = "#0c051a";
        ctx.strokeStyle = "#3b0764";
        ctx.lineWidth = 2.2;

        ctx.beginPath();
        ctx.roundRect(cx - 36, cy + 10, 72, 16, [4]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#180a30";
        ctx.beginPath();
        ctx.roundRect(cx - 30, cy + 5, 60, 10, [3]);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx - 28, cy + 7);
        ctx.lineTo(cx + 28, cy + 7);
        ctx.stroke();

        let cornerOffsets = [-32, 32];
        cornerOffsets.forEach((ox) => {
          ctx.fillStyle = "#27123d";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.8;
          ctx.fillRect(cx + ox - 4, cy + 12, 8, 12);
          ctx.strokeRect(cx + ox - 4, cy + 12, 8, 12);

          let floatY = Math.sin(time / 250 + ox) * 2;
          ctx.fillStyle = "#e879f9";
          ctx.strokeStyle = "#a855f7";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(cx + ox, cy + 4 + floatY);
          ctx.lineTo(cx + ox + 3, cy + 8 + floatY);
          ctx.lineTo(cx + ox, cy + 12 + floatY);
          ctx.lineTo(cx + ox - 3, cy + 8 + floatY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });

        let pillarWidth = 14;
        let pillarHeight = 44;
        let pillarTopY = cy - 34;

        [-28, 14].forEach((pxOffset) => {
          let colX = cx + pxOffset;

          ctx.fillStyle = "#0f081d";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2.0;
          ctx.fillRect(colX - 2, cy + 2, pillarWidth + 4, 6);
          ctx.strokeRect(colX - 2, cy + 2, pillarWidth + 4, 6);

          ctx.fillStyle = "#1e1333";
          ctx.beginPath();
          ctx.roundRect(colX, pillarTopY, pillarWidth, pillarHeight, [3]);
          ctx.fill();
          ctx.stroke();

          let runeGlow = 0.5 + Math.sin(time / 180 + pxOffset) * 0.4;
          ctx.strokeStyle = `rgba(168, 85, 247, ${runeGlow})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(colX + pillarWidth / 2, pillarTopY + 4);
          ctx.lineTo(colX + pillarWidth / 2, pillarTopY + pillarHeight - 6);
          ctx.stroke();

          ctx.fillStyle = "#d4af37";
          ctx.fillRect(colX - 1, pillarTopY - 2, pillarWidth + 2, 4);
          ctx.strokeRect(colX - 1, pillarTopY - 2, pillarWidth + 2, 4);
        });

        ctx.fillStyle = "#180a30";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(cx - 32, pillarTopY - 8, 64, 10, [3]);
        ctx.fill();
        ctx.stroke();

        let keystoneY = pillarTopY - 18 + Math.sin(time / 200) * 3;
        let beamPulse = 0.3 + Math.sin(time / 120) * 0.2;

        ctx.fillStyle = `rgba(232, 121, 249, ${beamPulse})`;
        ctx.fillRect(cx - 3, keystoneY + 6, 6, pillarTopY - keystoneY);

        ctx.fillStyle = "#c084fc";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, keystoneY - 8);
        ctx.lineTo(cx + 7, keystoneY);
        ctx.lineTo(cx, keystoneY + 8);
        ctx.lineTo(cx - 7, keystoneY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        let centerPortalY = cy - 8;
        ctx.save();
        ctx.translate(cx, centerPortalY);

        ctx.save();
        ctx.rotate(time / 600);
        ctx.strokeStyle = "rgba(192, 132, 252, 0.45)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 12, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.rotate(-time / 350 + Math.PI / 4);
        ctx.strokeStyle = "rgba(0, 210, 255, 0.55)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 9, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.rotate(time / 200 - Math.PI / 3);
        ctx.strokeStyle = "rgba(232, 121, 249, 0.7)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.restore();

        let baseRad = 21 + Math.sin(time / 150) * 2.5;
        let vortexGrad = ctx.createRadialGradient(
          cx,
          centerPortalY,
          1,
          cx,
          centerPortalY,
          baseRad,
        );
        vortexGrad.addColorStop(0, "#ffffff");
        vortexGrad.addColorStop(0.25, "#e879f9");
        vortexGrad.addColorStop(0.65, "#9333ea");
        vortexGrad.addColorStop(0.9, "#3b0764");
        vortexGrad.addColorStop(1, "rgba(15, 3, 25, 0)");

        ctx.fillStyle = vortexGrad;
        ctx.beginPath();
        ctx.ellipse(
          cx,
          centerPortalY,
          baseRad * 0.88,
          baseRad * 1.18,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 1.5;
        for (let arm = 0; arm < 3; arm++) {
          let startAngle = time / 250 + (arm * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.arc(
            cx,
            centerPortalY,
            baseRad * 0.5,
            startAngle,
            startAngle + Math.PI * 0.7,
          );
          ctx.stroke();
        }

        for (let i = 0; i < 6; i++) {
          let seed = i * 42.8;
          let progress = (time / 700 + seed) % 1.0;
          let wAngle = (time / 400 + i * 1.047) % (Math.PI * 2);
          let dist = 8 + progress * 22;
          let wx = cx + Math.cos(wAngle) * dist;
          let wy = centerPortalY + Math.sin(wAngle) * (dist * 1.25);
          let wAlpha = (1.0 - progress) * 0.9;
          let wSize = 2.0 * (1.0 - progress * 0.4);

          ctx.fillStyle =
            i % 2 === 0
              ? `rgba(255, 255, 255, ${wAlpha})`
              : `rgba(0, 210, 255, ${wAlpha})`;
          ctx.beginPath();
          ctx.arc(wx, wy, wSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // Recovery Chest Warning Beacon Indicator
        let rec = window.playerStats && window.playerStats.recoveryLoot;
        if (rec && rec.items && rec.items.length > 0) {
          let warnPulse = Math.sin(time / 140) * 3;
          let warnY = centerPortalY - 32 + warnPulse;

          ctx.strokeStyle = "#e74c3c";
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.arc(cx, warnY, 11, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "rgba(231, 76, 60, 0.3)";
          ctx.beginPath();
          ctx.arc(cx, warnY, 11, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#f1c40f";
          ctx.font = "900 12px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("!", cx, warnY);

          ctx.font = "bold 9px monospace";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2.5;
          let labelText = `[LOOT AT RISK: FL.${rec.floor}]`;
          ctx.strokeText(labelText, cx, warnY - 15);
          ctx.fillStyle = "#ff7675";
          ctx.fillText(labelText, cx, warnY - 15);
        }

        ctx.restore();
      } else if (tileType === window.TILE_TYPES.STATION_FORGE) {
        let cx = px + tileSize / 2;
        let cy = py + tileSize / 2;
        let time = Date.now();

        ctx.save();

        // 1. Charred Stone Hearth Base Pad
        let hearthW = 76;
        let hearthH = 30;
        let hearthX = cx - hearthW / 2;
        let hearthY = cy - 6;

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.beginPath();
        ctx.roundRect(hearthX - 2, hearthY - 2, hearthW + 4, hearthH + 4, [4]);
        ctx.fill();

        ctx.fillStyle = "#1c1917";
        ctx.strokeStyle = "#0c0a09";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(hearthX, hearthY, hearthW, hearthH, [3]);
        ctx.fill();
        ctx.stroke();

        // Glowing Magma Seams in the Hearth
        ctx.strokeStyle = "rgba(249, 115, 22, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(hearthX + 12, hearthY + 8);
        ctx.lineTo(hearthX + 28, hearthY + 16);
        ctx.lineTo(hearthX + 48, hearthY + 10);
        ctx.moveTo(hearthX + 32, hearthY + 20);
        ctx.lineTo(hearthX + 60, hearthY + 22);
        ctx.stroke();

        // 2. Heat Aura Radial Glow
        let glowPulse = 1.0 + Math.sin(time / 160) * 0.15;
        let heatGrad = ctx.createRadialGradient(
          cx - 6,
          cy - 4,
          6,
          cx - 6,
          cy - 4,
          52 * glowPulse,
        );
        heatGrad.addColorStop(0, "rgba(255, 90, 0, 0.6)");
        heatGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.25)");
        heatGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = heatGrad;
        ctx.beginPath();
        ctx.arc(cx - 6, cy - 4, 52 * glowPulse, 0, Math.PI * 2);
        ctx.fill();

        // 3. Chimney Smoke Plumes
        for (let s = 0; s < 4; s++) {
          let seed = s * 73.1;
          let progress = (time / 850 + seed) % 1.0;
          let smkX = cx - 8 + Math.sin(time / 180 + seed) * 8;
          let smkY = cy - 42 - progress * 26;
          let smkAlpha = (1.0 - progress) * 0.35;
          let smkSize = 4.0 + progress * 7.0;

          ctx.fillStyle = `rgba(120, 113, 108, ${smkAlpha})`;
          ctx.beginPath();
          ctx.arc(smkX, smkY, smkSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // 4. Chimney Stack & Iron Bands
        ctx.fillStyle = "#292524";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(cx - 20, cy - 40, 24, 20, [3, 3, 0, 0]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#78350f";
        ctx.fillRect(cx - 21, cy - 38, 26, 3);
        ctx.strokeRect(cx - 21, cy - 38, 26, 3);
        ctx.fillRect(cx - 21, cy - 25, 26, 3);
        ctx.strokeRect(cx - 21, cy - 25, 26, 3);

        // 5. Main Blast Furnace Body
        ctx.fillStyle = "#1c1917";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(cx - 30, cy - 22, 48, 38, [5]);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "#0c0a09";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy - 12);
        ctx.lineTo(cx + 18, cy - 12);
        ctx.moveTo(cx - 30, cy - 2);
        ctx.lineTo(cx + 18, cy - 2);
        ctx.moveTo(cx - 30, cy + 8);
        ctx.lineTo(cx + 18, cy + 8);
        ctx.stroke();

        // Arched Firebox Hearth
        let flick1 = Math.sin(time / 80) * 2.5;
        let flick2 = Math.cos(time / 100) * 2.0;

        ctx.fillStyle = "#0c0a09";
        ctx.strokeStyle = "#451a03";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(cx - 20, cy - 8, 28, 22, [8, 8, 2, 2]);
        ctx.fill();
        ctx.stroke();

        let fireGrad = ctx.createRadialGradient(
          cx - 6,
          cy + 4,
          2,
          cx - 6,
          cy + 4,
          14 + flick1,
        );
        fireGrad.addColorStop(0, "#ffffff");
        fireGrad.addColorStop(0.3, "#fef08a");
        fireGrad.addColorStop(0.65, "#f97316");
        fireGrad.addColorStop(1, "#dc2626");

        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(cx - 6, cy + 4, 13 + Math.abs(flick1), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ea580c";
        ctx.beginPath();
        ctx.moveTo(cx - 18, cy + 12);
        ctx.quadraticCurveTo(
          cx - 12 + flick1,
          cy - 12 + flick2,
          cx - 8,
          cy + 4,
        );
        ctx.quadraticCurveTo(cx - 6 + flick2, cy - 14 + flick1, cx - 2, cy + 4);
        ctx.quadraticCurveTo(
          cx + 3 - flick1,
          cy - 10 + flick2,
          cx + 6,
          cy + 12,
        );
        ctx.closePath();
        ctx.fill();

        // 6. Quenching Trough (Left)
        ctx.fillStyle = "#451a03";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(cx - 36, cy + 6, 12, 16, [2]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#0284c7";
        ctx.fillRect(cx - 34, cy + 8, 8, 12);

        for (let st = 0; st < 2; st++) {
          let stmProgress = (time / 500 + st * 0.5) % 1.0;
          let stmX = cx - 30 + Math.sin(time / 150 + st) * 3;
          let stmY = cy + 6 - stmProgress * 14;
          let stmAlpha = (1.0 - stmProgress) * 0.5;

          ctx.fillStyle = `rgba(224, 242, 254, ${stmAlpha})`;
          ctx.beginPath();
          ctx.arc(stmX, stmY, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // 7. Mechanical Bellows (Far Left)
        let bellowsPump = Math.sin(time / 150) * 3;
        ctx.save();
        ctx.translate(cx - 30, cy - 2);

        ctx.fillStyle = "#78350f";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-10 - bellowsPump, -7);
        ctx.lineTo(-10 - bellowsPump, 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(0, -2, 5, 4);
        ctx.strokeRect(0, -2, 5, 4);
        ctx.restore();

        // 8. Anvil & Red-Hot Workpiece (Right)
        let anvilX = cx + 22;
        let anvilY = cy + 10;

        ctx.fillStyle = "#5c2e16";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(anvilX - 9, anvilY + 2, 18, 12, [2]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#475569";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.8;

        ctx.beginPath();
        ctx.moveTo(anvilX - 12, anvilY - 4);
        ctx.lineTo(anvilX + 8, anvilY - 4);
        ctx.lineTo(anvilX + 8, anvilY - 9);
        ctx.lineTo(anvilX - 6, anvilY - 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(anvilX - 5, anvilY - 9, 12, 1.5);

        // Red-Hot Glowing Sword Blade on Anvil
        ctx.fillStyle = "#facc15";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#f97316";
        ctx.fillRect(anvilX - 2, anvilY - 11, 10, 2.5);
        ctx.shadowBlur = 0;

        // 9. Master Blacksmith NPC Sprite
        let smithX = cx + 28;
        let smithY = cy - 2;
        let hammerCycle = (time / 400) % (Math.PI * 2);
        let hammerAngle = Math.sin(hammerCycle) * 0.4 - 0.2;

        ctx.save();
        ctx.translate(smithX, smithY);

        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.ellipse(0, 16, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#451a03";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-5, 0, 10, 15, [2]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#78350f";
        ctx.fillRect(-4, 2, 8, 11);

        ctx.fillStyle = "#d4a373";
        ctx.beginPath();
        ctx.arc(0, -5, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#78350f";
        ctx.beginPath();
        ctx.arc(0, -3, 3.5, 0, Math.PI);
        ctx.fill();

        ctx.save();
        ctx.translate(-2, 2);
        ctx.rotate(hammerAngle);

        ctx.strokeStyle = "#5c3a21";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-8, -10);
        ctx.stroke();

        ctx.fillStyle = "#334155";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1.2;
        ctx.fillRect(-11, -13, 6, 5);
        ctx.strokeRect(-11, -13, 6, 5);
        ctx.restore();

        ctx.restore();

        let isStrike = Math.sin(hammerCycle) < -0.85;
        if (isStrike) {
          for (let k = 0; k < 6; k++) {
            let spkAngle = -Math.PI / 4 - (k * Math.PI) / 8;
            let spkDist = 5 + Math.random() * 10;
            let spkX = anvilX + 2 + Math.cos(spkAngle) * spkDist;
            let spkY = anvilY - 10 + Math.sin(spkAngle) * spkDist;

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(spkX, spkY, 1.5, 1.5);
          }
        }

        for (let i = 0; i < 7; i++) {
          let seed = i * 61.8;
          let progress = (time / 800 + seed) % 1.0;
          let sparkX = cx - 6 + Math.sin(time / 130 + seed) * 14;
          let sparkY = cy - 8 - progress * 34;
          let sparkAlpha = 1.0 - progress;
          let sparkSize = 2.0 * (1.0 - progress * 0.5);

          ctx.fillStyle =
            i % 2 === 0
              ? `rgba(254, 240, 138, ${sparkAlpha})`
              : `rgba(249, 115, 22, ${sparkAlpha})`;
          ctx.fillRect(
            sparkX - sparkSize / 2,
            sparkY - sparkSize / 2,
            sparkSize,
            sparkSize,
          );
        }

        ctx.restore();
      } else if (tileType === window.TILE_TYPES.STATION_ENCHANT) {
        let cx = px + tileSize / 2;
        let cy = py + tileSize / 2;
        let time = Date.now();

        ctx.save();

        // 1. Ambient Altar Pulsing Glow
        let auraPulse = 1.0 + Math.sin(time / 200) * 0.12;
        let auraGrad = ctx.createRadialGradient(
          cx,
          cy - 6,
          4,
          cx,
          cy - 6,
          48 * auraPulse,
        );
        auraGrad.addColorStop(0, "rgba(0, 210, 255, 0.45)");
        auraGrad.addColorStop(0.45, "rgba(168, 85, 247, 0.2)");
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(cx, cy - 6, 48 * auraPulse, 0, Math.PI * 2);
        ctx.fill();

        // 2. Multi-Layer Rotating Floor Runic Circle
        ctx.save();
        ctx.translate(cx, cy + 4);
        let runeAngle1 = time / 600;
        let runeAngle2 = -time / 400;

        // Outer Runic Circle Ring
        ctx.save();
        ctx.rotate(runeAngle1);
        ctx.strokeStyle = "rgba(0, 210, 255, 0.65)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.ellipse(0, 0, 32, 16, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Cardinal Runic Studs
        for (let i = 0; i < 8; i++) {
          let ang = (i * Math.PI) / 4;
          let rx = Math.cos(ang) * 32;
          let ry = Math.sin(ang) * 16;
          ctx.fillStyle = i % 2 === 0 ? "#00d2ff" : "#e879f9";
          ctx.beginPath();
          ctx.arc(rx, ry, 2.0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Inner Counter-Rotating Ring with Radial Spokes
        ctx.save();
        ctx.rotate(runeAngle2);
        ctx.strokeStyle = "rgba(232, 121, 249, 0.75)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(0, 210, 255, 0.4)";
        ctx.lineWidth = 1.0;
        for (let i = 0; i < 4; i++) {
          let ang = (i * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * 8, Math.sin(ang) * 4);
          ctx.lineTo(Math.cos(ang) * 22, Math.sin(ang) * 11);
          ctx.stroke();
        }
        ctx.restore();

        ctx.restore();

        // 3. Altar Dais Platform
        ctx.fillStyle = "#090d16";
        ctx.strokeStyle = "#3b0764";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(cx - 36, cy + 8, 72, 16, [4]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#111a2e";
        ctx.beginPath();
        ctx.roundRect(cx - 30, cy + 3, 60, 10, [3]);
        ctx.fill();
        ctx.strokeStyle = "#00d2ff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx - 28, cy + 5);
        ctx.lineTo(cx + 28, cy + 5);
        ctx.moveTo(cx - 34, cy + 10);
        ctx.lineTo(cx + 34, cy + 10);
        ctx.stroke();

        [-32, 32].forEach((ox) => {
          ctx.fillStyle = "#1e1333";
          ctx.strokeStyle = "#d4af37";
          ctx.lineWidth = 1.2;
          ctx.fillRect(cx + ox - 3, cy + 10, 6, 12);
          ctx.strokeRect(cx + ox - 3, cy + 10, 6, 12);
        });

        // 4. Side Spires with Floating Energy Crystals
        let spireW = 12;
        let spireH = 40;
        let spireTopY = cy - 32;

        [-28, 16].forEach((spireOffset) => {
          let spX = cx + spireOffset;

          ctx.fillStyle = "#0a0714";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2.0;
          ctx.fillRect(spX - 2, cy + 1, spireW + 4, 6);
          ctx.strokeRect(spX - 2, cy + 1, spireW + 4, 6);

          ctx.fillStyle = "#161b2e";
          ctx.beginPath();
          ctx.roundRect(spX, spireTopY, spireW, spireH, [3]);
          ctx.fill();
          ctx.stroke();

          let runeGlow = 0.4 + Math.sin(time / 160 + spireOffset) * 0.45;
          ctx.strokeStyle = `rgba(0, 210, 255, ${runeGlow})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(spX + spireW / 2, spireTopY + 4);
          ctx.lineTo(spX + spireW / 2, spireTopY + spireH - 6);
          ctx.stroke();

          ctx.fillStyle = "#d4af37";
          ctx.fillRect(spX - 1, spireTopY - 2, spireW + 2, 4);
          ctx.strokeRect(spX - 1, spireTopY - 2, spireW + 2, 4);

          let floatS = Math.sin(time / 220 + spireOffset) * 2.5;
          ctx.fillStyle = spireOffset < 0 ? "#00d2ff" : "#e879f9";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(spX + spireW / 2, spireTopY - 12 + floatS);
          ctx.lineTo(spX + spireW / 2 + 4, spireTopY - 6 + floatS);
          ctx.lineTo(spX + spireW / 2, spireTopY + floatS);
          ctx.lineTo(spX + spireW / 2 - 4, spireTopY - 6 + floatS);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });

        // 5. Lectern & Floating Spectral Codex
        let lecternX = cx - 16;
        let lecternY = cy + 2;

        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(lecternX - 5, lecternY - 2, 10, 14, [2]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#334155";
        ctx.beginPath();
        ctx.moveTo(lecternX - 8, lecternY - 4);
        ctx.lineTo(lecternX + 8, lecternY - 7);
        ctx.lineTo(lecternX + 8, lecternY - 2);
        ctx.lineTo(lecternX - 8, lecternY + 1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        let bookFloat = Math.sin(time / 180) * 2;
        let bookY = lecternY - 12 + bookFloat;

        ctx.fillStyle = "#3b0764";
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(lecternX - 9, bookY - 2);
        ctx.lineTo(lecternX, bookY + 1);
        ctx.lineTo(lecternX + 9, bookY - 2);
        ctx.lineTo(lecternX + 8, bookY + 5);
        ctx.lineTo(lecternX, bookY + 7);
        ctx.lineTo(lecternX - 8, bookY + 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#e0f2fe";
        ctx.beginPath();
        ctx.moveTo(lecternX - 8, bookY - 1);
        ctx.lineTo(lecternX - 1, bookY + 1);
        ctx.lineTo(lecternX - 1, bookY + 5);
        ctx.lineTo(lecternX - 7, bookY + 4);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(lecternX + 8, bookY - 1);
        ctx.lineTo(lecternX + 1, bookY + 1);
        ctx.lineTo(lecternX + 1, bookY + 5);
        ctx.lineTo(lecternX + 7, bookY + 4);
        ctx.closePath();
        ctx.fill();

        let glyphProgress = (time / 600) % 1.0;
        let glyphY = bookY - 4 - glyphProgress * 12;
        let glyphAlpha = 1.0 - glyphProgress;
        ctx.strokeStyle = `rgba(0, 210, 255, ${glyphAlpha})`;
        ctx.lineWidth = 1.0;
        ctx.strokeRect(lecternX - 2, glyphY - 2, 4, 4);

        // 6. Mana Basin
        let basinX = cx + 16;
        let basinY = cy + 4;

        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(basinX, basinY, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        let manaGrad = ctx.createRadialGradient(
          basinX,
          basinY,
          1,
          basinX,
          basinY,
          7,
        );
        manaGrad.addColorStop(0, "#e879f9");
        manaGrad.addColorStop(0.6, "#9333ea");
        manaGrad.addColorStop(1, "#3b0764");
        ctx.fillStyle = manaGrad;
        ctx.beginPath();
        ctx.ellipse(basinX, basinY, 6.5, 3.8, 0, 0, Math.PI * 2);
        ctx.fill();

        let ripRad = ((time / 30) % 5) + 1;
        ctx.strokeStyle = `rgba(232, 121, 249, ${0.8 - ripRad / 6})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.ellipse(basinX, basinY, ripRad, ripRad * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 7. Central Arcane Enchanting Table & Levitating Crystal Matrix
        let altarY = cy - 2;

        // Stone Pedestal Base
        ctx.fillStyle = "#161b2e";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(cx - 14, altarY - 2, 28, 20, [3]);
        ctx.fill();
        ctx.stroke();

        // Gold Runic Trim on Pedestal
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(cx - 12, altarY, 24, 16);

        // Table Surface Platter
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#00d2ff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, altarY - 2, 16, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Concentric Glowing Rune Ring on Table
        ctx.strokeStyle = "rgba(232, 121, 249, 0.8)";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.ellipse(cx, altarY - 2, 11, 5.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Floating Vertical Light Beam from Altar
        let beamAlpha = 0.35 + Math.sin(time / 110) * 0.15;
        let beamGrad = ctx.createLinearGradient(
          cx,
          altarY - 2,
          cx,
          altarY - 28,
        );
        beamGrad.addColorStop(0, `rgba(0, 210, 255, ${beamAlpha})`);
        beamGrad.addColorStop(0.6, `rgba(168, 85, 247, ${beamAlpha * 0.8})`);
        beamGrad.addColorStop(1, "rgba(232, 121, 249, 0)");
        ctx.fillStyle = beamGrad;
        ctx.fillRect(cx - 8, altarY - 28, 16, 26);

        // Levitating Levitational Celestial Crystal Octahedron
        let crystalFloat = Math.sin(time / 180) * 3;
        let crystalY = altarY - 18 + crystalFloat;
        let spinAngle = time / 350;

        ctx.save();
        ctx.translate(cx, crystalY);

        // Orbiting Runic Magic Rings around Crystal
        ctx.save();
        ctx.rotate(spinAngle);
        ctx.strokeStyle = "rgba(0, 210, 255, 0.85)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.rotate(-spinAngle * 1.4 + Math.PI / 4);
        ctx.strokeStyle = "rgba(232, 121, 249, 0.85)";
        ctx.lineWidth = 1.0;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.ellipse(0, 0, 13, 5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Faceted Levitating Crystal Core
        let cW = 8 + Math.sin(time / 120) * 1.0;
        let cH = 14;

        ctx.fillStyle = "#00ffff";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);

        // Upper Top Pyramid
        ctx.beginPath();
        ctx.moveTo(0, -cH / 2);
        ctx.lineTo(cW / 2, 0);
        ctx.lineTo(0, cH * 0.1);
        ctx.lineTo(-cW / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Lower Bottom Pyramid
        ctx.fillStyle = "#9333ea";
        ctx.beginPath();
        ctx.moveTo(0, cH / 2);
        ctx.lineTo(cW / 2, 0);
        ctx.lineTo(0, cH * 0.1);
        ctx.lineTo(-cW / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Facet Shading Highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.moveTo(0, -cH / 2);
        ctx.lineTo(cW / 2, 0);
        ctx.lineTo(0, cH * 0.1);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // 8. Upward Drifting Cosmic Star Dust Sparks
        for (let i = 0; i < 8; i++) {
          let seed = i * 47.3;
          let progress = (time / 700 + seed) % 1.0;
          let sparkX = cx + Math.sin(time / 140 + seed) * 18;
          let sparkY = altarY - progress * 36;
          let alpha = (1.0 - progress) * 0.9;
          let size = 2.0 * (1.0 - progress * 0.3);

          ctx.fillStyle =
            i % 2 === 0
              ? `rgba(0, 210, 255, ${alpha})`
              : `rgba(232, 121, 249, ${alpha})`;
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      } else if (tileType === window.TILE_TYPES.STATION_INN) {
        let cx = px + tileSize / 2;
        let cy = py + tileSize / 2;
        let time = Date.now();

        ctx.save();

        ctx.fillStyle = "#5c2e16";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.8;

        ctx.beginPath();
        ctx.roundRect(cx - 34, cy - 12, 10, 26, [3]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#047857";
        ctx.fillRect(cx - 32, cy - 10, 6, 22);

        ctx.fillStyle = "#5c2e16";
        ctx.beginPath();
        ctx.roundRect(cx + 24, cy - 12, 10, 26, [3]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#047857";
        ctx.fillRect(cx + 26, cy - 10, 6, 22);

        ctx.fillStyle = "#d4af37";
        ctx.fillRect(cx - 34, cy - 12, 3, 3);
        ctx.fillRect(cx - 34, cy + 11, 3, 3);
        ctx.fillRect(cx + 31, cy - 12, 3, 3);
        ctx.fillRect(cx + 31, cy + 11, 3, 3);

        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.2;

        ctx.beginPath();
        ctx.arc(cx, cy + 4, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#334155";
        ctx.beginPath();
        ctx.arc(cx, cy + 4, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        let waterGrad = ctx.createRadialGradient(cx, cy + 4, 2, cx, cy + 4, 17);
        waterGrad.addColorStop(0, "#34d399");
        waterGrad.addColorStop(0.5, "#059669");
        waterGrad.addColorStop(1, "#044e3a");

        ctx.fillStyle = waterGrad;
        ctx.beginPath();
        ctx.arc(cx, cy + 4, 17, 0, Math.PI * 2);
        ctx.fill();

        for (let r = 0; r < 2; r++) {
          let rippleRad = ((time / 35 + r * 8) % 15) + 2;
          let rippleAlpha = 0.5 * (1.0 - rippleRad / 17);

          ctx.strokeStyle = `rgba(167, 243, 208, ${rippleAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy + 4, rippleRad, 0, Math.PI * 2);
          ctx.stroke();
        }

        let floatY = Math.sin(time / 220) * 4;
        let crystalSpin = Math.sin(time / 180) * 4;

        let haloRad = 16 + Math.sin(time / 140) * 2;
        let haloGrad = ctx.createRadialGradient(
          cx,
          cy - 14 + floatY,
          2,
          cx,
          cy - 14 + floatY,
          haloRad,
        );
        haloGrad.addColorStop(0, "rgba(52, 211, 153, 0.7)");
        haloGrad.addColorStop(0.6, "rgba(16, 185, 129, 0.25)");
        haloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(cx, cy - 14 + floatY, haloRad, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#34d399";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 24 + floatY);
        ctx.lineTo(cx + 8 + crystalSpin * 0.2, cy - 14 + floatY);
        ctx.lineTo(cx, cy - 4 + floatY);
        ctx.lineTo(cx - 8 - crystalSpin * 0.2, cy - 14 + floatY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 24 + floatY);
        ctx.lineTo(cx + crystalSpin * 0.5, cy - 14 + floatY);
        ctx.lineTo(cx, cy - 4 + floatY);
        ctx.stroke();

        for (let i = 0; i < 6; i++) {
          let seed = i * 71.4;
          let progress = (time / 650 + seed) % 1.0;
          let sporeX = cx + Math.sin(time / 140 + seed) * 14;
          let sporeY = cy + 4 - progress * 28;
          let sporeAlpha = (1.0 - progress) * 0.85;
          let sporeSize = 1.8 * (1.0 - progress * 0.3);

          ctx.fillStyle =
            i % 2 === 0
              ? `rgba(167, 243, 208, ${sporeAlpha})`
              : `rgba(52, 211, 153, ${sporeAlpha})`;
          ctx.beginPath();
          ctx.arc(sporeX, sporeY, sporeSize, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      } else if (tileType === window.TILE_TYPES.STATION_SHOP) {
        let cx = px + tileSize / 2;
        let cy = py + tileSize / 2;
        let time = Date.now();

        ctx.save();

        // 1. Woven Ornamental Rug Base Pad (Underneath the stall)
        let rugW = 72;
        let rugH = 28;
        let rugX = cx - rugW / 2;
        let rugY = cy - 6;

        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.beginPath();
        ctx.roundRect(rugX - 2, rugY - 2, rugW + 4, rugH + 4, [4]);
        ctx.fill();

        ctx.fillStyle = "#6b1111";
        ctx.strokeStyle = "#4a0b0b";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(rugX, rugY, rugW, rugH, [3]);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 1.0;
        ctx.strokeRect(rugX + 3, rugY + 3, rugW - 6, rugH - 6);

        ctx.fillStyle = "#f1c40f";
        for (let tX = rugX + 4; tX <= rugX + rugW - 4; tX += 6) {
          ctx.fillRect(tX - 1, rugY - 3, 2, 3);
          ctx.fillRect(tX - 1, rugY + rugH, 2, 3);
        }

        // 2. Oak Trade Counter Structure
        let tableW = 60;
        let tableH = 18;
        let tableX = cx - tableW / 2;
        let tableY = cy - 2;

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.beginPath();
        ctx.ellipse(
          cx,
          tableY + tableH + 2,
          tableW / 2 + 4,
          4,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        ctx.fillStyle = "#4a2d18";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(tableX, tableY, tableW, tableH, [2]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#331c0e";
        ctx.fillRect(tableX + 4, tableY + 3, 14, tableH - 6);
        ctx.strokeRect(tableX + 4, tableY + 3, 14, tableH - 6);
        ctx.fillRect(tableX + 23, tableY + 3, 14, tableH - 6);
        ctx.strokeRect(tableX + 23, tableY + 3, 14, tableH - 6);
        ctx.fillRect(tableX + 42, tableY + 3, 14, tableH - 6);
        ctx.strokeRect(tableX + 42, tableY + 3, 14, tableH - 6);

        ctx.fillStyle = "#78350f";
        ctx.fillRect(tableX - 2, tableY - 3, tableW + 4, 5);
        ctx.strokeRect(tableX - 2, tableY - 3, tableW + 4, 5);

        ctx.fillStyle = "#800020";
        ctx.fillRect(cx - 16, tableY - 3, 32, 5);
        ctx.strokeStyle = "#f1c40f";
        ctx.lineWidth = 0.8;
        ctx.strokeRect(cx - 16, tableY - 3, 32, 5);

        // Wares Displayed on Counter
        ctx.fillStyle = "#2ecc71";
        ctx.beginPath();
        ctx.arc(cx - 10, tableY - 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(cx - 11, tableY - 8, 2, 2);

        ctx.fillStyle = "#d4af37";
        ctx.beginPath();
        ctx.ellipse(cx, tableY - 4, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.fillStyle = "#bdc3c7";
        ctx.beginPath();
        ctx.moveTo(cx + 8, tableY - 7);
        ctx.lineTo(cx + 12, tableY - 3);
        ctx.lineTo(cx + 10, tableY - 2);
        ctx.closePath();
        ctx.fill();

        // 3. Canopy Support Posts
        let postLeftX = tableX - 2;
        let postRightX = tableX + tableW - 2;
        let postTopY = cy - 32;

        ctx.fillStyle = "#3d1d0b";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.8;

        ctx.fillRect(postLeftX, postTopY, 4, 30);
        ctx.strokeRect(postLeftX, postTopY, 4, 30);
        ctx.fillRect(postRightX, postTopY, 4, 30);
        ctx.strokeRect(postRightX, postTopY, 4, 30);

        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(postLeftX - 1, postTopY - 1, 6, 3);
        ctx.fillRect(postRightX - 1, postTopY - 1, 6, 3);

        // 4. Striped Velvet Canopy Awning
        let awningW = 68;
        let awningH = 14;
        let awningX = cx - awningW / 2;
        let awningY = postTopY - 8;

        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.roundRect(awningX - 1, awningY + 2, awningW + 2, awningH, [3]);
        ctx.fill();

        ctx.fillStyle = "#8b0000";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(awningX, awningY, awningW, awningH, [4, 4, 0, 0]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#f1c40f";
        let stripeW = 8;
        for (
          let sX = awningX + 6;
          sX < awningX + awningW - 4;
          sX += stripeW * 2
        ) {
          ctx.fillRect(sX, awningY, stripeW, awningH);
        }

        ctx.fillStyle = "#8b0000";
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 1.2;

        let scallopCount = 7;
        let scallopW = awningW / scallopCount;
        for (let i = 0; i < scallopCount; i++) {
          let scX = awningX + i * scallopW + scallopW / 2;
          let scY = awningY + awningH;
          ctx.beginPath();
          ctx.arc(scX, scY, scallopW / 2, 0, Math.PI);
          ctx.fill();
          ctx.stroke();
        }

        // 5. Dual Hanging Brass Lanterns
        let lanternSway1 = Math.sin(time / 180) * 2;
        let lanternSway2 = Math.cos(time / 210) * 2;

        let l1X = postLeftX + 2 + lanternSway1;
        let l1Y = postTopY + 10;
        ctx.strokeStyle = "#f1c40f";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(postLeftX + 2, postTopY + 4);
        ctx.lineTo(l1X, l1Y);
        ctx.stroke();

        ctx.fillStyle = "#ffd700";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(l1X, l1Y + 3, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(l1X, l1Y + 3, 1.2, 0, Math.PI * 2);
        ctx.fill();

        let l2X = postRightX + 2 + lanternSway2;
        let l2Y = postTopY + 10;
        ctx.strokeStyle = "#f1c40f";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(postRightX + 2, postTopY + 4);
        ctx.lineTo(l2X, l2Y);
        ctx.stroke();

        ctx.fillStyle = "#ffd700";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(l2X, l2Y + 3, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(l2X, l2Y + 3, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // 6. Ambient Drifting Gold Spark Particles
        for (let i = 0; i < 4; i++) {
          let seed = i * 53.7;
          let progress = (time / 700 + seed) % 1.0;
          let sparkX = cx + Math.sin(time / 140 + seed) * 24;
          let sparkY = tableY - progress * 20;
          let alpha = (1.0 - progress) * 0.8;
          let size = 1.5 * (1.0 - progress * 0.3);

          ctx.fillStyle = `rgba(241, 196, 15, ${alpha})`;
          ctx.fillRect(sparkX - size / 2, sparkY - size / 2, size, size);
        }

        ctx.restore();
      } else if (tileType === window.TILE_TYPES.STATION_GACHAPON) {
        let cx = px + tileSize / 2;
        let cy = py + tileSize / 2;
        let time = Date.now();

        ctx.save();

        // 1. Neon Grid Base Pad
        let padW = 72;
        let padH = 28;
        let padX = cx - padW / 2;
        let padY = cy - 6;

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.beginPath();
        ctx.roundRect(padX - 2, padY - 2, padW + 4, padH + 4, [4]);
        ctx.fill();

        ctx.fillStyle = "#090d16";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(padX, padY, padW, padH, [3]);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "rgba(232, 121, 249, 0.35)";
        ctx.lineWidth = 1.0;
        ctx.strokeRect(padX + 3, padY + 3, padW - 6, padH - 6);

        // Corner LED Studs
        ctx.fillStyle = "#00d2ff";
        ctx.beginPath();
        ctx.arc(padX + 4, padY + 4, 2, 0, Math.PI * 2);
        ctx.arc(padX + padW - 4, padY + 4, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#e879f9";
        ctx.beginPath();
        ctx.arc(padX + 4, padY + padH - 4, 2, 0, Math.PI * 2);
        ctx.arc(padX + padW - 4, padY + padH - 4, 2, 0, Math.PI * 2);
        ctx.fill();

        // 2. Main Arcade Cabinet Chassis
        let cabW = 44;
        let cabH = 42;
        let cabX = cx - cabW / 2;
        let cabY = cy - 24;

        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.beginPath();
        ctx.ellipse(cx, cabY + cabH + 2, cabW / 2 + 4, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#1e1b4b";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(cabX, cabY, cabW, cabH, [4]);
        ctx.fill();
        ctx.stroke();

        // Neon Side Strips
        let sidePulse = Math.sin(time / 150) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(232, 121, 249, ${sidePulse})`;
        ctx.fillRect(cabX + 2, cabY + 4, 3, cabH - 8);
        ctx.fillRect(cabX + cabW - 5, cabY + 4, 3, cabH - 8);

        // Top Marquee Banner Header
        ctx.fillStyle = "#312e81";
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(cabX + 4, cabY - 12, cabW - 8, 12, [3, 3, 0, 0]);
        ctx.fill();
        ctx.stroke();

        ctx.font = "900 8px monospace";
        ctx.fillStyle = "#ffd700";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("GACHA", cx, cabY - 6);

        // 3. Glass Dome & Capsules
        let domeCx = cx;
        let domeCy = cabY + 12;
        let domeR = 15;

        // Background Dome Interior
        ctx.fillStyle = "#020617";
        ctx.beginPath();
        ctx.arc(domeCx, domeCy, domeR, 0, Math.PI * 2);
        ctx.fill();

        // Colorful Capsule Spheres
        let capsuleColors = [
          { c1: "#f1c40f", c2: "#ffffff" },
          { c1: "#00d2ff", c2: "#ffffff" },
          { c1: "#e84393", c2: "#ffffff" },
          { c1: "#2ecc71", c2: "#ffffff" },
          { c1: "#a855f7", c2: "#ffffff" },
          { c1: "#e67e22", c2: "#ffffff" },
          { c1: "#ff4757", c2: "#ffffff" },
          { c1: "#00ffff", c2: "#ffffff" },
        ];

        for (let i = 0; i < 8; i++) {
          let seed = i * 48.2;
          let jitter = Math.sin(time / 200 + seed) * 0.8;
          let capX = domeCx + Math.sin(seed * 1.3) * 9 + jitter;
          let capY = domeCy + Math.cos(seed * 0.9) * 7;

          let col = capsuleColors[i % capsuleColors.length];

          ctx.save();
          ctx.translate(capX, capY);
          ctx.rotate(seed);

          ctx.fillStyle = col.c1;
          ctx.beginPath();
          ctx.arc(0, 0, 3.2, Math.PI / 2, -Math.PI / 2);
          ctx.fill();

          ctx.fillStyle = col.c2;
          ctx.beginPath();
          ctx.arc(0, 0, 3.2, -Math.PI / 2, Math.PI / 2);
          ctx.fill();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
        }

        // Glass Shell Overlay & Glare
        let glassGrad = ctx.createRadialGradient(
          domeCx - 4,
          domeCy - 4,
          2,
          domeCx,
          domeCy,
          domeR,
        );
        glassGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
        glassGrad.addColorStop(0.5, "rgba(224, 242, 254, 0.15)");
        glassGrad.addColorStop(1, "rgba(15, 23, 42, 0.65)");

        ctx.fillStyle = glassGrad;
        ctx.strokeStyle = "#00d2ff";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(domeCx, domeCy, domeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(
          domeCx,
          domeCy,
          domeR - 2,
          -Math.PI * 0.7,
          -Math.PI * 0.25,
          false,
        );
        ctx.stroke();

        // 4. Control Deck & Crank Handle
        let deckY = cabY + 28;

        ctx.fillStyle = "#312e81";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(cabX + 6, deckY, cabW - 12, 12, [2]);
        ctx.fill();
        ctx.stroke();

        // Coin Slot
        ctx.fillStyle = "#ffd700";
        ctx.fillRect(cabX + 10, deckY + 4, 3, 5);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 0.8;
        ctx.strokeRect(cabX + 10, deckY + 4, 3, 5);

        // Rotary Crank Handle
        let crankAngle = (time / 800) % (Math.PI * 2);
        let crankX = cx + 8;
        let crankY = deckY + 6;

        ctx.save();
        ctx.translate(crankX, crankY);
        ctx.rotate(crankAngle);

        ctx.fillStyle = "#cbd5e1";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.0;
        ctx.fillRect(-5, -1.5, 10, 3);
        ctx.strokeRect(-5, -1.5, 10, 3);

        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.arc(4, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Dispenser Hatch Bin
        ctx.fillStyle = "#020617";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(cx - 7, deckY + 3, 11, 7, [2]);
        ctx.fill();
        ctx.stroke();

        // 5. Floating Ambient Neon Spark Particles
        for (let i = 0; i < 5; i++) {
          let seed = i * 53.4;
          let progress = (time / 750 + seed) % 1.0;
          let sparkX = cx + Math.sin(time / 150 + seed) * 20;
          let sparkY = cabY + cabH - progress * 32;
          let alpha = (1.0 - progress) * 0.85;
          let size = 1.8 * (1.0 - progress * 0.3);

          ctx.fillStyle =
            i % 2 === 0
              ? `rgba(0, 210, 255, ${alpha})`
              : `rgba(232, 121, 249, ${alpha})`;
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    };

    // PASS 2.5: Environmental Props (Wall Torches, Guild Banners & Bioluminescent Mushrooms)
    let time = Date.now();

    // Render Guild Banners on North Wall (Adventurer's Hub)
    if (isHub) {
      let bannerCols = [6, 10, 13, 17];
      bannerCols.forEach((bc) => {
        let bx = bc * tileSize + tileSize / 2;
        let by = 2 * tileSize - 2;

        ctx.save();
        // Crimson Banner Cloth
        ctx.fillStyle = "#991b1b";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx - 8, by);
        ctx.lineTo(bx + 8, by);
        ctx.lineTo(bx + 8, by + 18);
        ctx.lineTo(bx, by + 24);
        ctx.lineTo(bx - 8, by + 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Gold Trim Lines
        ctx.strokeStyle = "#f1c40f";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx - 6, by + 2);
        ctx.lineTo(bx + 6, by + 2);
        ctx.moveTo(bx, by + 5);
        ctx.lineTo(bx, by + 16);
        ctx.stroke();
        ctx.restore();
      });
    }

    // Render Wall Torches
    if (map.torches && map.torches.length > 0) {
      map.torches.forEach((t) => {
        let tx = t.x * tileSize + tileSize / 2;
        let ty = t.y * tileSize + tileSize - 8;

        ctx.save();
        // Iron Sconce Bracket
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(tx - 2, ty - 2, 4, 6);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.strokeRect(tx - 2, ty - 2, 4, 6);

        // Flickering Dynamics
        let flick = Math.sin(time / 70 + t.x * 3) * 2;
        let flick2 = Math.cos(time / 90 + t.y * 5) * 1.5;

        // Radial Heat Halo behind torch
        let haloRadius = 24 + Math.abs(flick) * 2;
        let haloGrad = ctx.createRadialGradient(
          tx,
          ty - 6,
          2,
          tx,
          ty - 6,
          haloRadius,
        );
        haloGrad.addColorStop(0, "rgba(255, 160, 20, 0.45)");
        haloGrad.addColorStop(0.5, "rgba(255, 80, 0, 0.18)");
        haloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(tx, ty - 6, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        // Outer Blazing Flame Body
        ctx.fillStyle = "#ff3300";
        ctx.beginPath();
        ctx.moveTo(tx - 4, ty - 2);
        ctx.quadraticCurveTo(
          tx - 5 + flick2,
          ty - 10 + flick,
          tx,
          ty - 14 + flick2,
        );
        ctx.quadraticCurveTo(tx + 5 - flick, ty - 10 - flick2, tx + 4, ty - 2);
        ctx.closePath();
        ctx.fill();

        // Inner Golden Core Flame
        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.moveTo(tx - 2.5, ty - 3);
        ctx.quadraticCurveTo(tx - 2 + flick, ty - 8, tx, ty - 11 + flick2);
        ctx.quadraticCurveTo(tx + 2 - flick2, ty - 8, tx + 2.5, ty - 3);
        ctx.closePath();
        ctx.fill();

        // White-hot Center Tip
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(tx, ty - 5 + flick2 * 0.5, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Drifting Ember Sparks
        for (let i = 0; i < 3; i++) {
          let sparkSeed = i * 43.1 + t.x * 17.3 + t.y * 31.7;
          let progress = (time / 600 + sparkSeed) % 1.0;
          let sparkX = tx + Math.sin(time / 120 + sparkSeed) * 6;
          let sparkY = ty - 6 - progress * 18;
          let sparkAlpha = (1.0 - progress) * 0.85;
          let sparkSize = 1.4 * (1.0 - progress * 0.5);

          ctx.fillStyle =
            i % 2 === 0
              ? `rgba(255, 215, 0, ${sparkAlpha})`
              : `rgba(255, 85, 0, ${sparkAlpha})`;
          ctx.fillRect(
            sparkX - sparkSize / 2,
            sparkY - sparkSize / 2,
            sparkSize,
            sparkSize,
          );
        }

        ctx.restore();
      });
    }

    // Render Bioluminescent Mushroom Clusters
    if (map.shrooms && map.shrooms.length > 0) {
      map.shrooms.forEach((s) => {
        let sx = s.x * tileSize + tileSize / 2;
        let sy = s.y * tileSize + tileSize / 2;

        ctx.save();
        let shroomSeeds = [-4, 2, 5];
        shroomSeeds.forEach((offX, idx) => {
          let shX = sx + offX;
          let shY = sy + (idx % 2 === 0 ? -2 : 3);

          // Pale Stem
          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(shX, shY + 3);
          ctx.lineTo(shX, shY);
          ctx.stroke();

          // Glowing Cyan Cap
          ctx.fillStyle = idx === 1 ? "#2ecc71" : "#00f0ff";
          ctx.beginPath();
          ctx.arc(shX, shY - 1, 3 - idx * 0.5, Math.PI, 0);
          ctx.closePath();
          ctx.fill();

          // Glowing Dots
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(shX - 1, shY - 2, 1, 1);
        });
        ctx.restore();
      });
    }

    // PASS 2.6: Sector-Specific Biome Hazards, Animated Particle Fog, and Environmental Effects
    if (!isHub) {
      let depth = window.player ? window.player.depth || 1 : 1;
      let sector = Math.floor((depth - 1) / 12);
      let isEco = window.playerStats && window.playerStats.ecoMode;

      let viewMinX = camera.x;
      let viewMaxX = camera.x + effW;
      let viewMinY = camera.y;
      let viewMaxY = camera.y + effH;

      ctx.save();

      // Sector 0: Whispering Woods - Drifting Pollen Spore Mist
      if (sector === 0) {
        let sporeCount = isEco ? 4 : 14;
        for (let i = 0; i < sporeCount; i++) {
          let seed = i * 31.7;
          let progressX = (time / 3200 + seed) % 1.0;
          let progressY = (time / 2200 + seed * 1.3) % 1.0;
          let spX = viewMinX + progressX * effW;
          let spY =
            viewMinY + Math.sin(time / 500 + seed) * 16 + progressY * effH;
          let alpha = Math.sin(progressX * Math.PI) * 0.55;

          ctx.fillStyle = `rgba(163, 253, 131, ${alpha})`;
          ctx.beginPath();
          ctx.arc(spX, spY, 1.8 + (i % 2) * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Sector 1: Mountain Peaks - Frost Shimmer & Snow Wisps
      else if (sector === 1) {
        let wispCount = isEco ? 5 : 16;
        for (let i = 0; i < wispCount; i++) {
          let seed = i * 47.1;
          let progressX = (time / 1800 + seed) % 1.0;
          let wx = viewMinX + progressX * effW;
          let wy =
            viewMinY + ((seed * 19.3) % effH) + Math.sin(time / 350 + i) * 8;
          let alpha = Math.sin(progressX * Math.PI) * 0.5;

          ctx.fillStyle = `rgba(224, 242, 254, ${alpha})`;
          ctx.beginPath();
          ctx.ellipse(
            wx,
            wy,
            4.5 + (i % 3) * 2,
            1.2,
            -Math.PI / 12,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
      // Sector 2: Inferno Depths - Lava Vents & Rising Embers
      else if (sector === 2) {
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            if (map.grid[r][c] === window.TILE_TYPES.FLOOR) {
              let tileHash =
                Math.abs(Math.sin(c * 17.123 + r * 43.51) * 43758.5453) % 1.0;
              if (tileHash > 0.88) {
                let vx = c * tileSize + tileSize / 2;
                let vy = r * tileSize + tileSize / 2;
                let vPulse = Math.sin(time / 150 + tileHash * 10) * 0.5 + 0.5;

                ctx.fillStyle = `rgba(249, 115, 22, ${0.2 + vPulse * 0.25})`;
                ctx.beginPath();
                ctx.ellipse(
                  vx,
                  vy,
                  10 + vPulse * 3,
                  5 + vPulse * 1.5,
                  0,
                  0,
                  Math.PI * 2,
                );
                ctx.fill();

                if (!isEco && vPulse > 0.7) {
                  let sparkY = vy - (vPulse - 0.7) * 20;
                  ctx.fillStyle = "#fef08a";
                  ctx.fillRect(vx + (tileHash * 8 - 4), sparkY, 1.5, 1.5);
                }
              }
            }
          }
        }
      }
      // Sector 3: Fungal Swamp - Toxic Spore Bubbles & Puddle Ripples
      else if (sector === 3) {
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            if (map.grid[r][c] === window.TILE_TYPES.FLOOR) {
              let tileHash =
                Math.abs(Math.sin(c * 23.45 + r * 81.12) * 43758.5453) % 1.0;
              if (tileHash > 0.85) {
                let px = c * tileSize + tileSize / 2;
                let py = r * tileSize + tileSize / 2;
                let ripRad = ((time / 40 + tileHash * 20) % 12) + 1;
                let ripAlpha = (1.0 - ripRad / 13) * 0.4;

                ctx.strokeStyle = `rgba(52, 211, 153, ${ripAlpha})`;
                ctx.lineWidth = 1.0;
                ctx.beginPath();
                ctx.ellipse(px, py, ripRad, ripRad * 0.5, 0, 0, Math.PI * 2);
                ctx.stroke();
              }
            }
          }
        }
      }
      // Sector 4+: Void Singularity - Dimensional Rift Tears & Cosmic Star Drift
      else {
        let starCount = isEco ? 6 : 20;
        for (let i = 0; i < starCount; i++) {
          let seed = i * 59.2;
          let progress = (time / 2500 + seed) % 1.0;
          let stX =
            viewMinX +
            ((seed * 31.1) % effW) +
            Math.cos(time / 500 + seed) * 12;
          let stY =
            viewMinY +
            ((seed * 17.7) % effH) +
            Math.sin(time / 500 + seed) * 12;
          let stAlpha = Math.sin(progress * Math.PI) * 0.75;

          ctx.fillStyle =
            i % 2 === 0
              ? `rgba(232, 121, 249, ${stAlpha})`
              : `rgba(56, 189, 248, ${stAlpha})`;
          ctx.beginPath();
          ctx.arc(stX, stY, 1.2 + (i % 2) * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // PASS 3: Map Perimeter Border Frame
    let mapPxW = map.width * tileSize;
    let mapPxH = map.height * tileSize;

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3;
    ctx.strokeRect(-1, -1, mapPxW + 2, mapPxH + 2);

    ctx.strokeStyle = "rgba(0, 210, 255, 0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-3, -3, mapPxW + 6, mapPxH + 6);

    ctx.restore();
  };

  window.renderMinimap = function (ctx, canvas) {
    let map = window.activeDungeonMap;
    if (!map || !map.grid || map.grid.length === 0) return;

    let mw = 90;
    let mh = 50;
    let mx = canvas.width - mw - 10;
    let my = 58;

    ctx.save();
    ctx.fillStyle = "rgba(5, 3, 10, 0.88)";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeRect(mx, my, mw, mh);

    let scaleX = mw / map.width;
    let scaleY = mh / map.height;
    let totalWorldW = map.width * map.tileSize;
    let totalWorldH = map.height * map.tileSize;

    // 1. Render Explored Floor Terrain (Filtered by Fog of War)
    for (let r = 0; r < map.height; r++) {
      for (let c = 0; c < map.width; c++) {
        let isExplored =
          map.exploredGrid && map.exploredGrid[r] && map.exploredGrid[r][c];
        if (!isExplored) continue;

        let tile = map.grid[r][c];
        if (
          tile === window.TILE_TYPES.FLOOR ||
          tile === window.TILE_TYPES.SPAWN_PLAYER ||
          tile === window.TILE_TYPES.EXTRACTION_ZONE ||
          tile === window.TILE_TYPES.DESCENT_PORTAL ||
          tile === window.TILE_TYPES.BOSS_GATE ||
          tile === window.TILE_TYPES.CHEST_SPAWN
        ) {
          ctx.fillStyle = "#334155";
          ctx.fillRect(
            mx + c * scaleX,
            my + r * scaleY,
            Math.max(1, scaleX),
            Math.max(1, scaleY),
          );
        }
      }
    }

    // 2. Render Discovered Portal (Hidden until tile explored and seen on screen)
    if (map.portalDiscovered && map.extractionTile) {
      let pTileX = map.extractionTile.x;
      let pTileY = map.extractionTile.y;
      let isExplored =
        map.exploredGrid &&
        map.exploredGrid[pTileY] &&
        map.exploredGrid[pTileY][pTileX];
      if (isExplored) {
        let pPx = mx + (pTileX + 0.5) * scaleX;
        let pPy = my + (pTileY + 0.5) * scaleY;
        let pulse = Math.sin(Date.now() / 180) * 1.0;

        ctx.fillStyle = "rgba(0, 210, 255, 0.3)";
        ctx.beginPath();
        ctx.arc(pPx, pPy, 4 + pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#00d2ff";
        ctx.beginPath();
        ctx.arc(pPx, pPy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Render Discovered Enemies (Shown on minimap once seen on screen)
    if (window.activeDungeonMobs) {
      window.activeDungeonMobs.forEach((m) => {
        if (m.discovered) {
          let mPx = mx + ((m.x + (m.w || 24) / 2) / totalWorldW) * mw;
          let mPy = my + ((m.y + (m.h || 24) / 2) / totalWorldH) * mh;
          ctx.fillStyle = m.isRare ? "#f1c40f" : "#e74c3c";
          ctx.fillRect(mPx - 1, mPy - 1, 2.5, 2.5);
        }
      });
    }

    if (window.mob && window.mob.discovered) {
      let bm = window.mob;
      let bPx = mx + ((bm.x + (bm.w || 48) / 2) / totalWorldW) * mw;
      let bPy = my + ((bm.y + (bm.h || 48) / 2) / totalWorldH) * mh;
      let bPulse = Math.sin(Date.now() / 120) * 1.0;

      ctx.fillStyle = "#ff0055";
      ctx.beginPath();
      ctx.arc(bPx, bPy, 3 + bPulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Render Live Player Marker
    let p = window.player;
    if (p) {
      let pPx = mx + (p.x / totalWorldW) * mw;
      let pPy = my + (p.y / totalWorldH) * mh;
      let pPulse = Math.sin(Date.now() / 150) * 1.5;

      ctx.fillStyle = "rgba(46, 204, 113, 0.4)";
      ctx.beginPath();
      ctx.arc(pPx, pPy, 4 + pPulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#2ecc71";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pPx, pPy, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  };
})();
