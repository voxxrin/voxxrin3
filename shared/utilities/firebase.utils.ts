
export function toValidFirebaseKey(value: string) {
  // We should avoid "/" in keys, as this is going to lead to unexpected behaviours
  // (and we're replacing it with : to make keys less noisy
  return value.replace(/[\/]/gi, ":")
    .replace(/[#%&'"<>\?\[\]\{\}\|\\]/gi, "_");
}
