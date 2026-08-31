const DEFAULT_RENDER_SEED = 0x6d2b79f5;

export function createRenderRng(seed = DEFAULT_RENDER_SEED) {
  let state = seed >>> 0;

  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  return {
    random,
    randFloat(min, max) {
      return random() * (max - min) + min;
    },
    randInt(min, max) {
      return Math.floor(random() * (max - min + 1)) + min;
    },
  };
}

const renderRng = createRenderRng();

export const renderRandom = () => renderRng.random();
export const renderRandFloat = (min, max) => renderRng.randFloat(min, max);
export const renderRandInt = (min, max) => renderRng.randInt(min, max);
