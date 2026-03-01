function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export const shuffleDeterministic = (values: readonly string[], seedSource: string): string[] => {
  const next = [...values];
  const random = mulberry32(hashString(seedSource));

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
};

export const createShuffledDeck = (args: {
  planeIds: readonly string[];
  atMs: number;
  seed?: string;
}) => {
  const uniquePlaneIds = [...new Set(args.planeIds)];
  const source = `${args.seed ?? ""}|${args.atMs}`;
  return {
    drawPile: shuffleDeterministic(uniquePlaneIds, source),
    discardPile: [] as string[],
  };
};

export const drawPlanes = (drawPile: readonly string[], count: number) => {
  const safeCount = Math.max(0, count);
  const drawn = drawPile.slice(0, safeCount);
  const remaining = drawPile.slice(drawn.length);

  return {
    drawn,
    drawPile: remaining,
  };
};
