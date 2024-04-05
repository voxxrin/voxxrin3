import {Temporal} from "@js-temporal/polyfill";

export async function wait(duration: Temporal.Duration) {
  return new Promise(resolve => setTimeout(resolve, duration.total('milliseconds')))
}
