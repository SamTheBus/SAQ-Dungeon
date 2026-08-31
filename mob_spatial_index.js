export const MOB_SPATIAL_CELL_SIZE = 32;

const spatialColumns = new Map();
const mobRecords = new Map();

let nextOrdinal = 0;
let nextSerial = 0;
let indexedMobCount = 0;

function getMobCenter(mob) {
  if (!mob || !Number.isFinite(mob.x) || !Number.isFinite(mob.y)) {
    return null;
  }

  let width = Number(mob.w || 24);
  let height = Number(mob.h || 24);
  if (!Number.isFinite(width)) width = 24;
  if (!Number.isFinite(height)) height = 24;

  return {
    x: mob.x + width / 2,
    y: mob.y + height / 2,
  };
}

function getCellCoordinate(value) {
  return Math.floor(value / MOB_SPATIAL_CELL_SIZE);
}

function getBucket(cellX, cellY, createIfMissing = false) {
  let column = spatialColumns.get(cellX);
  if (!column && createIfMissing) {
    column = new Map();
    spatialColumns.set(cellX, column);
  }

  let bucket = column ? column.get(cellY) : undefined;
  if (!bucket && createIfMissing) {
    bucket = [];
    column.set(cellY, bucket);
  }

  return bucket;
}

function removeRecordFromBucket(mob, record) {
  if (record.cellX === null || record.cellY === null) return;

  const column = spatialColumns.get(record.cellX);
  const bucket = column ? column.get(record.cellY) : undefined;
  if (bucket) {
    const bucketIndex = bucket.indexOf(mob);
    if (bucketIndex !== -1) {
      bucket.splice(bucketIndex, 1);
      indexedMobCount--;
    }

    if (bucket.length === 0) {
      column.delete(record.cellY);
      if (column.size === 0) spatialColumns.delete(record.cellX);
    }
  }

  record.cellX = null;
  record.cellY = null;
}

function placeRecordInCurrentCell(mob, record) {
  const center = getMobCenter(mob);
  if (!center) return false;

  const cellX = getCellCoordinate(center.x);
  const cellY = getCellCoordinate(center.y);
  getBucket(cellX, cellY, true).push(mob);
  record.cellX = cellX;
  record.cellY = cellY;
  indexedMobCount++;
  return true;
}

function createRecord(ordinal) {
  return {
    ordinal,
    serial: nextSerial++,
    cellX: null,
    cellY: null,
  };
}

export function clearMobSpatialIndex() {
  spatialColumns.clear();
  mobRecords.clear();
  nextOrdinal = 0;
  nextSerial = 0;
  indexedMobCount = 0;
}

export function rebuildMobSpatialIndex(mobs) {
  if (!Array.isArray(mobs)) {
    throw new TypeError("rebuildMobSpatialIndex expects an array");
  }

  clearMobSpatialIndex();

  for (let index = 0; index < mobs.length; index++) {
    const mob = mobs[index];
    if (!mob || mobRecords.has(mob)) continue;

    const record = createRecord(index);
    mobRecords.set(mob, record);
    placeRecordInCurrentCell(mob, record);
  }

  nextOrdinal = mobs.length;
  return indexedMobCount;
}

export function getIndexedMobOrdinal(mob) {
  const record = mobRecords.get(mob);
  return record ? record.ordinal : -1;
}

export function refreshIndexedMob(mob) {
  const record = mobRecords.get(mob);
  if (!record) return false;

  const center = getMobCenter(mob);
  if (!center) {
    removeRecordFromBucket(mob, record);
    return false;
  }

  const nextCellX = getCellCoordinate(center.x);
  const nextCellY = getCellCoordinate(center.y);
  if (record.cellX === nextCellX && record.cellY === nextCellY) {
    return true;
  }

  removeRecordFromBucket(mob, record);
  getBucket(nextCellX, nextCellY, true).push(mob);
  record.cellX = nextCellX;
  record.cellY = nextCellY;
  indexedMobCount++;
  return true;
}

