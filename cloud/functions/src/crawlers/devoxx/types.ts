export interface DevoxxScheduleItem {
        id: number,
        fromDate: string,
        toDate: string,
        room: {
          id: number,
          name: string,
          weight: number,
          capacity: number
        },
        streamId?: string,
        sessionType: {
          id: number,
          name: string,
          duration: number,
          isPause: boolean,
          description: string,
          cssColor: string
        },
        proposal?: DevoxxScheduleProposal,
        timezone: string,
        totalFavourites?: number
}

export interface DevoxxScheduleSpeakerInfo {
    id: number,
    firstName: string,
    lastName: string,
    fullName: string,
    bio: string,
    company: string,
    imageUrl: string,
    twitterHandle: string
}

export interface DevoxxScheduleProposal {
    id: number,
      title: string,
      description: string,
      summary: string,
      afterVideoURL: string,
      audienceLevel: string,
      track: {
        id: number,
        name: string,
        description: string,
        imageURL: string
      },
      speakers: DevoxxScheduleSpeakerInfo[],
      tags: DevoxxScheduleItemTag[],
}

export interface DevoxxScheduleItemTag {
    name: string
}