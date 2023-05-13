import { describe, expect, test } from 'vitest'
import {toHMMDuration} from "../../../src/models/DatesAndTime";

describe('DatesAndTime', () => {
  ([
      {isoDuration: 'PT50m', formattedDuration: '50m'},
      {isoDuration: 'PT60m', formattedDuration: '1h'},
      {isoDuration: 'PT05m', formattedDuration: '5m'},
      {isoDuration: 'PT180m', formattedDuration: '3h'},
      {isoDuration: 'PT150m', formattedDuration: '2h 30m'},
  ] as const).forEach(testCase => {
    test(`DatesAndTime.toHMMDuration(${testCase.isoDuration}) => ${testCase.formattedDuration}`, () => {
      expect(toHMMDuration(testCase.isoDuration)).toBe(testCase.formattedDuration);
    })
  });
})
