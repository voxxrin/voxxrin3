import {describe, expect, it} from "vitest";
import {guessBreakIconFor} from "./utils";

describe('icon resolution based on time', () => {
  it(`first day first break timeslot should be a ticket`, () => {
    expect(guessBreakIconFor({ isFirst: true, isLast: true }, 'first', "2024-05-13T06:00:00Z", "Europe/Paris")).toBe("ticket")
  })
  it(`other day first break timeslot should be a coffee`, () => {
    expect(guessBreakIconFor({ isFirst: false, isLast: true }, 'first', "2024-05-13T06:00:00Z", "Europe/Paris")).toBe("cafe")
  })
  it(`last day last break timeslot should be a wallet`, () => {
    expect(guessBreakIconFor({ isFirst: true, isLast: true }, 'last', "2024-05-13T16:00:00Z", "Europe/Paris")).toBe("wallet")
  })
  it(`other day last break timeslot should be a beer`, () => {
    expect(guessBreakIconFor({ isFirst: true, isLast: false }, 'last', "2024-05-13T16:00:00Z", "Europe/Paris")).toBe("beer")
  })
  it(`afternoon break should be a coffee`, () => {
    expect(guessBreakIconFor({ isFirst: true, isLast: true }, 'other', "2024-05-13T15:00:00Z", "Europe/Paris")).toBe("cafe")
    expect(guessBreakIconFor({ isFirst: false, isLast: false }, 'other', "2024-05-13T15:00:00Z", "Europe/Paris")).toBe("cafe")
    expect(guessBreakIconFor({ isFirst: true, isLast: false }, 'other', "2024-05-13T15:00:00Z", "Europe/Paris")).toBe("cafe")
    expect(guessBreakIconFor({ isFirst: false, isLast: true }, 'other', "2024-05-13T15:00:00Z", "Europe/Paris")).toBe("cafe")
  })
  it(`morning break should be a coffee`, () => {
    expect(guessBreakIconFor({ isFirst: true, isLast: true }, 'other', "2024-05-13T06:00:00Z", "Europe/Paris")).toBe("cafe")
    expect(guessBreakIconFor({ isFirst: false, isLast: false }, 'other', "2024-05-13T06:00:00Z", "Europe/Paris")).toBe("cafe")
    expect(guessBreakIconFor({ isFirst: true, isLast: false }, 'other', "2024-05-13T06:00:00Z", "Europe/Paris")).toBe("cafe")
    expect(guessBreakIconFor({ isFirst: false, isLast: true }, 'other', "2024-05-13T06:00:00Z", "Europe/Paris")).toBe("cafe")

    expect(guessBreakIconFor({ isFirst: true, isLast: true }, 'other', "2024-05-13T08:00:00Z", "Europe/Paris")).toBe("cafe")
    expect(guessBreakIconFor({ isFirst: false, isLast: false }, 'other', "2024-05-13T08:00:00Z", "Europe/Paris")).toBe("cafe")
    expect(guessBreakIconFor({ isFirst: true, isLast: false }, 'other', "2024-05-13T08:00:00Z", "Europe/Paris")).toBe("cafe")
    expect(guessBreakIconFor({ isFirst: false, isLast: true }, 'other', "2024-05-13T08:00:00Z", "Europe/Paris")).toBe("cafe")

    expect(guessBreakIconFor({ isFirst: true, isLast: true }, 'other', "2024-05-13T09:30:00Z", "Europe/Paris")).toBe("cafe")
    expect(guessBreakIconFor({ isFirst: false, isLast: false }, 'other', "2024-05-13T09:30:00Z", "Europe/Paris")).toBe("cafe")
    expect(guessBreakIconFor({ isFirst: true, isLast: false }, 'other', "2024-05-13T09:30:00Z", "Europe/Paris")).toBe("cafe")
    expect(guessBreakIconFor({ isFirst: false, isLast: true }, 'other', "2024-05-13T09:30:00Z", "Europe/Paris")).toBe("cafe")
  })
  it(`lunch break should be a restaurant`, () => {
    expect(guessBreakIconFor({ isFirst: true, isLast: true }, 'other', "2024-05-13T10:00:00Z", "Europe/Paris")).toBe("restaurant")
    expect(guessBreakIconFor({ isFirst: false, isLast: false }, 'other', "2024-05-13T10:00:00Z", "Europe/Paris")).toBe("restaurant")
    expect(guessBreakIconFor({ isFirst: true, isLast: false }, 'other', "2024-05-13T10:00:00Z", "Europe/Paris")).toBe("restaurant")
    expect(guessBreakIconFor({ isFirst: false, isLast: true }, 'other', "2024-05-13T10:00:00Z", "Europe/Paris")).toBe("restaurant")
  })
  it(`end of days should be a beer`, () => {
    expect(guessBreakIconFor({ isFirst: true, isLast: true }, 'other', "2024-05-13T16:00:00Z", "Europe/Paris")).toBe("beer")
    expect(guessBreakIconFor({ isFirst: false, isLast: false }, 'other', "2024-05-13T16:00:00Z", "Europe/Paris")).toBe("beer")
    expect(guessBreakIconFor({ isFirst: true, isLast: false }, 'other', "2024-05-13T16:00:00Z", "Europe/Paris")).toBe("beer")
    expect(guessBreakIconFor({ isFirst: false, isLast: true }, 'other', "2024-05-13T16:00:00Z", "Europe/Paris")).toBe("beer")

    expect(guessBreakIconFor({ isFirst: true, isLast: true }, 'other', "2024-05-13T18:00:00Z", "Europe/Paris")).toBe("beer")
    expect(guessBreakIconFor({ isFirst: false, isLast: false }, 'other', "2024-05-13T18:00:00Z", "Europe/Paris")).toBe("beer")
    expect(guessBreakIconFor({ isFirst: true, isLast: false }, 'other', "2024-05-13T18:00:00Z", "Europe/Paris")).toBe("beer")
    expect(guessBreakIconFor({ isFirst: false, isLast: true }, 'other', "2024-05-13T18:00:00Z", "Europe/Paris")).toBe("beer")
  })
})
