let entityIdCounter = Object.prototype.hasOwnProperty.call(window, "idCounter")
  ? window.idCounter
  : 0;

export function getEntityIdCounter() {
  return entityIdCounter;
}

export function setEntityIdCounter(nextValue) {
  entityIdCounter = nextValue;
  return entityIdCounter;
}

export function nextEntityId() {
  return entityIdCounter++;
}

export function getNextPersistedEntityId(root) {
  let highestId = -1;
  const pending = [root];

  while (pending.length > 0) {
    const value = pending.pop();
    if (!value || typeof value !== "object") continue;

    if (Number.isSafeInteger(value.id) && value.id >= 0) {
      highestId = Math.max(highestId, value.id);
    }

    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index++) {
        pending.push(value[index]);
      }
    } else {
      Object.values(value).forEach((nestedValue) => pending.push(nestedValue));
    }
  }

  if (highestId >= Number.MAX_SAFE_INTEGER) {
    throw new RangeError("Persisted entity IDs have exhausted the safe integer range.");
  }
  return highestId + 1;
}

// Temporary compatibility bridge for remaining legacy readers and writers.
Object.defineProperty(window, "idCounter", {
  configurable: true,
  enumerable: true,
  get: getEntityIdCounter,
  set: setEntityIdCounter,
});
