// cfp

export type Link = {
  href: string,
  rel: string,
  title: string
}

export type DevoxxScalaConferences = {
  content: string,
  links: Array<Link>
}

export type DevoxxScalaLocale = "fr"
export type DevoxxScalaProposalTypeId = "conf"|"uni"|"tia"|"quick"|"key"
export type DevoxxScalaTrackId = "java"|"mobile"|"wm"|"archisec"|"agTest"|"cldops"|"bigd"|"future"|"lang"

export type DevoxxScalaConference = {
  eventCode: string,
  label: string,
  locale: DevoxxScalaLocale[],
  localisation: string,
  link: Link,
  days: string[],
  proposalTypesId: DevoxxScalaProposalTypeId[],
  links: Link[]
}

export type DevoxxScalaBaseSpeaker = {
  uuid: string,
  company: string,
  firstName: string,
  lastName: string,
  avatarURL: string,
  twitter: string|null
}
export type DevoxxScalaSimpleSpeaker = DevoxxScalaBaseSpeaker & {
  links: Link[],
}
export type DevoxxScalaSpeaker = DevoxxScalaBaseSpeaker & {
  bioAsHtml: string,
  bio: string,
  blog: string,
  lang: DevoxxScalaLocale,
  acceptedTalks: Array<{
    talkType: string,
    track: string,
    links: Link[]
  }>
}

export type DevoxxScalaProposalType = {
  id: DevoxxScalaProposalTypeId,
  description: string,
  label: string
}
export type DevoxxScalaProposalTypesList = {
  content: string,
  proposalTypes: DevoxxScalaProposalType[]
}

export type DevoxxScalaTrack = {
  id: DevoxxScalaTrackId,
  imgsrc: string,
  description: string,
  title: string
}
export type DevoxxScalaTracksList = {
  content: string,
  tracks: DevoxxScalaTrack[]
}

export type DevoxxScalaScheduleList = {
  content: string,
  links: Link[]
}

export type DevoxxScalaSchedule = {
  slots: DevoxxScalaScheduleSlot[]
}

export type DevoxxScalaScheduleSlot = DevoxxScalaScheduleTalkSlot | DevoxxScalaScheduleBreakSlot | DevoxxScalaScheduleUnallocatedSlot;
export type DevoxxScalaScheduleBaseSlot = {
  roomId: string,
  fromTimeMillis: number,
  fromTime: string,
  toTimeMillis: number,
  toTime: string,
  roomSetup: "special"|"theatre",
  roomCapacity: number,
  roomName: string,
  slotId: string,
  day: string
}
export type DevoxxScalaScheduleUnallocatedSlot = DevoxxScalaScheduleBaseSlot & {
  notAllocated: true,
  talk: null,
  break: null
}
export type DevoxxScalaScheduleTalkSlot = DevoxxScalaScheduleBaseSlot & {
  notAllocated: false,
  talk: {
    trackId: string,
    talkType: string,
    track: string,
    summary: string,
    summaryAsHtml: string,
    speakers: Array<{
      link: Link,
      name: string
    }>,
    title: string,
    lang: DevoxxScalaLocale
  },
  break: null
}
export type DevoxxScalaScheduleBreakSlot = DevoxxScalaScheduleBaseSlot & {
  notAllocated: false,
  talk: null,
  break: {
    id: string,
    nameEN: string,
    nameFR: string,
  }
}
