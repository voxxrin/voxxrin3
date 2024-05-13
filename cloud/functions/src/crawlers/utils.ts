import axios from "axios";
import {ISODatetime} from "../../../../shared/type-utils";
import {Temporal} from "@js-temporal/polyfill";
import {match, P} from "ts-pattern";
import {Break, BreakTimeSlot, TalksTimeSlot} from "../../../../shared/daily-schedule.firestore";
import {BreakTimeslotWithPotentiallyUnknownIcon} from "../models/Event";

const STD_HEADERS = {
  Connection: 'keep-alive',
  'Keep-Alive': 'timeout=1500, max=100'
}

export const http = Object.freeze({
  async get<T extends unknown>(url: string): Promise<T> {
    const res = (await axios.get(url, { headers: STD_HEADERS })).data
    if(typeof res !== 'object') {
      throw Error(`Unexpected http.get() result type (${typeof res}) for URL call ${url}: ${res}`)
    }
    return res;
  },
  async maybeGet<T extends unknown>(url: string): Promise<T|undefined> {
    const res = (await axios.get(url, { headers: STD_HEADERS }))?.data
    if(typeof res !== 'object' && typeof res !== 'undefined') {
      throw Error(`Unexpected http.maybeGet() result type (${typeof res}) for URL call ${url}: ${res}`)
    }
    return res;
  },
  async getAsText(url: string): Promise<string> {
    return (await axios.get(url, { headers: STD_HEADERS, responseType: 'text' })).data
  },

  async post<T extends unknown>(url: string, payload: object): Promise<T> {
    const res = (await axios.post(url, payload, { headers: STD_HEADERS })).data
    if(typeof res !== 'object') {
      throw Error(`Unexpected http.post() result type (${typeof res}) for URL call ${url}: ${res}`)
    }
    return res;
  },

  async put<T extends unknown>(url: string, payload: object): Promise<T> {
    const res = (await axios.put(url, payload, { headers: STD_HEADERS })).data
    if(typeof res !== 'object') {
      throw Error(`Unexpected http.put() result type (${typeof res}) for URL call ${url}: ${res}`)
    }
    return res;
  },

})

export function guessBreakIconFor(dayParticularities: {isFirst: boolean, isLast: boolean}, dailyTimeslotIndex: 'first'|'last'|'other', start: ISODatetime, timezone: string) {
  const startZDT = Temporal.Instant.from(start).toZonedDateTimeISO(timezone);

  const icon: Break['icon'] = match([dayParticularities, dailyTimeslotIndex, startZDT.hour, startZDT.minute])
    .with([{ isFirst: true }, 'first', P.any, P.any], () => 'ticket' as const)
    .with([{ isLast: true }, 'last', P.any, P.any], () => 'wallet' as const)
    .with([P.any, P.any, P.number.lte(10), P.any], () => 'cafe' as const)
    .with([P.any, P.any, 11, P.number.lt(45)], () => 'cafe' as const)
    .with([P.any, P.any, 11, P.number.gte(45)], () => 'restaurant' as const)
    .with([P.any, P.any, 12, P.any], () => 'restaurant' as const)
    .with([P.any, P.any, 13, P.any], () => 'restaurant' as const)
    .with([P.any, P.any, P.number.lt(18), P.any], () => 'cafe' as const)
    .with([P.any, P.any, P.number.gte(18), P.any], () => 'beer' as const)
    .otherwise(() => 'cafe' as const)

  return icon;
}

export function fillUnknownBreakIcons(dayParticularities: {isFirst: boolean, isLast: boolean}, timezone: string, breakTimeslots: BreakTimeslotWithPotentiallyUnknownIcon[], talksTimeslots: TalksTimeSlot[]): BreakTimeSlot[] {
  const sortedTimeslots = [...breakTimeslots, ...talksTimeslots].sort((bts1, bts2) => Temporal.Instant.from(bts1.start).epochMilliseconds - Temporal.Instant.from(bts2.start).epochMilliseconds);
  return breakTimeslots.map(bts => {
    return {
      ...bts,
      break: {
        ...bts.break,
        icon: guessBreakIconFor(
          dayParticularities,
          sortedTimeslots[0].start === bts.start
            ? 'first'
            : sortedTimeslots[sortedTimeslots.length-1].start === bts.start
              ? 'last'
              : 'other',
          bts.start,
          timezone
        )
      }
    }
  })
}
