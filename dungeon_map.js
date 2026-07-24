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
      this.rooms = [];
      this.spawnTile = { x: 0, y: 0 };
      this.extractionTile = { x: 0, y: 0 };
      this.chests = [];
      this.mobSpawns = [];
      this.stations = [];
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
      this.width = 24;
      this.height = 16;

      this.grid = Array.from({ length: this.height }, () =>
        Array(this.width).fill(window.TILE_TYPES.WALL),
      );

      for (let y = 2; y < this.height - 2; y++) {
        for (let x = 2; x < this.width - 2; x++) {
          this.grid[y][x] = window.TILE_TYPES.FLOOR;
        }
      }

      let cx = Math.floor(this.width / 2);
      let cy = Math.floor(this.height / 2);

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
          type: window.TILE_TYPES.STATION_STASH,
          label: "STORAGE VAULT",
          x: cx,
          y: this.height - 5,
        },
        {
          type: window.TILE_TYPES.STATION_INN,
          label: "RECOVERY INN",
          x: this.width - 6,
          y: cy,
        },
      ];

      this.stations.forEach((st) => {
              if (this.grid[st.y] && this.grid[st.y][st.x] !== undefined) {
                this.grid[st.y][st.x] = st.type;
              }
            });

            return this;
          }

          generateBossArena() {
            this.reset();
            this.depth = 4;
            this.width = 16;
            this.height = 16;

            this.grid = Array.from({ length: this.height }, () =>
              Array(this.width).fill(window.TILE_TYPES.WALL)
            );

            for (let y = 2; y < this.height - 2; y++) {
              for (let x = 2; x < this.width - 2; x++) {
                this.grid[y][x] = window.TILE_TYPES.FLOOR;
              }
            }

            let cx = Math.floor(this.width / 2);

            this.spawnTile = { x: cx, y: this.height - 4 };
            this.grid[this.spawnTile.y][this.spawnTile.x] = window.TILE_TYPES.SPAWN_PLAYER;

            this.chests = [];
            this.mobSpawns = [];

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

      for (let i = 0; i < this.rooms.length - 1; i++) {
        this.connectRooms(this.rooms[i], this.rooms[i + 1]);
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
            if (y + 1 < this.height - 1) this.grid[y + 1][x] = window.TILE_TYPES.FLOOR;
            x += x < r2.cx ? 1 : -1;
          }
          while (y !== r2.cy) {
            this.grid[y][x] = window.TILE_TYPES.FLOOR;
            if (x + 1 < this.width - 1) this.grid[y][x + 1] = window.TILE_TYPES.FLOOR;
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

          let startRoom = this.rooms[0];
          this.spawnTile = { x: startRoom.cx, y: startRoom.cy };
          this.grid[startRoom.cy][startRoom.cx] = window.TILE_TYPES.SPAWN_PLAYER;

          let farthestRoom = startRoom;
          let maxDist = 0;

          this.rooms.forEach((r) => {
            let dist =
              Math.abs(r.cx - startRoom.cx) + Math.abs(r.cy - startRoom.cy);
            if (dist > maxDist) {
              maxDist = dist;
              farthestRoom = r;
            }
          });

          this.extractionTile = { x: farthestRoom.cx, y: farthestRoom.cy };
          this.grid[farthestRoom.cy][farthestRoom.cx] = window.TILE_TYPES.DESCENT_PORTAL;
        }

    populateEntities() {
      this.chests = [];
      this.mobSpawns = [];

      let d = this.depth;
      let mobDensityMult = 1.0 + 0.15 * Math.pow(d, 0.6);

      this.rooms.forEach((room, idx) => {
        if (idx === 0) return;

        if (Math.random() < 0.20) {
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
      });
    }
  }

  class Camera {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.viewportW = 750;
      this.viewportH = 320;
    }

    update(targetX, targetY, mapWidthPx, mapHeightPx) {
      this.x = targetX - this.viewportW / 2;
      this.y = targetY - this.viewportH / 2;

      this.x = Math.max(0, Math.min(this.x, mapWidthPx - this.viewportW));
      this.y = Math.max(0, Math.min(this.y, mapHeightPx - this.viewportH));
    }
  }

  window.DungeonMapGenerator = DungeonMapGenerator;
  window.DungeonCamera = new Camera();
  window.activeDungeonMap = new DungeonMapGenerator();

  window.renderTopDownMap = function (ctx, canvas) {
    let map = window.activeDungeonMap;
    if (!map || !map.grid || map.grid.length === 0) return;

    let tileSize = map.tileSize;
    let camera = window.DungeonCamera;
    camera.viewportW = canvas.width;
    camera.viewportH = canvas.height;

    let startCol = Math.max(0, Math.floor(camera.x / tileSize));
    let endCol = Math.min(
      map.width - 1,
      Math.ceil((camera.x + camera.viewportW) / tileSize),
    );
    let startRow = Math.max(0, Math.floor(camera.y / tileSize));
    let endRow = Math.min(
      map.height - 1,
      Math.ceil((camera.y + camera.viewportH) / tileSize),
    );

    ctx.save();
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        let tile = map.grid[r][c];
        let px = c * tileSize;
        let py = r * tileSize;

        if (tile === window.TILE_TYPES.VOID) {
          ctx.fillStyle = "#05030a";
          ctx.fillRect(px, py, tileSize, tileSize);
        } else if (tile === window.TILE_TYPES.WALL) {
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(px, py, tileSize, tileSize);
          ctx.strokeStyle = "#0f172a";
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2);

          ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + tileSize, py);
          ctx.stroke();
        } else {
          ctx.fillStyle = (c + r) % 2 === 0 ? "#0f141d" : "#0d111a";
          ctx.fillRect(px, py, tileSize, tileSize);
          ctx.strokeStyle = "#161d2a";
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, tileSize, tileSize);

          if (tile === window.TILE_TYPES.EXTRACTION_ZONE) {
                      let cx = px + tileSize / 2;
                      let cy = py + tileSize / 2;
                      let time = Date.now() / 300;

                      ctx.save();
                      ctx.strokeStyle = "#00d2ff";
                      ctx.lineWidth = 2;
                      ctx.beginPath();
                      ctx.arc(
                        cx,
                        cy,
                        tileSize * 0.38 + Math.sin(time) * 2,
                        0,
                        Math.PI * 2,
                      );
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
                      ctx.arc(
                        cx,
                        cy,
                        tileSize * 0.38 + Math.sin(time) * 2,
                        0,
                        Math.PI * 2,
                      );
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
                      ctx.arc(
                        cx,
                        cy,
                        tileSize * 0.4 + Math.sin(time) * 3,
                        0,
                        Math.PI * 2,
                      );
                      ctx.stroke();

                      ctx.fillStyle = "rgba(231, 76, 60, 0.35)";
                      ctx.beginPath();
                      ctx.arc(cx, cy, tileSize * 0.3, 0, Math.PI * 2);
                      ctx.fill();
                      ctx.restore();
                    }

          if (tile === window.TILE_TYPES.CHEST_SPAWN) {
            let cx = px + tileSize / 2;
            let cy = py + tileSize / 2;

            ctx.fillStyle = "#5c3a21";
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1.5;
            ctx.fillRect(cx - 8, cy - 6, 16, 12);
            ctx.strokeRect(cx - 8, cy - 6, 16, 12);

            ctx.fillStyle = "#ffd700";
            ctx.fillRect(cx - 2, cy - 2, 4, 4);
          }

          if (tile === window.TILE_TYPES.STATION_PORTAL) {
            let cx = px + tileSize / 2;
            let cy = py + tileSize / 2;
            let time = Date.now() / 250;

            ctx.save();
            ctx.strokeStyle = "#a855f7";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
              cx,
              cy,
              tileSize * 0.38 + Math.sin(time) * 2,
              0,
              Math.PI * 2,
            );
            ctx.stroke();

            ctx.fillStyle = "rgba(168, 85, 247, 0.3)";
            ctx.beginPath();
            ctx.arc(cx, cy, tileSize * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          if (tile === window.TILE_TYPES.STATION_FORGE) {
            let cx = px + tileSize / 2;
            let cy = py + tileSize / 2;

            ctx.save();
            ctx.fillStyle = "#f1c40f";
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1.5;
            ctx.fillRect(cx - 7, cy - 5, 14, 10);
            ctx.strokeRect(cx - 7, cy - 5, 14, 10);
            ctx.restore();
          }

          if (tile === window.TILE_TYPES.STATION_STASH) {
            let cx = px + tileSize / 2;
            let cy = py + tileSize / 2;

            ctx.save();
            ctx.fillStyle = "#3498db";
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1.5;
            ctx.fillRect(cx - 8, cy - 7, 16, 14);
            ctx.strokeRect(cx - 8, cy - 7, 16, 14);
            ctx.restore();
          }

          if (tile === window.TILE_TYPES.STATION_INN) {
            let cx = px + tileSize / 2;
            let cy = py + tileSize / 2;

            ctx.save();
            ctx.fillStyle = "#2ecc71";
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(cx, cy, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    }

    ctx.restore();
    window.renderMinimap(ctx, canvas);
  };

  window.renderMinimap = function (ctx, canvas) {
      let map = window.activeDungeonMap;
      if (!map || !map.grid || map.grid.length === 0) return;

      let mw = 85;
      let mh = 50;
      let mx = canvas.width - mw - 8;
      let my = 46;

    ctx.save();
    ctx.fillStyle = "rgba(5, 3, 10, 0.85)";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeRect(mx, my, mw, mh);

    let scaleX = mw / map.width;
    let scaleY = mh / map.height;

    for (let r = 0; r < map.height; r++) {
      for (let c = 0; c < map.width; c++) {
        let tile = map.grid[r][c];
        if (tile === window.TILE_TYPES.FLOOR) {
          ctx.fillStyle = "#475569";
          ctx.fillRect(
            mx + c * scaleX,
            my + r * scaleY,
            Math.max(1, scaleX),
            Math.max(1, scaleY),
          );
        } else if (tile === window.TILE_TYPES.EXTRACTION_ZONE) {
                  ctx.fillStyle = "#00d2ff";
                  ctx.fillRect(mx + c * scaleX - 1, my + r * scaleY - 1, 3, 3);
                } else if (tile === window.TILE_TYPES.DESCENT_PORTAL) {
                  ctx.fillStyle = "#a855f7";
                  ctx.fillRect(mx + c * scaleX - 1, my + r * scaleY - 1, 3, 3);
                } else if (tile === window.TILE_TYPES.BOSS_GATE) {
                  ctx.fillStyle = "#e74c3c";
                  ctx.fillRect(mx + c * scaleX - 1, my + r * scaleY - 1, 3, 3);
                } else if (tile === window.TILE_TYPES.SPAWN_PLAYER) {
          ctx.fillStyle = "#2ecc71";
          ctx.fillRect(mx + c * scaleX - 1, my + r * scaleY - 1, 3, 3);
        }
      }
    }

    ctx.restore();
  };
})();
