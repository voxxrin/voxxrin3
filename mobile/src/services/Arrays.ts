
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
