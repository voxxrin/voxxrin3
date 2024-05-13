
export function toValidFirebaseKey(value: string) {
  return encodeURIComponent(
    // We should avoid "/" in keys, as this is going to lead to unexpected behaviours
    // (and we're replacing it with _ instead of url-escaping it, as this might happen frequently and we
    // we don't want to "pollute" URL with %2F in that case)
    value.replace(/\//gi, "_")
  ).replace(".", "%2E");
}

export function unescapeFirebaseKey(firebaseKey: string) {
  return decodeURIComponent(firebaseKey);
}
