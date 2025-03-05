import { ListableEvent } from "../../../../shared/event-list.firestore";
import {
  BreakTimeSlot,
  DailySchedule,
  DetailedTalk,
} from "../../../../shared/daily-schedule.firestore";
import {ConferenceDescriptor} from "../../../../shared/conference-descriptor.firestore";
import {Replace} from "../../../../shared/type-utils";
import {LineupSpeaker} from "../../../../shared/event-lineup.firestore";
import {match, P} from "ts-pattern";

export type BreakTimeslotWithPotentiallyUnknownIcon = Replace<BreakTimeSlot, {
  break: Replace<BreakTimeSlot['break'], {
    icon: BreakTimeSlot['break']['icon'] | 'unknown'
  }>
}>

export type FullEvent = {
    id: string,
    conferenceDescriptor: Omit<ConferenceDescriptor, "eventFamily"|"eventName"|"websiteUrl"|"visibility"|"spaceToken">,
    listableEventInfo: Omit<ListableEvent, "eventFamily"|"eventName"|"websiteUrl"|"visibility"|"spaceToken">,
    daySchedules: DailySchedule[],
    talks: DetailedTalk[],
    lineupSpeakers: LineupSpeaker[],
}

export function detailedTalksToSpeakersLineup(talks: DetailedTalk[]): LineupSpeaker[] {
  return talks.reduce((speakers, talk) => {
    if(!talk.isOverflow) {
      talk.speakers.forEach(speaker => {
        const lineupSpeaker = match(speakers.find(lineupSpeaker => lineupSpeaker.id === speaker.id))
          .with(P.not(P.nullish), lineupSpeaker => lineupSpeaker)
          .otherwise(() => {
            const newLineupSpeaker: LineupSpeaker = {
              ...speaker,
              talks: []
            }
            speakers.push(newLineupSpeaker);
            return newLineupSpeaker;
          })

        lineupSpeaker.talks.push({
          id: talk.id,
          title: talk.title,
          format: talk.format,
          language: talk.language,
          track: talk.track,
          tags: talk.tags,
          allocation: talk.allocation ? {
            room: talk.room,
            start: talk.allocation.start,
            end: talk.allocation.end,
          } : null,
          otherSpeakers: talk.speakers.filter(sp => sp.id !== speaker.id)
            .map(speaker => ({
              id: speaker.id,
              fullName: speaker.fullName,
              photoUrl: speaker.photoUrl,
              companyName: speaker.companyName,
              bio: speaker.bio,
              social: speaker.social,
            })),
        })
      })
    }
    return speakers;
  }, [] as LineupSpeaker[])
}
