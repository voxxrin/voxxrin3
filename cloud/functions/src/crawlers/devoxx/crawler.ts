import {info} from "../../firebase";
import * as _ from "lodash";

import {DevoxxScheduleItem, DevoxxScheduleSpeakerInfo} from "./types"
import {DaySchedule, ScheduleSpeakerInfo, Talk} from "../../../../../shared/models/schedule"
import { TalkStats } from "../../../../../shared/models/feedbacks";
import { FullEvent } from "../../models/Event";
import { ISODatetime } from "../../../../../shared/models/type-utils";

const axios = require('axios');

export const crawl = async (eventId:string) => {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday"]
    const event: FullEvent = { id: eventId, daySchedules: [], talkStats: [], talks: []}
    for (const day of days) {
        const {daySchedule, talkStats, talks} = await crawlDevoxxDay(eventId, day)
        event.daySchedules.push(daySchedule)        
        event.talkStats.push({day: day, stats: talkStats})
        for (const talk of talks) {
            event.talks.push(talk)
        }
    }
    return event
}

const crawlDevoxxDay = async (eventId: string, day: string) => {
    const res = await axios.get(`https://${eventId}.cfp.dev/api/public/schedules/${day}`)

    const schedules:DevoxxScheduleItem[] = res.data;

    const daySchedule: DaySchedule = {
        day: day,
        timeSlots: []
    }

    const talkStats: TalkStats[] = []

    const talks: Talk[] = []

    const slots = _.groupBy(schedules, (s:DevoxxScheduleItem) => {return s.fromDate + "--" + s.toDate})

    const toScheduleTalk = function(item: DevoxxScheduleItem) {
        const proposal = item.proposal!!
        return {
            id: proposal.id.toString(),
            title: proposal.title,
            speakers: proposal.speakers.map((s:DevoxxScheduleSpeakerInfo) => {
                return {
                    id: s.id.toString(),
                    fullName: s.fullName,
                    companyName: s.company,
                    photoUrl: s.imageUrl
                } as ScheduleSpeakerInfo
            }),
            room: {
                id: item.room.id.toString(),
                title: item.room.name
            },
            format: {
                id: item.sessionType.id.toString(),
                title: item.sessionType.name,
                duration: "PT" + item.sessionType.duration + "m"
            },
            track: {
                id: proposal.track.id.toString(),
                title: proposal.track.name
            },
            language: "EN"
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
                id: key,
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
                id: key,
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
                    summary: i.proposal?.summary ?? "",
                    description: i.proposal?.description ?? ""
                }
                talks.push(talk)
            })
        }
    })

    info("devoxx day crawling done for " + day)
    return {daySchedule, talkStats, talks}
}

