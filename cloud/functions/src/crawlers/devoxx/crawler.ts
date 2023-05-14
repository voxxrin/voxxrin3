import {info} from "../../firebase";
import * as _ from "lodash";

import { CfpEvent, DevoxxScheduleItem, DevoxxScheduleSpeakerInfo } from "./types"
import { DailySchedule, DetailedTalk, Speaker, Talk } from "../../../../../shared/dayly-schedule.firestore"
import { TalkStats } from "../../../../../shared/feedbacks.firestore";
import { FullEvent } from "../../models/Event";
import { ISODatetime, ISOLocalDate } from "../../../../../shared/type-utils";
import { Day, ListableEvent } from "../../../../../shared/event-list.firestore";
import { Temporal } from "@js-temporal/polyfill";

const axios = require('axios');

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export const crawl = async (eventId:string) => {
    const res = await axios.get(`https://${eventId}.cfp.dev/api/public/event`)
    const e: CfpEvent = res.data;

    const start = e.fromDate.substring(0, 10) as ISOLocalDate
    const end = e.toDate.substring(0, 10) as ISOLocalDate

    // collect days
    const days: Day[] = []    
    for(let d:Temporal.PlainDate = Temporal.PlainDate.from(start); ; d = d.add({days: 1})) {
        days.push({id: daysOfWeek[d.dayOfWeek - 1], localDate: d.toString() as ISOLocalDate})
        if (d.toString() == end) {
            break;
        }
    }    

    const eventInfo = {
        id: eventId,
        title: e.name,
        description: e.description,
        peopleDescription: "",
        timezone: e.timezone,
        start: start,
        end: end,
        days: days,
        logoUrl: guessLogoUrl(e),
        backgroundUrl: e.eventImageURL,
        websiteUrl: e.website,
        location: { city: e.locationCity, country: e.locationCountry },
        theming: {
            colors: {
                primaryHex: "#F78327",
                primaryContrastHex: "#FFFFFF",
                secondaryHex: "#3880FF",
                secondaryContrastHex: "#FFFFFF",
                tertiaryHex: "#0F0F0F",
                tertiaryContrastHex: "#FFFFFF"
            }
        },
        keywords: [ "Devoxx", "Java", "Kotlin", "Cloud", "Big data", "Web" ]
      } as ListableEvent

    const event: FullEvent = { id: eventId, info: eventInfo, daySchedules: [], talkStats: [], talks: []}
    for (const day of days) {
        const {daySchedule, talkStats, talks} = await crawlDevoxxDay(eventId, day.id)
        event.daySchedules.push(daySchedule)        
        event.talkStats.push({day: day.id, stats: talkStats})
        for (const talk of talks) {
            event.talks.push(talk)
        }
    }
    return event
}

const crawlDevoxxDay = async (eventId: string, day: string) => {
    const res = await axios.get(`https://${eventId}.cfp.dev/api/public/schedules/${day}`)

    const schedules:DevoxxScheduleItem[] = res.data;

    const daySchedule: DailySchedule = {
        day: day,
        timeSlots: []
    }

    const talkStats: TalkStats[] = []

    const talks: Talk[] = []

    const slots = _.groupBy(schedules, (s:DevoxxScheduleItem) => {return s.fromDate + "--" + s.toDate})

    const toScheduleTalk = function(item: DevoxxScheduleItem) {
        const proposal = item.proposal
        const base = {
            room: {
                id: item.room.id.toString(),
                title: item.room.name
            },
            format: {
                id: item.sessionType.id.toString(),
                title: item.sessionType.name,
                duration: "PT" + item.sessionType.duration + "m"
            },
        }
        if (proposal) {
            return {
                id: proposal.id.toString(),
                title: proposal.title,
                speakers: proposal.speakers.map((s:DevoxxScheduleSpeakerInfo) => {
                    return {
                        id: s.id.toString(),
                        fullName: s.fullName,
                        companyName: s.company,
                        photoUrl: s.imageUrl
                    } as Speaker
                }),
                ...base,
                track: {
                    id: proposal.track.id.toString(),
                    title: proposal.track.name
                },
                language: "EN"
            } as Talk
        } else {
            return {
                id: item.id.toString(),
                title: "",
                speakers: [],
                ...base,
                track: {
                    id: item.sessionType.id.toString(), // TODO - see if we need to make track optional
                    title: item.sessionType.name
                },
                language: "EN"
            } as Talk
        }
    }

    _.forIn(slots, (items: DevoxxScheduleItem[], key: string) => {
        const [start, end] = key.split("--")

        info(key + "\n-------------------\n  - " + items.map((schedule:DevoxxScheduleItem) => {
            let title = schedule.proposal?.title || schedule.sessionType.name
            return `${schedule.id} - ${schedule.room.name} - ${title}`
        }).join("\n  -") + "\n------------------");

        if (items.every((item: DevoxxScheduleItem) => { return item.sessionType.isPause })) {
            daySchedule.timeSlots.push({
                id: key as any,
                start: start as ISODatetime,
                end: end as ISODatetime,
                type: "break",
                break: {
                    title: items[0].sessionType.name,
                    room: {
                        id: items[0].room.id.toString(),
                        title: items[0].room.name
                    },
                    icon: "cafe" // TODO - guess that
                }
            }
            )
        } else {
            daySchedule.timeSlots.push({
                id: key as any,
                start: start as ISODatetime,
                end: end as ISODatetime,
                type: "talks",
                talks: items.map(toScheduleTalk)
            })
            items.forEach((i) => {
                if (i.totalFavourites !== undefined && i.proposal?.id !== undefined) {
                    talkStats.push({id: i.proposal?.id.toString(), totalFavoritesCount: i.totalFavourites})
                }
                const scheduleTalk = toScheduleTalk(i)
                const talk = {
                    ...scheduleTalk, 
                    start: start as ISODatetime,
                    end: end as ISODatetime,
                    summary: i.proposal?.summary ?? "",
                    description: i.proposal?.description ?? ""
                } as DetailedTalk
                talks.push(talk)
            })
        }
    })

    info("devoxx day crawling done for " + day)
    return {daySchedule, talkStats, talks}
}

// TODO - improve that
const guessLogoUrl = (e: CfpEvent) => 
    "https://devoxx.be/wp-content/uploads/2019/05/DEVOXX-Name-Only-TransparentBackground.png"