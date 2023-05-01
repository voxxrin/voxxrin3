import {info} from "../../firebase";
import * as _ from "lodash";

import {DevoxxScheduleItem, DevoxxScheduleProposal, DevoxxScheduleSpeakerInfo, DevoxxScheduleItemTag} from "./types"
import {DaySchedule, Event, ScheduleSpeakerInfo} from "../../data/schedule"
import { TalkStats } from "../../data/feedbacks";

const axios = require('axios');

export const crawl = async (eventId:string) => {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday"]
    const event: Event = { id: eventId, daySchedules: [], talkStats: []}
    for (const day of days) {
        const {daySchedule, talkStats} = await crawlDevoxxDay(eventId, day)
        event.daySchedules.push(daySchedule)        
        event.talkStats.push({day: day, stats: talkStats})
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

    const slots = _.groupBy(schedules, (s:DevoxxScheduleItem) => {return s.fromDate + "--" + s.toDate})

    _.forIn(slots, (items: DevoxxScheduleItem[], key: string) => {
        const [start, end] = key.split("--")

        info(key + "\n-------------------\n  - " + items.map((schedule:DevoxxScheduleItem) => {
            let title = schedule.proposal?.title || schedule.sessionType.name
            return `${schedule.id} - ${schedule.room.name} - ${title}`
        }).join("\n  -") + "\n------------------");

        if (items.every((item: DevoxxScheduleItem) => { return item.sessionType.isPause })) {
            daySchedule.timeSlots.push({
                id: key,
                start: start,
                end: end,
                type: "break",
                break: {
                    title: items[0].sessionType.name,
                    room: {
                        id: items[0].room.id.toString(),
                        title: items[0].room.name
                    },
                    icon: items[0].sessionType.name
                }
            }
            )
        } else {
            daySchedule.timeSlots.push({
                id: key,
                start: start,
                end: end,
                type: "talks",
                talks: items.map((item: DevoxxScheduleItem) => {
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
                })
            })
            items.forEach((i) => {
                if (i.totalFavourites !== undefined && i.proposal?.id !== undefined) {
                    talkStats.push({id: i.proposal?.id.toString(), totalFavoritesCount: i.totalFavourites})
                }
            })
        }
    })

    return {daySchedule, talkStats}


    // for (const schedule of schedules) {
    //     let title = schedule.proposal?.title || schedule.sessionType.name
    //     functions.logger.info(`${schedule.id} - ${schedule.room.name} - ${title}`, {structuredData: true});
    //     functions.logger.info(`/events/${eventId}/days/${day}/schedules/${schedule.id}`, {structuredData: true});

    //     await db.collection("events").doc(eventId)
    //         .collection("days").doc(day)
    //         .collection("schedules").doc(schedule.id.toString())
    //         .set(schedule)
    // }
}