export function insertIndexedMob(mob, ordinal) {
  if (!mob) return false;
  const existingRecord = mobRecords.get(mob);
  if (ordinal === undefined) {
    ordinal = existingRecord ? existingRecord.ordinal : nextOrdinal;
  }
  if (!Number.isInteger(ordinal) || ordinal < 0) {
    throw new TypeError("insertIndexedMob expects a non-negative ordinal");
  }

  if (existingRecord) {
    removeRecordFromBucket(mob, existingRecord);
    existingRecord.ordinal = ordinal;
    placeRecordInCurrentCell(mob, existingRecord);
  } else {
    const record = createRecord(ordinal);
    mobRecords.set(mob, record);
    placeRecordInCurrentCell(mob, record);
  }

  nextOrdinal = Math.max(nextOrdinal, ordinal + 1);
  return true;
}

export function removeIndexedMob(mob) {
  const record = mobRecords.get(mob);
  if (!record) return false;

  removeRecordFromBucket(mob, record);
  mobRecords.delete(mob);
  return true;
}

export function findNearestIndexedMobInRadius(
  centerX,
  centerY,
  radius,
  predicate,
) {
  if (predicate !== undefined && typeof predicate !== "function") {
    throw new TypeError(
      "findNearestIndexedMobInRadius expects a predicate function",
    );
  }
  if (
    !Number.isFinite(centerX) ||
    !Number.isFinite(centerY) ||
    !Number.isFinite(radius) ||
    radius <= 0
  ) {
    return null;
  }

  const minCellX = getCellCoordinate(centerX - radius);
  const maxCellX = getCellCoordinate(centerX + radius);
  const minCellY = getCellCoordinate(centerY - radius);
  const maxCellY = getCellCoordinate(centerY + radius);
  let nearestMob = null;
  let nearestDistance = Infinity;
  let nearestOrdinal = Infinity;
  let nearestSerial = Infinity;

  for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
    const column = spatialColumns.get(cellX);
    if (!column) continue;

    for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
      const bucket = column.get(cellY);
      if (!bucket) continue;

      for (let index = 0; index < bucket.length; index++) {
        const mob = bucket[index];
        if (predicate && !predicate(mob)) continue;

        const record = mobRecords.get(mob);
        if (!record) continue;

        let width = Number(mob.w || 24);
        let height = Number(mob.h || 24);
        if (!Number.isFinite(width)) width = 24;
        if (!Number.isFinite(height)) height = 24;

        const mobCenterX = mob.x + width / 2;
        const mobCenterY = mob.y + height / 2;
        const distance = Math.hypot(
          centerX - mobCenterX,
          centerY - mobCenterY,
        );
        if (
          distance < radius &&
          (distance < nearestDistance ||
            (distance === nearestDistance &&
              (record.ordinal < nearestOrdinal ||
                (record.ordinal === nearestOrdinal &&
                  record.serial < nearestSerial))))
        ) {
          nearestMob = mob;
          nearestDistance = distance;
          nearestOrdinal = record.ordinal;
          nearestSerial = record.serial;
        }
      }
    }
  }

  return nearestMob;
}

export function queryMobCandidatesInAabb(
  minX,
  minY,
  maxX,
  maxY,
  output = [],
) {
  if (!Array.isArray(output)) {
    throw new TypeError("queryMobCandidatesInAabb expects an output array");
  }
  output.length = 0;

  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(maxY)
  ) {
    return output;
  }

  const queryMinX = Math.min(minX, maxX);
  const queryMaxX = Math.max(minX, maxX);
  const queryMinY = Math.min(minY, maxY);
  const queryMaxY = Math.max(minY, maxY);
  const minCellX = getCellCoordinate(queryMinX);
  const maxCellX = getCellCoordinate(queryMaxX);
  const minCellY = getCellCoordinate(queryMinY);
  const maxCellY = getCellCoordinate(queryMaxY);

  for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
    const column = spatialColumns.get(cellX);
    if (!column) continue;

    for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
      const bucket = column.get(cellY);
      if (!bucket) continue;

      for (let index = 0; index < bucket.length; index++) {
        const mob = bucket[index];
        const center = getMobCenter(mob);
        if (
          center &&
          center.x >= queryMinX &&
          center.x <= queryMaxX &&
          center.y >= queryMinY &&
          center.y <= queryMaxY
        ) {
          output.push(mob);
        }
      }
    }
  }

  output.sort((left, right) => {
    const leftRecord = mobRecords.get(left);
    const rightRecord = mobRecords.get(right);
    const ordinalDifference = leftRecord.ordinal - rightRecord.ordinal;
    return ordinalDifference || leftRecord.serial - rightRecord.serial;
  });

  return output;
}
