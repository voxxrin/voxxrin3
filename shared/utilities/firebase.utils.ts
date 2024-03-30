
export function toValidFirebaseKey(value: string) {
  return encodeURIComponent(value).replace(".", "%2E");
}

export function unescapeFirebaseKey(firebaseKey: string) {
  return decodeURIComponent(firebaseKey);
}
