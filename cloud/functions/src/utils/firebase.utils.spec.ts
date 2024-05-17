import {describe, expect, it} from "vitest";
import {toValidFirebaseKey} from "../../../../shared/utilities/firebase.utils";

describe('icon resolution based on time', () => {
  it(`/ in firebase keys should be replaced with :`, () => {
    expect(toValidFirebaseKey("a/b/c")).toBe("a:b:c")
  })

  for(const sep of `#%&'"<>?[]{}|\\`.split("")) {
    it(`${sep} in firebase keys should be replaced with _`, () => {
      expect(toValidFirebaseKey(`a${sep}b${sep}c`)).toBe("a_b_c")
    })
  }

})
