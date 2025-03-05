
export function dedupe<T>(array: T[], hashExtractor: (elem: T) => string): T[] {
  const alreadyFoundHashes = new Set<string>()
  const result: T[] = [];
  for(const elem of array) {
    const hash = hashExtractor(elem);
    if(!alreadyFoundHashes.has(hash)) {
      result.push(elem)
    }
  }
  return result;
}

export type ArrayDiff<ORIGIN, TARGET> = {
  elementsToAdd: TARGET[],
  elementsToRemove: ORIGIN[],
  elementsAlreadyPresent: { origin: ORIGIN, target: TARGET }[],
};

export function arrayDiff<ORIGIN, TARGET, HASH extends string | number>(originalArray: ORIGIN[], targetArray: TARGET[], originHash: (value: ORIGIN) => HASH, targetHash: (value: TARGET) => HASH): ArrayDiff<ORIGIN, TARGET> {
  const targetSet = new Set(targetArray.map(targetHash));

  const elementsToAdd: TARGET[] = [];
  const elementsToRemove: ORIGIN[] = [];
  const elementsAlreadyPresent: { origin: ORIGIN, target: TARGET }[] = [];

  targetArray.forEach(item => {
    const tHash = targetHash(item);
    const originElem = originalArray.find(orig => originHash(orig) === tHash);
    if (originElem === undefined) {
      elementsToAdd.push(item);
    } else {
      elementsAlreadyPresent.push({ target: item, origin: originElem });
    }
  });

  originalArray.forEach(item => {
    if (!targetSet.has(originHash(item))) {
      elementsToRemove.push(item);
    }
  });

  return {
    elementsToAdd,
    elementsToRemove,
    elementsAlreadyPresent,
  };
}
