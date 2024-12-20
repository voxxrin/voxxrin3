import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment,
    type RulesTestEnvironment,
} from "@firebase/rules-unit-testing"
import {initializeApp as initializeAppAsAdmin} from "firebase-admin/app";
import {getFirestore as getFirestoreAsAdmin} from "firebase-admin/firestore";
import * as fs from "fs";
import { setDoc, doc, collection, getDocs, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import {match, P} from "ts-pattern";
import {eventFirestorePath, eventsFirestorePath} from "../../shared/utilities/event-utils";


let testEnv: RulesTestEnvironment;
let adminFirestore: FirebaseFirestore.Firestore;
beforeAll(async () => {
    const adminApp = initializeAppAsAdmin({
        projectId: 'voxxrin-v3-demo'
    });
    adminFirestore = getFirestoreAsAdmin(adminApp);

    testEnv = await initializeTestEnvironment({
        projectId: "voxxrin-v3-demo",
        firestore: {
            rules: fs.readFileSync("./firestore.default.rules", "utf8"),
        },
    });
})

const FIREBASE_MANAGED_COLLECTIONS = [
  {
    name: '/users/{userId}',
    docInitializations: [{
      name: 'alice',
      collection: '/users',
      path: '/users/alice',
      newDocPath: '/users/bob',
      data: () => ({username: 'alice'}),
      updatedData: () => ({ username: 'new-alice' }),
    }, {
      name: 'fred',
      collection: '/users',
      path: '/users/fred',
      newDocPath: '/users/bob',
      data: () => ({username: 'fred'}),
      updatedData: () => ({username: 'bob'})
    }]
  }, {
    name: '/users/{userId}/tokens-wallet/self',
    docInitializations: [{
      name: 'alice',
      collection: '/users/alice/tokens-wallet',
      path: '/users/alice/tokens-wallet/self',
      newDocPath: '/users/alice/tokens-wallet/other',
      data: () => ({publicUserToken: 'ffffffff-ffff-ffff-ffff-ffffffffffff'}),
      updatedData: () => ({publicUserToken: 'ffffffff-ffff-ffff-ffff-fffffffffff0'})
    }, {
      name: 'fred',
      collection: '/users/fred/tokens-wallet',
      path: '/users/fred/tokens-wallet/self',
      newDocPath: '/users/fred/tokens-wallet/other',
      data: () => ({publicUserToken: 'ffffffff-ffff-ffff-ffff-ffffffffffff'}),
      updatedData: () => ({publicUserToken: 'ffffffff-ffff-ffff-ffff-fffffffffff0'})
    }]
  }, {
    name: '/users/{userId}/preferences/self',
    docInitializations: [{
      name: 'alice',
      collection: '/users/alice/preferences',
      path: '/users/alice/preferences/self',
      newDocPath: '/users/alice/preferences/other',
      data: () => ({pinnedEventIds: []}),
      updatedData: () => ({pinnedEventIds: ['42']})
    }, {
      name: 'fred',
      collection: '/users/fred/preferences',
      path: '/users/fred/preferences/self',
      newDocPath: '/users/fred/preferences/other',
      data: () => ({pinnedEventIds: []}),
      updatedData: () => ({pinnedEventIds: ['42']})
    }]
  }, {
    name: '/users/{userId}/events/{eventId}',
    docInitializations: [{
      name: 'alice',
      collection: '/users/alice/events',
      path: '/users/alice/events/an-event',
      newDocPath: '/users/alice/events/another-event',
      data: () => ({}),
      updatedData: () => ({id: 42})
    }, {
      name: 'fred',
      collection: '/users/fred/events',
      path: '/users/fred/events/an-event',
      newDocPath: '/users/fred/events/another-event',
      data: () => ({}),
      updatedData: () => ({id: 42})
    }]
  }, {
    name: '/users/{userId}/events/{eventId}/talksNotes/{talkId}',
    docInitializations: [{
      name: 'alice',
      collection: '/users/alice/events/an-event/talksNotes',
      path: '/users/alice/events/an-event/talksNotes/12345',
      newDocPath: '/users/alice/events/an-event/talksNotes/54321',
      data: () => ({note: {isFavorite: true}}),
      updatedData: () => ({note: {isFavorite: false}})
    }, {
      name: 'fred',
      collection: '/users/fred/events/an-event/talksNotes',
      path: '/users/fred/events/an-event/talksNotes/12345',
      newDocPath: '/users/fred/events/an-event/talksNotes/54321',
      data: () => ({note: {isFavorite: true}}),
      updatedData: () => ({note: {isFavorite: false}})
    }]
  }, {
    name: '/users/{userId}/events/{eventId}/days/{dayId}',
    docInitializations: [{
      name: 'alice',
      collection: '/users/alice/events/an-event/days',
      path: '/users/alice/events/an-event/days/monday',
      newDocPath: '/users/alice/events/an-event/days/tuesday',
      data: () => ({}),
      updatedData: () => ({id:42})
    }, {
      name: 'fred',
      collection: '/users/fred/events/an-event/days',
      path: '/users/fred/events/an-event/days/monday',
      newDocPath: '/users/fred/events/an-event/days/tuesday',
      data: () => ({}),
      updatedData: () => ({id:42})
    }]
  }, {
    name: '/users/{userId}/events/{eventId}/days/{dayId}/feedbacks/self',
    docInitializations: [{
      name: 'alice',
      collection: '/users/alice/events/an-event/days/monday/feedbacks',
      path: '/users/alice/events/an-event/days/monday/feedbacks/self',
      newDocPath: '/users/alice/events/an-event/days/monday/feedbacks/other',
      data: () => ({dayId: 'monday', feedbacks: []}),
      updatedData: () => ({dayId: 'tuesday', feedbacks: []})
    }, {
      name: 'fred',
      collection: '/users/fred/events/an-event/days/monday/feedbacks',
      path: '/users/fred/events/an-event/days/monday/feedbacks/self',
      newDocPath: '/users/fred/events/an-event/days/monday/feedbacks/other',
      data: () => ({dayId: 'monday', feedbacks: []}),
      updatedData: () => ({dayId: 'tuesday', feedbacks: []})
    }]
  }, {
    name: '/users/{userId}/spaces/{spaceId}',
    docInitializations: [{
      name: 'alice',
      collection: '/users/alice/spaces',
      path: '/users/alice/spaces/12345678-1234-5678-90ab-1234567890ab',
      newDocPath: '/users/alice/spaces/87654321-4321-8765-ba09-ba0987654321',
      data: () => ({}),
      updatedData: () => ({id: 42})
    }, {
      name: 'fred',
      collection: '/users/fred/spaces',
      path: '/users/fred/spaces/12345678-1234-5678-90ab-1234567890ab',
      newDocPath: '/users/fred/spaces/87654321-4321-8765-ba09-ba0987654321',
      data: () => ({}),
      updatedData: () => ({id: 42})
    }]
  }, {
    name: '/users/{userId}/spaces/{spaceId}/events/{eventId}',
    docInitializations: [{
      name: 'alice',
      collection: '/users/alice/spaces/12345678-1234-5678-90ab-1234567890ab/events',
      path: '/users/alice/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event',
      newDocPath: '/users/alice/spaces/12345678-1234-5678-90ab-1234567890ab/events/another-event',
      data: () => ({}),
      updatedData: () => ({id: 42})
    }, {
      name: 'fred',
      collection: '/users/fred/spaces/12345678-1234-5678-90ab-1234567890ab/events',
      path: '/users/fred/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event',
      newDocPath: '/users/fred/spaces/12345678-1234-5678-90ab-1234567890ab/events/another-event',
      data: () => ({}),
      updatedData: () => ({id: 42})
    }]
  }, {
    name: '/users/{userId}/spaces/{spaceId}/events/{eventId}/talksNotes/{talkId}',
    docInitializations: [{
      name: 'alice',
      collection: '/users/alice/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talksNotes',
      path: '/users/alice/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talksNotes/12345',
      newDocPath: '/users/alice/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talksNotes/54321',
      data: () => ({note: {isFavorite: true}}),
      updatedData: () => ({note: {isFavorite: false}})
    }, {
      name: 'fred',
      collection: '/users/fred/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talksNotes',
      path: '/users/fred/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talksNotes/12345',
      newDocPath: '/users/fred/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talksNotes/54321',
      data: () => ({note: {isFavorite: true}}),
      updatedData: () => ({note: {isFavorite: false}})
    }]
  }, {
    name: '/users/{userId}/spaces/{spaceId}/events/{eventId}/days/{dayId}',
    docInitializations: [{
      name: 'alice',
      collection: '/users/alice/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/days',
      path: '/users/alice/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/days/monday',
      newDocPath: '/users/alice/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/days/tuesday',
      data: () => ({}),
      updatedData: () => ({id:42})
    }, {
      name: 'fred',
      collection: '/users/fred/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/days',
      path: '/users/fred/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/days/monday',
      newDocPath: '/users/fred/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/days/tuesday',
      data: () => ({}),
      updatedData: () => ({id:42})
    }]
  }, {
    name: '/users/{userId}/spaces/{spaceId}/events/{eventId}/days/{dayId}/feedbacks/self',
    docInitializations: [{
      name: 'alice',
      collection: '/users/alice/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/days/monday/feedbacks',
      path: '/users/alice/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/days/monday/feedbacks/self',
      newDocPath: '/users/alice/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/days/monday/feedbacks/other',
      data: () => ({dayId: 'monday', feedbacks: []}),
      updatedData: () => ({dayId: 'tuesday', feedbacks: []})
    }, {
      name: 'fred',
      collection: '/users/fred/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/days/monday/feedbacks',
      path: '/users/fred/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/days/monday/feedbacks/self',
      newDocPath: '/users/fred/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/days/monday/feedbacks/other',
      data: () => ({dayId: 'monday', feedbacks: []}),
      updatedData: () => ({dayId: 'tuesday', feedbacks: []})
    }]
  }, {
    name: '/public-tokens/{tokenId}',
    docInitializations: [{
      name: 'default',
      collection: '/public-tokens',
      path: '/public-tokens/eventStats:devoxx-voxxed:ffffffff-ffff-ffff-ffff-ffffffffffff',
      newDocPath: '/public-tokens/eventStats:devoxx-voxxed:ffffffff-ffff-ffff-ffff-fffffffffff0',
      data: () => ({type: "FamilyEventsStatsAccess", eventFamilies: ["voxxed", "devoxx"]}),
      updatedData: () => ({type: "FamilyEventsStatsAccess", eventFamilies: ["voxxed"]})
    }]
  }, {
    name: '/global-infos/self',
    docInitializations: [{
      name: 'default',
      collection: '/global-infos',
      path: '/global-infos/self',
      newDocPath: '/global-infos/other',
      data: () => ({lastSlowPacedTalkStatsRefreshExecution: "1970-01-01T00:00:00Z"}),
      updatedData: () => ({lastSlowPacedTalkStatsRefreshExecution: "1970-01-02T00:00:00Z"})
    }]
  }, {
    name: '/crawlers/{crawlerId}',
    docInitializations: [{
      name: 'default',
      collection: '/crawlers',
      path: '/crawlers/a-crawler',
      newDocPath: '/crawlers/another-crawler',
      data: () => ({
        descriptorUrl: 'https://path-to-descriptor.json',
      }),
      updatedData: () => ({
        descriptorUrl: 'https://path-to-descriptor2.json',
      })
    }]
  }, {
    name: '/schema-migrations/self',
    docInitializations: [{
      name: 'default',
      collection: '/schema-migrations',
      path: '/schema-migrations/self',
      newDocPath: '/schema-migrations/other',
      data: () => ({migrations: []}),
      updatedData: () => ({migrations: ['42']})
    }]
  }, {
    name: '/events/{eventId}',
    docInitializations: [{
      name: 'default',
      collection: '/events',
      path: '/events/an-event',
      newDocPath: '/events/another-event',
      data: () => ({title: `A super event`}),
      updatedData: () => ({title: `A super super event`})
    }]
  }, {
    name: '/events/{eventId}/organizer-space/{secretSpaceId}',
    docInitializations: [{
      name: 'default',
      collection: '/events/an-event/organizer-space',
      path: '/events/an-event/organizer-space/ffffffff-ffff-ffff-ffff-ffffffffffff',
      newDocPath: '/events/an-event/organizer-space/ffffffff-ffff-ffff-ffff-fffffffffff0',
      data: () => ({organizerSecretToken: 'ffffffff-ffff-ffff-ffff-ffffffffffff'}),
      updatedData: () => ({organizerSecretToken: 'ffffffff-ffff-ffff-ffff-fffffffffff0'})
    }]
  }, {
    name: '/events/{eventId}/organizer-space/{secretSpaceId}/ratings/{ratingId}',
    docInitializations: [{
      name: 'default',
      collection: '/events/an-event/organizer-space/ffffffff-ffff-ffff-ffff-ffffffffffff/ratings',
      path: '/events/an-event/organizer-space/ffffffff-ffff-ffff-ffff-ffffffffffff/ratings/12345',
      newDocPath: '/events/an-event/organizer-space/ffffffff-ffff-ffff-ffff-ffffffffffff/ratings/54321',
      data: () => ({}),
      updatedData: () => ({id:42})
    }]
  }, {
    name: '/events/{eventId}/organizer-space/{secretSpaceId}/daily-ratings/{dayId}',
    docInitializations: [{
      name: 'default',
      collection: '/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/daily-ratings',
      path: '/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/daily-ratings/monday',
      newDocPath: '/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/daily-ratings/tuesday',
      data: () => ({}),
      updatedData: () => ({id:42})
    }]
  }, {
    name: '/events/{eventId}/days/{dayId}',
    docInitializations: [{
      name: 'default',
      collection: '/events/an-event/days',
      path: '/events/an-event/days/monday',
      newDocPath: '/events/an-event/days/tuesday',
      data: () => ({day: 'monday', timeSlots: []}),
      updatedData: () => ({day: 'tuesday', timeSlots: []})
    }]
  }, {
    name: '/events/{eventId}/event-descriptor/self',
    docInitializations: [{
      name: 'default',
      collection: '/events/an-event/event-descriptor',
      path: '/events/an-event/event-descriptor/self',
      newDocPath: '/events/an-event/event-descriptor/other',
      data: () => ({title: `A super event`}),
      updatedData: () => ({title: `A super super event`})
    }]
  }, {
    name: '/events/{eventId}/talksStats-allInOne/self',
    docInitializations: [{
      name: 'default',
      collection: '/events/an-event/talksStats-allInOne',
      path: '/events/an-event/talksStats-allInOne/self',
      newDocPath: '/events/an-event/talksStats-allInOne/other',
      data: () => ({"12345": {id: `12345`, totalFavoritesCount: 0}}),
      updatedData: () => ({"54321": {id: `12345`, totalFavoritesCount: 0}})
    }]
  }, {
    name: '/events/{eventId}/talksStats/{talkId}',
    docInitializations: [{
      name: 'default',
      collection: '/events/an-event/talksStats',
      path: '/events/an-event/talksStats/12345',
      newDocPath: '/events/an-event/talksStats/54321',
      data: () => ({id: `12345`, totalFavoritesCount: 0}),
      updatedData: () => ({id: `54321`, totalFavoritesCount: 0})
    }]
  }, {
    name: '/events/{eventId}/talksStats-slowPaced/{talkId}',
    docInitializations: [{
      name: 'default',
      collection: '/events/an-event/talksStats-slowPaced',
      path: '/events/an-event/talksStats-slowPaced/12345',
      newDocPath: '/events/an-event/talksStats-slowPaced/54321',
      data: () => ({id: `12345`, totalFavoritesCount: 0}),
      updatedData: () => ({id: `54321`, totalFavoritesCount: 0})
    }]
  }, {
    name: '/events/{eventId}/roomsStats-allInOne/self',
    docInitializations: [{
      name: 'default',
      collection: '/events/an-event/roomsStats-allInOne',
      path: '/events/an-event/roomsStats-allInOne/self',
      newDocPath: '/events/an-event/roomsStats-allInOne/other',
      data: () => ({
        "12345": {
          roomId: `12345`,
          capacityFillingRatio: 0,
          recordedAt: "2024-03-28T11:58:10Z",
          persistedAt: "2024-03-28T12:00:00Z"
        }
      }),
      updatedData: () => ({
        "54321": {
          roomId: `54321`,
          capacityFillingRatio: 0,
          recordedAt: "2024-03-28T11:58:10Z",
          persistedAt: "2024-03-28T12:00:00Z"
        }
      }),
    }]
  }, {
    name: '/events/{eventId}/last-updates/self',
    docInitializations: [{
      name: 'default',
      collection: '/events/an-event/last-updates',
      path: '/events/an-event/last-updates/self',
      newDocPath: '/events/an-event/last-updates/other',
      data: () => ({favorites: '2023-09-01T00:00:00Z'}),
      updatedData: () => ({favorites: '2023-09-02T00:00:00Z'})
    }]
  }, {
    name: '/events/{eventId}/talks/{talkId}',
    docInitializations: [{
      name: 'default',
      collection: '/events/an-event/talks',
      path: '/events/an-event/talks/1234',
      newDocPath: '/events/an-event/talks/4321',
      data: () => ({id: '1234', title: 'A super talk'}),
      updatedData: () => ({id: '4321', title: 'A super talk'})
    }]
  }, {
    name: '/events/{eventId}/talks/{talkId}/feedbacks-access/{secretFeedbackAccessToken}',
    docInitializations: [{
      name: 'default',
      collection: '/events/an-event/talks/1234/feedbacks-access',
      path: '/events/an-event/talks/1234/feedbacks-access/ffffffff-ffff-ffff-ffff-ffffffffffff',
      newDocPath: '/events/an-event/talks/1234/feedbacks-access/ffffffff-ffff-ffff-ffff-fffffffffff0',
      data: () => ({}),
      updatedData: () => ({id: 42})
    }]
  }, {
    name: '/events/{eventId}/talks/{talkId}/feedbacks-access/{secretFeedbackAccessToken}/feedbacks/{userPublicToken}',
    docInitializations: [{
      name: 'default',
      collection: '/events/an-event/talks/1234/feedbacks-access/ffffffff-ffff-ffff-ffff-ffffffffffff/feedbacks',
      path: '/events/an-event/talks/1234/feedbacks-access/ffffffff-ffff-ffff-ffff-ffffffffffff/feedbacks/ffffffff-ffff-ffff-ffff-ffffffffff00',
      newDocPath: '/events/an-event/talks/1234/feedbacks-access/ffffffff-ffff-ffff-ffff-ffffffffffff/feedbacks/ffffffff-ffff-ffff-ffff-ffffffffff01',
      data: () => ({attendeePublicToken: 'ffffffff-ffff-ffff-ffff-ffffffffff00', talkId: '1234'}),
      updatedData: () => ({attendeePublicToken: 'ffffffff-ffff-ffff-ffff-ffffffffff01', talkId: '1234'})
    }]
  }, {
    name: '/spaces/{spaceId}',
    docInitializations: [{
      name: 'default',
      collection: '/spaces',
      path: '/spaces/12345678-1234-5678-90ab-1234567890ab',
      newDocPath: '/spaces/87654321-4321-8765-ba09-ba0987654321',
      data: () => ({id: '12345678-1234-5678-90ab-1234567890ab' }),
      updatedData: () => ({id: '87654321-4321-8765-ba09-ba0987654321'})
    }]
  }, {
    name: '/spaces/{spaceId}/events/{eventId}',
    docInitializations: [{
      name: 'default',
      collection: '/spaces/12345678-1234-5678-90ab-1234567890ab/events',
      path: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event',
      newDocPath: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/another-event',
      data: () => ({title: `A super event`}),
      updatedData: () => ({title: `A super super event`})
    }]
  }, {
    name: '/spaces/{spaceId}/events/{eventId}/organizer-space/{secretSpaceId}',
    docInitializations: [{
      name: 'default',
      collection: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/organizer-space',
      path: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/organizer-space/ffffffff-ffff-ffff-ffff-ffffffffffff',
      newDocPath: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/organizer-space/ffffffff-ffff-ffff-ffff-fffffffffff0',
      data: () => ({organizerSecretToken: 'ffffffff-ffff-ffff-ffff-ffffffffffff'}),
      updatedData: () => ({organizerSecretToken: 'ffffffff-ffff-ffff-ffff-fffffffffff0'})
    }]
  }, {
    name: '/spaces/{spaceId}/events/{eventId}/organizer-space/{secretSpaceId}/ratings/{ratingId}',
    docInitializations: [{
      name: 'default',
      collection: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/organizer-space/ffffffff-ffff-ffff-ffff-ffffffffffff/ratings',
      path: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/organizer-space/ffffffff-ffff-ffff-ffff-ffffffffffff/ratings/12345',
      newDocPath: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/organizer-space/ffffffff-ffff-ffff-ffff-ffffffffffff/ratings/54321',
      data: () => ({}),
      updatedData: () => ({id:42})
    }]
  }, {
    name: '/spaces/{spaceId}/events/{eventId}/organizer-space/{secretSpaceId}/daily-ratings/{dayId}',
    docInitializations: [{
      name: 'default',
      collection: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/daily-ratings',
      path: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/daily-ratings/monday',
      newDocPath: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/daily-ratings/tuesday',
      data: () => ({}),
      updatedData: () => ({id:42})
    }]
  }, {
    name: '/spaces/{spaceId}/events/{eventId}/days/{dayId}',
    docInitializations: [{
      name: 'default',
      collection: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/days',
      path: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/days/monday',
      newDocPath: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/days/tuesday',
      data: () => ({day: 'monday', timeSlots: []}),
      updatedData: () => ({day: 'tuesday', timeSlots: []})
    }]
  }, {
    name: '/spaces/{spaceId}/events/{eventId}/event-descriptor/self',
    docInitializations: [{
      name: 'default',
      collection: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/event-descriptor',
      path: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/event-descriptor/self',
      newDocPath: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/event-descriptor/other',
      data: () => ({title: `A super event`}),
      updatedData: () => ({title: `A super super event`})
    }]
  }, {
    name: '/spaces/{spaceId}/events/{eventId}/talksStats-allInOne/self',
    docInitializations: [{
      name: 'default',
      collection: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talksStats-allInOne',
      path: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talksStats-allInOne/self',
      newDocPath: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talksStats-allInOne/other',
      data: () => ({"12345": {id: `12345`, totalFavoritesCount: 0}}),
      updatedData: () => ({"54321": {id: `12345`, totalFavoritesCount: 0}})
    }]
  }, {
    name: '/spaces/{spaceId}/events/{eventId}/talksStats/{talkId}',
    docInitializations: [{
      name: 'default',
      collection: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talksStats',
      path: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talksStats/12345',
      newDocPath: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talksStats/54321',
      data: () => ({id: `12345`, totalFavoritesCount: 0}),
      updatedData: () => ({id: `54321`, totalFavoritesCount: 0})
    }]
  }, {
    name: '/spaces/{spaceId}/events/{eventId}/talksStats-slowPaced/{talkId}',
    docInitializations: [{
      name: 'default',
      collection: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talksStats-slowPaced',
      path: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talksStats-slowPaced/12345',
      newDocPath: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talksStats-slowPaced/54321',
      data: () => ({id: `12345`, totalFavoritesCount: 0}),
      updatedData: () => ({id: `54321`, totalFavoritesCount: 0})
    }]
  }, {
    name: '/spaces/{spaceId}/events/{eventId}/roomsStats-allInOne/self',
    docInitializations: [{
      name: 'default',
      collection: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/roomsStats-allInOne',
      path: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/roomsStats-allInOne/self',
      newDocPath: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/roomsStats-allInOne/other',
      data: () => ({
        "12345": {
          roomId: `12345`,
          capacityFillingRatio: 0,
          recordedAt: "2024-03-28T11:58:10Z",
          persistedAt: "2024-03-28T12:00:00Z"
        }
      }),
      updatedData: () => ({
        "54321": {
          roomId: `54321`,
          capacityFillingRatio: 0,
          recordedAt: "2024-03-28T11:58:10Z",
          persistedAt: "2024-03-28T12:00:00Z"
        }
      }),
    }]
  }, {
    name: '/spaces/{spaceId}/events/{eventId}/last-updates/self',
    docInitializations: [{
      name: 'default',
      collection: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/last-updates',
      path: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/last-updates/self',
      newDocPath: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/last-updates/other',
      data: () => ({favorites: '2023-09-01T00:00:00Z'}),
      updatedData: () => ({favorites: '2023-09-02T00:00:00Z'})
    }]
  }, {
    name: '/spaces/{spaceId}/events/{eventId}/talks/{talkId}',
    docInitializations: [{
      name: 'default',
      collection: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talks',
      path: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talks/1234',
      newDocPath: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talks/4321',
      data: () => ({id: '1234', title: 'A super talk'}),
      updatedData: () => ({id: '4321', title: 'A super talk'})
    }]
  }, {
    name: '/spaces/{spaceId}/events/{eventId}/talks/{talkId}/feedbacks-access/{secretFeedbackAccessToken}',
    docInitializations: [{
      name: 'default',
      collection: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talks/1234/feedbacks-access',
      path: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talks/1234/feedbacks-access/ffffffff-ffff-ffff-ffff-ffffffffffff',
      newDocPath: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talks/1234/feedbacks-access/ffffffff-ffff-ffff-ffff-fffffffffff0',
      data: () => ({}),
      updatedData: () => ({id: 42})
    }]
  }, {
    name: '/spaces/{spaceId}/events/{eventId}/talks/{talkId}/feedbacks-access/{secretFeedbackAccessToken}/feedbacks/{userPublicToken}',
    docInitializations: [{
      name: 'default',
      collection: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talks/1234/feedbacks-access/ffffffff-ffff-ffff-ffff-ffffffffffff/feedbacks',
      path: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talks/1234/feedbacks-access/ffffffff-ffff-ffff-ffff-ffffffffffff/feedbacks/ffffffff-ffff-ffff-ffff-ffffffffff00',
      newDocPath: '/spaces/12345678-1234-5678-90ab-1234567890ab/events/an-event/talks/1234/feedbacks-access/ffffffff-ffff-ffff-ffff-ffffffffffff/feedbacks/ffffffff-ffff-ffff-ffff-ffffffffff01',
      data: () => ({attendeePublicToken: 'ffffffff-ffff-ffff-ffff-ffffffffff00', talkId: '1234'}),
      updatedData: () => ({attendeePublicToken: 'ffffffff-ffff-ffff-ffff-ffffffffff01', talkId: '1234'})
    }]
  },
] as const;

type ManagedCollectionsName = (typeof FIREBASE_MANAGED_COLLECTIONS)[number]['name'];
type NamedManagedCollection<NAME extends ManagedCollectionsName> = Extract<(typeof FIREBASE_MANAGED_COLLECTIONS)[number], { name: NAME }>
type ManageCollectionDocInitializationNames<NAME extends ManagedCollectionsName> = NamedManagedCollection<NAME>['docInitializations'][number]['name'];

function findManagedCollection<NAME extends ManagedCollectionsName>(name: NAME): NamedManagedCollection<NAME>;
function findManagedCollection<NAME extends ManagedCollectionsName>(name: NAME) {
  return FIREBASE_MANAGED_COLLECTIONS.find(coll => coll.name === name);
}

beforeAll(async () => {
    await Promise.all([
        ...FIREBASE_MANAGED_COLLECTIONS.flatMap(ruleDescriptor => ruleDescriptor.docInitializations.map(docInit => adminFirestore.doc(docInit.path).set(docInit.data()))),
    ])
})
afterAll(async () => {
    await Promise.all([
      ...[...FIREBASE_MANAGED_COLLECTIONS].reverse().map(ruleDescriptor => ruleDescriptor.docInitializations.map(docInit => adminFirestore.doc(docInit.path).delete())),
    ]);
})

const USER_CONTEXTS = [
    { name: "unauthenticated user", context: () => testEnv.unauthenticatedContext() },
    { name: "fred user", context: () => testEnv.authenticatedContext('fred') },
] as const;

const SPACES = [
  { name: "public", id: undefined, },
  { name: "private", id: "12345678-1234-5678-90ab-1234567890ab", },
] as const;

type UserContext = typeof USER_CONTEXTS[number];

type CollectionDescriptor = {
    name: string,
    aroundTests: (userContext: UserContext) => {
        beforeEach: Array<Promise<any>>,
        afterEach: Array<Promise<any>>,
    },
    tests: (userContext: UserContext) => void,
    spaceId?: string|undefined,
}

type FirebaseAccessPermissionCheck = boolean|'check-skipped';
type FirebaseAccessPermission =
  { get: FirebaseAccessPermissionCheck, list: FirebaseAccessPermissionCheck, delete: FirebaseAccessPermissionCheck, createDoc: FirebaseAccessPermissionCheck, createNew: FirebaseAccessPermissionCheck, update: FirebaseAccessPermissionCheck }
  | { get: FirebaseAccessPermissionCheck, list: FirebaseAccessPermissionCheck, write: FirebaseAccessPermissionCheck }
  | { read: FirebaseAccessPermissionCheck, write: FirebaseAccessPermissionCheck };

async function ensureCollectionFollowAccessPermissions<NAME extends ManagedCollectionsName>(
  collectionName: NAME, userContext: UserContext,
  expectedAccessPermission: FirebaseAccessPermission, initializationName?: ManageCollectionDocInitializationNames<NAME>
) {
  return _ensureCollectionFollowAccessPermissions(
    collectionName, userContext,
    match(expectedAccessPermission)
      .with({ get: P.boolean.or("check-skipped"), list: P.boolean.or("check-skipped"), delete: P.boolean.or("check-skipped"), createDoc: P.boolean.or("check-skipped"), createNew: P.boolean.or("check-skipped"), update: P.boolean.or("check-skipped") }, access => access)
      .with({ get: P.boolean.or("check-skipped"), list: P.boolean.or("check-skipped"), write: P.boolean.or("check-skipped") }, access => ({ get: access.get, list: access.list, delete: access.write, createDoc: access.write, createNew: access.write, update: access.write }))
      .with({ read: P.boolean.or("check-skipped"), write: P.boolean.or("check-skipped") }, access => ({ get: access.read, list: access.read, delete: access.write, createDoc: access.write, createNew: access.write, update: access.write }))
      .exhaustive(),
    initializationName
  )
}
async function _ensureCollectionFollowAccessPermissions<NAME extends ManagedCollectionsName>(
  collectionName: NAME, userContext: UserContext,
  expectedAccessPermission: { get: FirebaseAccessPermissionCheck, list: FirebaseAccessPermissionCheck, delete: FirebaseAccessPermissionCheck, createDoc: FirebaseAccessPermissionCheck, createNew: FirebaseAccessPermissionCheck, update: FirebaseAccessPermissionCheck },
  initializationName?: ManageCollectionDocInitializationNames<NAME>
) {
  const managedCollection = findManagedCollection(collectionName);
  const docInitialization = [...managedCollection.docInitializations].find(docInit => docInit.name === (initializationName || "default"))!;

  if(!expectedAccessPermission.list) {
    it(`As ${userContext.name}, I should *NOT* be able to LIST ${docInitialization.collection}`, async () => {
      await assertFails(getDocs(collection(userContext.context().firestore(), docInitialization.collection)));
    })
  } else if(expectedAccessPermission.list !== 'check-skipped') {
    it(`As ${userContext.name}, I should be able to LIST ${docInitialization.collection}`, async () => {
      await assertSucceeds(getDocs(collection(userContext.context().firestore(), docInitialization.collection)));
    })
  }

  if(!expectedAccessPermission.get) {
    it(`As ${userContext.name}, I should *NOT* be able to GET any ${docInitialization.path}`, async () => {
      await assertFails(getDoc(doc(userContext.context().firestore(), docInitialization.path)));
    })
  } else if(expectedAccessPermission.get !== 'check-skipped') {
    it(`As ${userContext.name}, I should be able to GET any ${docInitialization.path}`, async () => {
      await assertSucceeds(getDoc(doc(userContext.context().firestore(), docInitialization.path)));
    })
  }

  if(!expectedAccessPermission.createDoc) {
    it(`As ${userContext.name}, I should *NOT* be able to CREATE ${docInitialization.path}`, async () => {
      await assertFails(setDoc(doc(userContext.context().firestore(), docInitialization.path), docInitialization.data()));
    })
  } else if(expectedAccessPermission.createDoc !== 'check-skipped') {
    it(`As ${userContext.name}, I should be able to CREATE ${docInitialization.path}`, async () => {
      await assertSucceeds(setDoc(doc(userContext.context().firestore(), docInitialization.path), docInitialization.data()));
    })
  }

  if(!expectedAccessPermission.createNew) {
    it(`As ${userContext.name}, I should *NOT* be able to CREATE ${docInitialization.newDocPath}`, async () => {
      await assertFails(setDoc(doc(userContext.context().firestore(), docInitialization.newDocPath), docInitialization.data()));
    })
  } else if(expectedAccessPermission.createNew !== 'check-skipped') {
    it(`As ${userContext.name}, I should be able to CREATE ${docInitialization.newDocPath}`, async () => {
      await assertSucceeds(setDoc(doc(userContext.context().firestore(), docInitialization.newDocPath), docInitialization.data()));
    })
  }

  if(!expectedAccessPermission.update) {
    it(`As ${userContext.name}, I should *NOT* be able to UPDATE ${docInitialization.path}`, async () => {
      await assertFails(updateDoc(doc(userContext.context().firestore(), docInitialization.path), docInitialization.updatedData()));
    })
  } else if(expectedAccessPermission.update !== 'check-skipped') {
    it(`As ${userContext.name}, I should be able to UPDATE ${docInitialization.path}`, async () => {
      await assertSucceeds(updateDoc(doc(userContext.context().firestore(), docInitialization.path), docInitialization.updatedData()));
    })
  }

  if(!expectedAccessPermission.delete) {
    it(`As ${userContext.name}, I should not be able to DELETE ${docInitialization.path}`, async () => {
      await assertFails(deleteDoc(doc(userContext.context().firestore(), docInitialization.path)));
    })
  } else if(expectedAccessPermission.delete !== 'check-skipped') {
    it(`As ${userContext.name}, I should not be able to DELETE ${docInitialization.path}`, async () => {
      await assertSucceeds(deleteDoc(doc(userContext.context().firestore(), docInitialization.path)));
    })
  }

}

const COLLECTIONS: CollectionDescriptor[] = [{
    name: "/users",
    aroundTests: (userContext: UserContext) => match(userContext)
        .with({ name: "unauthenticated user" },  () => ({
            beforeEach: [],
            afterEach: [],
        }))
        .with({ name: "fred user" },  () => ({
            beforeEach: [],
            afterEach: [],
        })).run(),
    tests: (userContext: UserContext) => {
        ensureCollectionFollowAccessPermissions('/users/{userId}', userContext,
          {
            list: false, delete: false,
            get: userContext.name === 'fred user',
            createDoc: 'check-skipped', createNew: 'check-skipped', update: 'check-skipped' // see below for specificities due to userLastConnection field
          }, 'fred')

        ensureCollectionFollowAccessPermissions('/users/{userId}', userContext,
          {
            list: false, createNew: false, delete: false, update: false,
            get: false, createDoc: false
          }, 'alice')

        const fredUserPath = () => doc(userContext.context().firestore(),
          findManagedCollection('/users/{userId}').docInitializations.find(docInit => docInit.name === 'fred')!.path
        );
        const aliceUserPath = () => doc(userContext.context().firestore(),
          findManagedCollection('/users/{userId}').docInitializations.find(docInit => docInit.name === 'alice')!.path
        );
        if(userContext.name === 'fred user') {
          // Had to skip this test because on emulator firestore rules, onlyAllowedUpdatableFields() will not behave exactly
          // like in prod (resource being undefined makes every resource-based calls return a non-boolean value ... spent hours to see if it was doable
          // to check for undefined resource on emulator but never found any viable solution to make it work like in production firestore)
          // I tested this case in real life though, and it's working:
          // - Check that an already-authenticated session can update its userLastConnection field
          // - Open an incognito window and check that a newly-created session has his whole /users/{userId} node created
          // - Alter AuthenticatedUserContextProvider and try to add another field than only userLastConnection field and check that
          //   both update and new-creation (in incognito session) are forbidden
          it.skip(`As ${userContext.name}, I should be able to only CREATE userLastConnection field in *my user's* infos`, async () => {
            await assertSucceeds(setDoc(fredUserPath(), { userLastConnection: new Date().toISOString() }))
          })
          it(`As ${userContext.name}, I should *NOT* be able to only CREATE userLastConnection field in *another user's* infos`, async () => {
            await assertFails(setDoc(aliceUserPath(), { userLastConnection: new Date().toISOString() }))
          })

          it(`As ${userContext.name}, I should *NOT* be able to CREATE other fields than userLastConnection field in *my user's* infos`, async () => {
            await assertFails(setDoc(fredUserPath(), { userLastConnection: new Date().toISOString(), additionalField: "foo", }))
          })
          it(`As ${userContext.name}, I should *NOT* be able to CREATE other fields than userLastConnection field in *another user's* infos`, async () => {
            await assertFails(setDoc(aliceUserPath(), { userLastConnection: new Date().toISOString(), additionalField: "foo", }))
          })

          it(`As ${userContext.name}, I should be able to only UPDATE userLastConnection field in *my user's* infos`, async () => {
            await assertSucceeds(updateDoc(fredUserPath(), { userLastConnection: new Date().toISOString() }))
          })
          it(`As ${userContext.name}, I should *NOT* be able to only UPDATE userLastConnection field in *another user's* infos`, async () => {
            await assertFails(updateDoc(aliceUserPath(), { userLastConnection: new Date().toISOString() }))
          })

          it(`As ${userContext.name}, I should *NOT* be able to UPDATE other fields than userLastConnection in *my user's* infos`, async () => {
            await assertFails(updateDoc(fredUserPath(), { userLastConnection: new Date().toISOString(), additionalField: "foo", }))
          })
          it(`As ${userContext.name}, I should *NOT* be able to UPDATE other fields than userLastConnection in *another user's* infos`, async () => {
            await assertFails(updateDoc(aliceUserPath(), { userLastConnection: new Date().toISOString(), additionalField: "foo", }))
          })
        } else {
          it(`As ${userContext.name}, I should *NOT* be able to only CREATE userLastConnection field in *another user's* infos`, async () => {
            await assertFails(setDoc(fredUserPath(), { userLastConnection: new Date().toISOString() }))
          })
          it(`As ${userContext.name}, I should *NOT* be able to CREATE other fields than userLastConnection in *another user's* infos`, async () => {
            await assertFails(setDoc(fredUserPath(), { userLastConnection: new Date().toISOString(), additionalField: "foo", }))
          })

          it(`As ${userContext.name}, I should *NOT* be able to only UPDATE userLastConnection field in *another user's* infos`, async () => {
            await assertFails(updateDoc(fredUserPath(), { userLastConnection: new Date().toISOString() }))
          })
          it(`As ${userContext.name}, I should *NOT* be able to UPDATE other fields than userLastConnection in *another user's* infos`, async () => {
            await assertFails(updateDoc(fredUserPath(), { userLastConnection: new Date().toISOString(), additionalField: "foo", }))
          })
          // it(`test bidon`, () => {})
        }
    }
}, {
    name: "/users/{userId}/tokens-wallet",
    aroundTests: (userContext: UserContext) => match(userContext)
        .with({ name: "unauthenticated user" },  () => ({
            beforeEach: [],
            afterEach: [],
        }))
        .with({ name: "fred user" },  () => ({
            beforeEach: [],
            afterEach: [],
        })).run(),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions('/users/{userId}/tokens-wallet/self', userContext,
        {
          get: userContext.name === 'fred user', update: false,
          createDoc: false, delete: userContext.name === 'fred user',
          list: false, createNew: false,
        }, 'fred')

      ensureCollectionFollowAccessPermissions('/users/{userId}/tokens-wallet/self', userContext,
        {
          list: false, createDoc: false, delete: false, get: false, update: false, createNew: false
        }, 'alice')
    }
}, {
    name: "/users/{userId}/preferences",
    aroundTests: (userContext: UserContext) => match(userContext)
        .with({ name: "unauthenticated user" },  () => ({
            beforeEach: [],
            afterEach: [],
        }))
        .with({ name: "fred user" },  () => ({
            beforeEach: [],
            afterEach: [],
        })).run(),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions('/users/{userId}/preferences/self', userContext,
        {
          get: userContext.name === 'fred user', update: userContext.name === 'fred user',
          createDoc: userContext.name === 'fred user',
          list: false, delete: false, createNew: false,
        }, 'fred')

      ensureCollectionFollowAccessPermissions('/users/{userId}/preferences/self', userContext,
        {
          get: false, update: false, createDoc: false,
          list: false, delete: false, createNew: false,
        }, 'alice')
    }
}, {
    name: "/users/{userId}/spaces",
    aroundTests: (userContext: UserContext) => match(userContext)
        .with({ name: "unauthenticated user" },  () => ({
            beforeEach: [],
            afterEach: [],
        }))
        .with({ name: "fred user" },  () => ({
            beforeEach: [],
            afterEach: [],
        })).run(),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions('/users/{userId}/spaces/{spaceId}', userContext,
        {
          get: userContext.name === 'fred user', update: false,
          createDoc: false,
          list: userContext.name === 'fred user', delete: false, createNew: false,
        }, 'fred')

      ensureCollectionFollowAccessPermissions('/users/{userId}/spaces/{spaceId}', userContext,
        {
          get: false, update: false, createDoc: false,
          list: false, delete: false, createNew: false,
        }, 'alice')
    }
}, ...SPACES.flatMap(space => [
  {
    name: `/users/{userId}/${eventsFirestorePath(space.id)}`,
    aroundTests: (userContext: UserContext) => match(userContext)
      .with({ name: "unauthenticated user" },  () => ({
        beforeEach: [],
        afterEach: [],
      }))
      .with({ name: "fred user" },  () => ({
        beforeEach: [],
        afterEach: [],
      })).run(),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/users/{userId}/${eventFirestorePath(space.id)}`, userContext,
        {
          delete: false,
          get: userContext.name === 'fred user', update: false,
          list: userContext.name === 'fred user', createDoc: false,
          createNew: false,
        }, 'fred')

      ensureCollectionFollowAccessPermissions(`/users/{userId}/${eventFirestorePath(space.id)}`, userContext,
        {
          delete: false,
          get: false, update: false, list: false, createDoc: false, createNew: false,
        }, 'alice')
    }
  }, {
    name: `/users/{userId}/${eventFirestorePath(space.id)}/talksNotes`,
    aroundTests: (userContext: UserContext) => match(userContext)
      .with({ name: "unauthenticated user" },  () => ({
        beforeEach: [],
        afterEach: [],
      }))
      .with({ name: "fred user" },  () => ({
        beforeEach: [],
        afterEach: [],
      })).run(),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/users/{userId}/${eventFirestorePath(space.id)}/talksNotes/{talkId}`, userContext,
        {
          delete: false,
          get: userContext.name === 'fred user', update: userContext.name === 'fred user',
          list: userContext.name === 'fred user', createDoc: userContext.name === 'fred user',
          createNew: userContext.name === 'fred user',
        }, 'fred')

      ensureCollectionFollowAccessPermissions(`/users/{userId}/${eventFirestorePath(space.id)}/talksNotes/{talkId}`, userContext,
        {
          delete: false,
          get: false, update: false, list: false, createDoc: false, createNew: false,
        }, 'alice')
    }
  }, {
    name: `/users/{userId}/${eventFirestorePath(space.id)}/days`,
    aroundTests: (userContext: UserContext) => match(userContext)
      .with({ name: "unauthenticated user" },  () => ({
        beforeEach: [
        ],
        afterEach: [
        ]
      }))
      .with({ name: "fred user" },  () => ({
        beforeEach: [
        ],
        afterEach: [
        ]
      })).run(),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/users/{userId}/${eventFirestorePath(space.id)}/days/{dayId}`, userContext,
        {
          delete: false,
          get: userContext.name === 'fred user', update: false,
          list: userContext.name === 'fred user', createDoc: false,
          createNew: false,
        }, 'fred')

      ensureCollectionFollowAccessPermissions(`/users/{userId}/${eventFirestorePath(space.id)}/days/{dayId}`, userContext,
        {
          delete: false,
          get: false, update: false, list: false, createDoc: false, createNew: false,
        }, 'alice')
    }
  }, {
    name: `/users/{userId}/${eventFirestorePath(space.id)}/days/{dayId}/feedbacks`,
    aroundTests: (userContext: UserContext) => match(userContext)
      .with({ name: "unauthenticated user" },  () => ({
        beforeEach: [
        ],
        afterEach: [
        ]
      }))
      .with({ name: "fred user" },  () => ({
        beforeEach: [
        ],
        afterEach: [
        ]
      })).run(),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/users/{userId}/${eventFirestorePath(space.id)}/days/{dayId}/feedbacks/self`, userContext,
        {
          delete: false, list: false, createNew: false,
          get: userContext.name === 'fred user', update: userContext.name === 'fred user',
          createDoc: userContext.name === 'fred user',
        }, 'fred')

      ensureCollectionFollowAccessPermissions(`/users/{userId}/${eventFirestorePath(space.id)}/days/{dayId}/feedbacks/self`, userContext,
        {
          delete: false, list: false, createNew: false,
          get: false, update: false, createDoc: false,
        }, 'alice')
    }
  }
]), {
    name: "/public-tokens",
    aroundTests: (_: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions('/public-tokens/{tokenId}', userContext,
        {
          get: true,
          list: false, write: false
        })
    }
}, {
    name: "/global-infos",
    aroundTests: (_: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions('/global-infos/self', userContext,
        {
          read: false, write: false
        })
    }
}, {
    name: "/crawlers",
    aroundTests: (_: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions('/crawlers/{crawlerId}', userContext,
        {
          read: false, write: false
        })
    }
}, {
    name: "/schema-migrations",
    aroundTests: (_: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions('/schema-migrations/self', userContext,
        {
          read: false, write: false
        })
    }
}, {
    name: "/spaces",
    aroundTests: (_: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions('/spaces/{spaceId}', userContext,
        {
          get: true, list: false, write: false,
        })
    }
}, ...SPACES.flatMap(space => [
  {
    name: `/${eventsFirestorePath(space.id)}`,
    aroundTests: (_: UserContext) => ({
      beforeEach: [],
      afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/${eventFirestorePath(space.id)}`, userContext,
        {
          read: true, write: false
        })
    },
    spaceId: space.id,
  }, {
    name: `/${eventFirestorePath(space.id)}/days`,
    aroundTests: (_: UserContext) => ({
      beforeEach: [],
      afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/${eventFirestorePath(space.id)}/days/{dayId}`, userContext,
        {
          read: true, write: false
        })
    },
    spaceId: space.id,
  }, {
    name: `/${eventFirestorePath(space.id)}/event-descriptor`,
    aroundTests: (_: UserContext) => ({
      beforeEach: [],
      afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/${eventFirestorePath(space.id)}/event-descriptor/self`, userContext,
        {
          get: true,
          list: false, write: false
        })
    },
    spaceId: space.id,
  }, {
    name: `/${eventFirestorePath(space.id)}/talksStats`,
    aroundTests: (_: UserContext) => ({
      beforeEach: [],
      afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/${eventFirestorePath(space.id)}/talks/{talkId}`, userContext,
        {
          read: true, write: false
        })
    },
    spaceId: space.id,
  }, {
    name: `/${eventFirestorePath(space.id)}/talksStats-slowPaced`,
    aroundTests: (_: UserContext) => ({
      beforeEach: [],
      afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/${eventFirestorePath(space.id)}/talksStats-slowPaced/{talkId}`, userContext,
        {
          read: true, write: false
        })
    },
    spaceId: space.id,
  }, {
    name: `/${eventFirestorePath(space.id)}/talksStats-allInOne`,
    aroundTests: (_: UserContext) => ({
      beforeEach: [],
      afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/${eventFirestorePath(space.id)}/talksStats-allInOne/self`, userContext,
        {
          get: true,
          list: false, write: false
        })
    },
    spaceId: space.id,
  }, {
    name: `/${eventFirestorePath(space.id)}/roomsStats-allInOne`,
    aroundTests: (_: UserContext) => ({
      beforeEach: [],
      afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/${eventFirestorePath(space.id)}/roomsStats-allInOne/self`, userContext,
        {
          get: true,
          list: false, write: false
        })
    },
    spaceId: space.id,
  }, {
    name: `/${eventFirestorePath(space.id)}/organizer-space`,
    aroundTests: (_: UserContext) => ({
      beforeEach: [],
      afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/${eventFirestorePath(space.id)}/organizer-space/{secretSpaceId}`, userContext,
        {
          get: true,
          list: false, write: false
        })
    },
    spaceId: space.id,
  }, {
    name: `/${eventFirestorePath(space.id)}/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/ratings`,
    aroundTests: (_: UserContext) => ({
      beforeEach: [],
      afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/${eventFirestorePath(space.id)}/organizer-space/{secretSpaceId}/ratings/{ratingId}`, userContext,
        {
          read: false, write: false
        })
    },
    spaceId: space.id,
  }, {
    name: `/${eventFirestorePath(space.id)}/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/daily-ratings`,
    aroundTests: (_: UserContext) => ({
      beforeEach: [],
      afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/${eventFirestorePath(space.id)}/organizer-space/{secretSpaceId}/daily-ratings/{dayId}`, userContext,
        {
          read: false, write: false
        })
    },
    spaceId: space.id,
  }, {
    name: `/${eventFirestorePath(space.id)}/last-updates`,
    aroundTests: (_: UserContext) => ({
      beforeEach: [],
      afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/${eventFirestorePath(space.id)}/last-updates/self`, userContext,
        {
          get: true,
          list: false, write: false
        })
    },
    spaceId: space.id,
  }, {
    name: `/${eventFirestorePath(space.id)}/talks`,
    aroundTests: (_: UserContext) => ({
      beforeEach: [],
      afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/${eventFirestorePath(space.id)}/talks/{talkId}`, userContext,
        {
          read: true, write: false
        })
    },
    spaceId: space.id,
  }, {
    name: `/${eventFirestorePath(space.id)}/talks/{talkId}/feedbacks-access`,
    aroundTests: (_: UserContext) => ({
      beforeEach: [],
      afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/${eventFirestorePath(space.id)}/talks/{talkId}/feedbacks-access/{secretFeedbackAccessToken}`, userContext,
        {
          get: true,
          list: false, write: false
        })
    },
    spaceId: space.id,
  }, {
    name: `/${eventFirestorePath(space.id)}/talks/{talkId}/feedbacks-access/{secretFeedbackViewerToken}/feedbacks`,
    aroundTests: (_: UserContext) => ({
      beforeEach: [],
      afterEach: [],
    }),
    tests: (userContext: UserContext) => {
      ensureCollectionFollowAccessPermissions(`/${eventFirestorePath(space.id)}/talks/{talkId}/feedbacks-access/{secretFeedbackAccessToken}/feedbacks/{userPublicToken}`, userContext,
        {
          read: true, write: false
        })
    },
    spaceId: space.id,
  }] as const),
];

COLLECTIONS.forEach(collectionContext => {
    USER_CONTEXTS.forEach((userContext) => {
        describe(`${collectionContext.name} collection - as ${userContext.name}${collectionContext.spaceId?` (space: ${collectionContext.spaceId})`:''}`, () => {
            beforeEach(async () => await Promise.all(collectionContext.aroundTests(userContext).beforeEach))
            afterEach(async () => await Promise.all(collectionContext.aroundTests(userContext).afterEach))

            collectionContext.tests(userContext);
        })
    })
});
