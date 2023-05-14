import { describe, expect, test } from 'vitest'
import {hexToRGB, NumberRange, Range} from "../../../src/models/utils";

describe('utils', () => {
  ([
      {n: "[  [[  ]  ]]", r1: new NumberRange(100, 200), r2: new NumberRange(150, 250), expectsInclusiveOverlap: true, expectsExclusiveOverlap: true},
      {n: "[[ [ ]] ]", r1: new NumberRange(100, 200), r2: new NumberRange(50, 150), expectsInclusiveOverlap: true, expectsExclusiveOverlap: true},
      {n: "[[ [ ] ]]", r1: new NumberRange(100, 200), r2: new NumberRange(50, 250), expectsInclusiveOverlap: true, expectsExclusiveOverlap: true},
      {n: "[ ][[ ]]", r1: new NumberRange(50, 100), r2: new NumberRange(100, 250), expectsInclusiveOverlap: true, expectsExclusiveOverlap: false},
      {n: "[ ] [[ ]]", r1: new NumberRange(50, 99), r2: new NumberRange(100, 250), expectsInclusiveOverlap: false, expectsExclusiveOverlap: false},
      {n: "[ ][[ ]]", r1: new NumberRange(100, 200), r2: new NumberRange(200, 250), expectsInclusiveOverlap: true, expectsExclusiveOverlap: false},
      {n: "[ ] [[ ]]", r1: new NumberRange(100, 200), r2: new NumberRange(201, 250), expectsInclusiveOverlap: false, expectsExclusiveOverlap: false},
      {n: "[[[ ]]]", r1: new NumberRange(100, 200), r2: new NumberRange(100, 200), expectsInclusiveOverlap: true, expectsExclusiveOverlap: true},
  ] as const).forEach(testCase => {
    test(`NumberRange.overlap[exclusive](${testCase.n} => ${JSON.stringify(testCase.r1)}, ${JSON.stringify(testCase.r2)}) => ${testCase.expectsExclusiveOverlap}`, () => {
      expect(NumberRange.overlap(testCase.r1, testCase.r2, 'exclusive')).toBe(testCase.expectsExclusiveOverlap);
    })
    test(`NumberRange.overlap[exclusive](swap:${testCase.n} => ${JSON.stringify(testCase.r2)}, ${JSON.stringify(testCase.r1)}) => ${testCase.expectsExclusiveOverlap}`, () => {
      expect(NumberRange.overlap(testCase.r2, testCase.r1, 'exclusive')).toBe(testCase.expectsExclusiveOverlap);
    })
    test(`NumberRange.overlap[inclusive](${testCase.n} => ${JSON.stringify(testCase.r1)}, ${JSON.stringify(testCase.r2)}) => ${testCase.expectsInclusiveOverlap}`, () => {
      expect(NumberRange.overlap(testCase.r1, testCase.r2, 'inclusive')).toBe(testCase.expectsInclusiveOverlap);
    })
    test(`NumberRange.overlap[inclusive](swap:${testCase.n} => ${JSON.stringify(testCase.r2)}, ${JSON.stringify(testCase.r1)}) => ${testCase.expectsInclusiveOverlap}`, () => {
      expect(NumberRange.overlap(testCase.r2, testCase.r1, 'inclusive')).toBe(testCase.expectsInclusiveOverlap);
    })
  });

  ([
      { hexColor: '#ffffff', expectedRGB: `255, 255, 255` },
      { hexColor: '#000000', expectedRGB: `0, 0, 0` },
      { hexColor: '#1f2328', expectedRGB: `31, 35, 40` },
  ] as const).forEach(testCase => {
    test(`hexToRGB(${testCase.hexColor}) = ${testCase.expectedRGB}`, () => {
        expect(hexToRGB(testCase.hexColor)).toBe(testCase.expectedRGB);
    })
  })
})
