// cfp

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

// devoxxians

// https://devoxxians.com/api/public/events/upcoming

export interface DevoxxiansEventInfo {
  id: number,
  name: string, // eg "Devoxx UK 2023"
  eventCategory: "DEVOXX" | "VOXXED",
  fromDate: string, // eg 2023-05-10T07:00:00Z
  toDate: string, // eg 2023-05-12T15:00:00Z
  imageURL: string, // url
  website: string, // url
  apiURL: string // base url for cfp crawling - eg https://devoxxuk23.cfp.dev/api/
}

// https://devoxxians.com/api/public/events/:eventId

export interface DevoxxiansEventDetails {
  id: number, // eg 117
  name: string, // eg "Devoxx UK 2023",
  slug: string, // eg "devoxxuk23",
  website: string, // eg "https://www.devoxx.co.uk/",
  description: string, // "Come together to explore and share the latest technology advancements and fascinating ideas, with some of the most inspiring speakers in our sector. ..."
  imageURL: string, // eg "https://devoxxian-image-thumbnails.s3-eu-west-1.amazonaws.com/profile-51686832605_87b8e834f9_o-3c890817-c5e7-4c86-880e-012efca68ddb.jpg",
  faqURL: string | null, //
  apiURL: string, // eg "https://devoxxuk23.cfp.dev/api/",
  codeOfConductURL: string | null,
  presentationTemplateURL: string | null,
  youTubeURL: string | null,
  youTubeQuery: string | null,
  youTubeChannelId: string | null,
  eventImagesURL: string | null,
  importDate: string, // eg "2023-05-02T00:00:00",
  fromDate: string, // eg "2023-05-10T07:00:00Z",
  toDate: string, // eg "2023-05-12T15:00:00Z",
  cfpFromDate: string | null, // eg "2023-06-01T07:00:00Z",
  cfpToDate: string | null, // "2023-07-15T21:59:00Z",
  eventCategory: "DEVOXX" | "VOXXED",
  myBadgeActive: boolean,
  languages: [ ],
  floorPlans: [ ],
  onlinePresentations: [ ],
  location: {
    id: number,
    name: string, // eg "Business Design Center",
    address1: string, // eg "",
    address2: string, // eg "",
    postCode: string, // eg "",
    city: string, // eg "London",
    country: string, // eg "United Kingdom",
    latitude: number, // eg 51.53574,
    longitude: number, // eg -0.10514,
    timezone: string, // eg "Europe/London"
  },
  timezone: string, // eg "Europe/London",
  chatEnabled: boolean,
  pollEnabled: boolean,
  qaEnabled: boolean,
  photoEnabled: boolean,
  tweetsEnabled: boolean,
  sponsorsEnabled: boolean,
  networkEnabled: boolean,
  attendeesStatsEnabled: boolean,
  onlineAttendeesStatsEnabled: boolean,
  freeEvent: boolean,
  twitterStream: string | null,
  streamURL: string | null,
  companies: [ ],
  regLink: string | null,
  dataStudioURL: string | null,
  tickets: [ ],
  owners: [
    {
      id: 5,
      login: string, // eg "anonymised",
      firstName: string, // eg "John",
      lastName: string, // eg "Doe",
      email: string, // eg "anonymised@voxxed.com",
      imageUrl: string | null,
      activated: boolean,
      langKey: string, // eg "en",
      createdBy: string, // eg "admin",
      createdDate: string, // eg "2020-12-29T14:01:39Z",
      lastModifiedBy: string, // eg "stephan007",
      lastModifiedDate: string, // eg "2021-05-05T12:53:05Z",
      authorities: string[]
    }
  ],
  organisers: [ ],
  featuredSpeakers: [ ]
}
