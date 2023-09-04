import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment, RulesTestContext,
    RulesTestEnvironment,
} from "@firebase/rules-unit-testing"
import {initializeApp as initializeAppAsAdmin} from "firebase-admin/app";
import {getFirestore as getFirestoreAsAdmin} from "firebase-admin/firestore";
import {User} from '../../shared/user.firestore'
import * as fs from "fs";
import { setDoc, doc, collection, getDocs, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import {ISODatetime} from "../../shared/type-utils";
import {match} from "ts-pattern";


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

beforeAll(async () => {
    await Promise.all([
        adminFirestore.doc('/users/alice').set({ username: 'alice' }),
        adminFirestore.doc('/users/alice/tokens-wallet/self').set({ publicUserToken: '00d8b3b4-ec51-4694-865c-5e9d0f542e41' }),
        adminFirestore.doc('/users/alice/preferences/self').set({ pinnedEventIds: [] }),
        adminFirestore.doc('/users/alice/events/an-event').set({}),
        adminFirestore.doc('/users/alice/events/an-event/__computed/self').set({ favoritedTalkIds: [] }),
        adminFirestore.doc('/users/alice/events/an-event/talksNotes/12345').set({ note: { isFavorite: true } }),
        adminFirestore.doc('/users/alice/events/an-event/days/monday').set({ }),
        adminFirestore.doc('/users/alice/events/an-event/days/monday/feedbacks/self').set({ dayId: 'monday', feedbacks: [] }),

        adminFirestore.doc('/users/fred').set({ username: 'fred' }),
        adminFirestore.doc('/users/fred/tokens-wallet/self').set({ publicUserToken: 'c808ad21-af33-4e20-a6f8-89adc4d14d75' }),
        adminFirestore.doc('/users/fred/preferences/self').set({ pinnedEventIds: [] }),
        adminFirestore.doc('/users/fred/events/an-event').set({}),
        adminFirestore.doc('/users/fred/events/an-event/__computed/self').set({ favoritedTalkIds: [] }),
        adminFirestore.doc('/users/fred/events/an-event/talksNotes/12345').set({ note: { isFavorite: true } }),
        adminFirestore.doc('/users/fred/events/an-event/days/monday').set({ }),
        adminFirestore.doc('/users/fred/events/an-event/days/monday/feedbacks/self').set({ dayId: 'monday', feedbacks: [] }),

        adminFirestore.doc('/event-family-tokens/a-family').set({ families: ['devoxx'], token: 'd54411a2-4ceb-4c3f-a014-41e9426235ed' }),
        adminFirestore.doc('/public-tokens/eventStats:devoxx-voxxed:a6f5d82a-353d-4e98-b86b-cfc3e7ebb5f2').set({ type: "FamilyEventsStatsAccess", eventFamilies: ["voxxed", "devoxx"] }),
        adminFirestore.doc('/crawlers/a-crawler').set({ crawlingKeys: [ '8bb30ecd-24f0-402b-9ff1-15d9826262dd' ], descriptorUrl: 'https://path-to-descriptor.json', kind: 'devoxx', stopAutoCrawlingAfter: '2023-09-01T00:00:00Z' }),
        adminFirestore.doc('/schema-migrations/self').set({ migrations: []}),

        adminFirestore.doc('/events/an-event').set({ title: `A super event` }),
        adminFirestore.doc('/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472').set({ organizerSecretToken: '6c902c52-9c6d-4d54-b6f2-20814d2f8472' }),
        adminFirestore.doc('/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/ratings/self').set({ }),
        adminFirestore.doc('/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/event-notification-subscriptions/self').set({
            talkNotifications: {
                pushNotificationsTriggered: [],
                userIdsForNextNotification: []
            }
        }),
        adminFirestore.doc('/events/an-event/days/monday').set({ day: 'monday', timeSlots: [] }),
        adminFirestore.doc('/events/an-event/event-descriptor/self').set({ title: `A super event` }),
        adminFirestore.doc('/events/an-event/talksStats/12345').set({ id: `12345`, totalFavoritesCount: 0 }),
        adminFirestore.doc('/events/an-event/last-updates/self').set({ favorites: '2023-09-01T00:00:00Z' }),
        adminFirestore.doc('/events/an-event/talks/1234').set({ id: '1234', title: 'A super talk' }),
        adminFirestore.doc('/events/an-event/talks/1234/feedbacks-access/1f0b405a-c3ba-46df-8d02-cce03bc34e5d').set({ }),
        adminFirestore.doc('/events/an-event/talks/1234/feedbacks-access/1f0b405a-c3ba-46df-8d02-cce03bc34e5d/feedbacks/de25005c-de05-48bd-9ae4-4768933eeeb0').set({ attendeePublicToken: 'de25005c-de05-48bd-9ae4-4768933eeeb0', talkId: '1234' }),

    ])
})
afterAll(async () => {
    await Promise.all([
        adminFirestore.doc(`/users/alice/events/an-event/days/monday/feedbacks/self`).delete(),
        adminFirestore.doc(`/users/alice/events/an-event/days/monday`).delete(),
        adminFirestore.doc(`/users/alice/events/an-event/talksNotes/12345`).delete(),
        adminFirestore.doc('/users/alice/events/an-event/__computed/self').delete(),
        adminFirestore.doc(`/users/alice/events/an-event`).delete(),
        adminFirestore.doc(`/users/alice/tokens-wallet/self`).delete(),
        adminFirestore.doc(`/users/alice/preferences/self`).delete(),
        adminFirestore.doc(`/users/alice`).delete(),

        adminFirestore.doc(`/users/fred/events/an-event/days/monday/feedbacks/self`).delete(),
        adminFirestore.doc(`/users/fred/events/an-event/days/monday`).delete(),
        adminFirestore.doc(`/users/fred/events/an-event/talksNotes/12345`).delete(),
        adminFirestore.doc('/users/fred/events/an-event/__computed/self').delete(),
        adminFirestore.doc(`/users/fred/events/an-event`).delete(),
        adminFirestore.doc(`/users/fred/tokens-wallet/self`).delete(),
        adminFirestore.doc(`/users/fred/preferences/self`).delete(),
        adminFirestore.doc(`/users/fred`).delete(),

        adminFirestore.doc('/public-tokens/eventStats:devoxx-voxxed:a6f5d82a-353d-4e98-b86b-cfc3e7ebb5f2').delete(),
        adminFirestore.doc(`/event-family-tokens/a-family`).delete(),
        adminFirestore.doc(`/crawlers/a-crawler`).delete(),
        adminFirestore.doc(`/schema-migrations/self`).delete(),

        adminFirestore.doc(`/events/an-event/talks/1234/feedbacks-access/1f0b405a-c3ba-46df-8d02-cce03bc34e5d/feedbacks/de25005c-de05-48bd-9ae4-4768933eeeb0`).delete(),
        adminFirestore.doc(`/events/an-event/talks/1234/feedbacks-access/1f0b405a-c3ba-46df-8d02-cce03bc34e5d`).delete(),
        adminFirestore.doc(`/events/an-event/talks/1234`).delete(),
        adminFirestore.doc(`/events/an-event/last-updates/self`).delete(),
        adminFirestore.doc(`/events/an-event/talksStats/12345`).delete(),
        adminFirestore.doc(`/events/an-event/event-descriptor/self`).delete(),
        adminFirestore.doc(`/events/an-event/days/monday`).delete(),
        adminFirestore.doc(`/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/ratings/self`).delete(),
        adminFirestore.doc(`/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472`).delete(),
        adminFirestore.doc(`/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/event-notification-subscriptions/self`).delete(),
        adminFirestore.doc(`/events/an-event`).delete(),
    ]);
})

const USER_CONTEXTS = [
    { name: "unauthenticated user", context: () => testEnv.unauthenticatedContext() },
    { name: "fred user", context: () => testEnv.authenticatedContext('fred') },
] as const;

type UserContext = typeof USER_CONTEXTS[number];

type CollectionDescriptor = {
    name: string,
    aroundTests: (userContext: UserContext) => {
        beforeEach: Array<Promise<any>>,
        afterEach: Array<Promise<any>>,
    },
    tests: (userContext: UserContext) => void
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
        it(`As ${userContext.name}, I should not be able to LIST user ids`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/users')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE a new user`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/users/bob'), { username: 'bob' }));
        })
        it(`As ${userContext.name}, I should not be able to GET another user's info`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/users/alice')));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE another user's info`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/alice'), { userLastConnection: new Date().toISOString() }))
        })
        it(`As ${userContext.name}, I should not be able to DELETE another user's info`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/alice')))
        })

        if(userContext.name === 'fred user') {
            it(`As ${userContext.name}, I shoud be able to GET my user's info`, async () => {
                await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/users/fred')));
            })
            it(`As ${userContext.name}, I should be able to only UPDATE userLastConnection field in my user's infos`, async () => {
                await assertSucceeds(updateDoc(doc(userContext.context().firestore(), '/users/fred'), { userLastConnection: new Date().toISOString() }))
            })
            it(`As ${userContext.name}, I should not be able to UPDATE any other fields than userLastConnection on my user's infos`, async () => {
                await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/fred'), { username: 'updated username' }))
            })
            it(`As ${userContext.name}, I should not be able to DELETE my user's info`, async () => {
                await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/fred')))
            })
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
        it(`As ${userContext.name}, I should not be able to LIST another user tokens wallets`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/users/alice/tokens-wallet')));
        })
        it(`As ${userContext.name}, I should not be able to GET another user tokens wallet`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/users/alice/tokens-wallet/self')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE another user's tokens wallet`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/users/alice/tokens-wallet/self'), { publicUserToken: '9b305d5c-e576-4b50-ae95-0e7164d3bea4' }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE another user's tokens wallet`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/alice/tokens-wallet/self'), { publicUserToken: '9b305d5c-e576-4b50-ae95-0e7164d3bea4' }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE another user's tokens wallet`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/alice/tokens-wallet/self')));
        })

        if(userContext.name === 'fred user') {
            it(`As ${userContext.name}, I shoud not be able to LIST my user's tokens wallets`, async () => {
                await assertFails(getDocs(collection(userContext.context().firestore(), '/users/fred/tokens-wallet')));
            })
            it(`As ${userContext.name}, I shoud be able to GET my user's tokens wallet`, async () => {
                await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/users/fred/tokens-wallet/self')));
            })
            it(`As ${userContext.name}, I shoud be able to CREATE my user's tokens wallet`, async () => {
                await assertSucceeds(setDoc(doc(userContext.context().firestore(), '/users/fred/tokens-wallet/self'), { publicUserToken: '9b305d5c-e576-4b50-ae95-0e7164d3bea4' }));
            })
            it(`As ${userContext.name}, I should be able to UPDATE my user's tokens wallet`, async () => {
                await assertSucceeds(updateDoc(doc(userContext.context().firestore(), '/users/fred/tokens-wallet/self'), { publicUserToken: '9b305d5c-e576-4b50-ae95-0e7164d3bea4' }))
            })
            it(`As ${userContext.name}, I should not be able to DELETE my user's tokens wallet`, async () => {
                await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/fred/tokens-wallet/self')));
            })
        }
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
        it(`As ${userContext.name}, I should not be able to LIST another user preferences`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/users/alice/preferences')));
        })
        it(`As ${userContext.name}, I should not be able to GET another user preferences`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/users/alice/preferences/self')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE another user's preferences`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/users/alice/preferences/self'), { pinnedEventIds: ['1234'] }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE another user's preferences`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/alice/preferences/self'), { pinnedEventIds: ['1234'] }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE another user's preferences`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/alice/preferences/self')));
        })

        if(userContext.name === 'fred user') {
            it(`As ${userContext.name}, I shoud not be able to LIST my user's preferences`, async () => {
                await assertFails(getDocs(collection(userContext.context().firestore(), '/users/fred/preferences')));
            })
            it(`As ${userContext.name}, I shoud be able to GET my user's preferences`, async () => {
                await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/users/fred/preferences/self')));
            })
            it(`As ${userContext.name}, I shoud be able to CREATE my user's preferences`, async () => {
                await assertSucceeds(setDoc(doc(userContext.context().firestore(), '/users/fred/preferences/self'), { pinnedEventIds: ['1234'] }));
            })
            it(`As ${userContext.name}, I should be able to UPDATE my user's preferences`, async () => {
                await assertSucceeds(updateDoc(doc(userContext.context().firestore(), '/users/fred/preferences/self'), { pinnedEventIds: ['1234'] }))
            })
            it(`As ${userContext.name}, I should not be able to DELETE my user's preferences`, async () => {
                await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/fred/preferences/self')));
            })
        }
    }
}, {
    name: "/users/{userId}/events",
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
        it(`As ${userContext.name}, I should not be able to LIST another user events`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/users/alice/events')));
        })
        it(`As ${userContext.name}, I should not be able to GET another user events`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE another user's events`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/users/alice/events/another-event'), { }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE another user's events`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event'), { }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE another user's events`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event')));
        })

        if(userContext.name === 'fred user') {
            it(`As ${userContext.name}, I shoud be able to LIST my user's events`, async () => {
                await assertSucceeds(getDocs(collection(userContext.context().firestore(), '/users/fred/events')));
            })
            it(`As ${userContext.name}, I shoud be able to GET my user's events`, async () => {
                await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event')));
            })
            it(`As ${userContext.name}, I shoud be able to CREATE my user's events`, async () => {
                await assertSucceeds(setDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event'), { }));
            })
            it(`As ${userContext.name}, I should be able to UPDATE my user's events`, async () => {
                await assertSucceeds(updateDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event'), { }))
            })
            it(`As ${userContext.name}, I should not be able to DELETE my user's events`, async () => {
                await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event')));
            })
        }
    }
}, {
    name: "/users/{userId}/events/{eventId}/__computed",
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
        it(`As ${userContext.name}, I should not be able to LIST another user events' computed infos`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/users/alice/events/an-event/__computed')));
        })
        it(`As ${userContext.name}, I should be able to GET another user events' computed infos`, async () => {
            await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event/__computed/self')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE another user's events' computed infos`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event/__computed/self'), { favoritedTalkIds: [] }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE another user's events' computed infos`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event/__computed/self'), { favoritedTalkIds: ['1'] }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE another user's events' computed infos`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event/__computed/self')));
        })

        if(userContext.name === 'fred user') {
            it(`As ${userContext.name}, I shoud not be able to LIST my user's events' computed infos`, async () => {
                await assertFails(getDocs(collection(userContext.context().firestore(), '/users/fred/events/an-event/__computed')));
            })
            it(`As ${userContext.name}, I shoud be able to GET my user's events' computed infos`, async () => {
                await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event/__computed/self')));
            })
            it(`As ${userContext.name}, I shoud not be able to CREATE my user's events' computed infos`, async () => {
                await assertFails(setDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event/__computed/self'), { favoritedTalkIds: [] }));
            })
            it(`As ${userContext.name}, I should not be able to UPDATE my user's events' computed infos`, async () => {
                await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event/__computed/self'), { favoritedTalkIds: ['1'] }))
            })
            it(`As ${userContext.name}, I should not be able to DELETE my user's events' computed infos`, async () => {
                await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event/__computed/self')));
            })
        }
    }
}, {
    name: "/users/{userId}/events/{eventId}/talksNotes",
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
        it(`As ${userContext.name}, I should not be able to LIST another user events' talk notes`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/users/alice/events/an-event/talksNotes')));
        })
        it(`As ${userContext.name}, I should not be able to GET another user events' talk notes`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event/talksNotes/12345')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE another user's events' talk notes`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event/talksNotes/12345'), { note: { isFavorite: true } }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE another user's events' talk notes`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event/talksNotes/12345'), { note: { isFavorite: false } }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE another user's events' talk notes`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event/talksNotes/12345')));
        })

        if(userContext.name === 'fred user') {
            it(`As ${userContext.name}, I shoud be able to LIST my user's events' talk notes`, async () => {
                await assertSucceeds(getDocs(collection(userContext.context().firestore(), '/users/fred/events/an-event/talksNotes')));
            })
            it(`As ${userContext.name}, I shoud be able to GET my user's events' talk notes`, async () => {
                await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event/talksNotes/12345')));
            })
            it(`As ${userContext.name}, I shoud not be able to CREATE my user's events' talk notes`, async () => {
                await assertSucceeds(setDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event/talksNotes/12345'), { note: { isFavorite: true } }));
            })
            it(`As ${userContext.name}, I should not be able to UPDATE my user's events' talk notes`, async () => {
                await assertSucceeds(updateDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event/talksNotes/12345'), { note: { isFavorite: false } }))
            })
            it(`As ${userContext.name}, I should not be able to DELETE my user's events' talk notes`, async () => {
                await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event/talksNotes/12345')));
            })
        }
    }
}, {
    name: "/users/{userId}/events/{eventId}/days",
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
        it(`As ${userContext.name}, I should not be able to LIST another user events' days`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/users/alice/events/an-event/days')));
        })
        it(`As ${userContext.name}, I should not be able to GET another user events' days`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event/days/monday')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE another user's events' days`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event/days/monday'), { }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE another user's events' days`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event/days/monday'), { }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE another user's events' days`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event/days/monday')));
        })

        if(userContext.name === 'fred user') {
            it(`As ${userContext.name}, I shoud be able to LIST my user's events' days`, async () => {
                await assertSucceeds(getDocs(collection(userContext.context().firestore(), '/users/fred/events/an-event/days')));
            })
            it(`As ${userContext.name}, I shoud be able to GET my user's events' days`, async () => {
                await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event/days/monday')));
            })
            it(`As ${userContext.name}, I shoud not be able to CREATE my user's events' days`, async () => {
                await assertSucceeds(setDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event/days/monday'), { }));
            })
            it(`As ${userContext.name}, I should not be able to UPDATE my user's events' days`, async () => {
                await assertSucceeds(updateDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event/days/monday'), { }))
            })
            it(`As ${userContext.name}, I should not be able to DELETE my user's events' days`, async () => {
                await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event/days/monday')));
            })
        }
    }
}, {
    name: "/users/{userId}/events/{eventId}/days/{dayId}/feedbacks",
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
        it(`As ${userContext.name}, I should not be able to LIST another user events' daily feedbacks`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/users/alice/events/an-event/days/monday/feedbacks')));
        })
        it(`As ${userContext.name}, I should not be able to GET another user events' daily feedbacks`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event/days/monday/feedbacks/self')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE another user's events' daily feedbacks`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event/days/monday/feedbacks/self'), { dayId: 'monday', feedbacks: [] }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE another user's events' daily feedbacks`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event/days/monday/feedbacks/self'), { dayId: 'monday', feedbacks: [] }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE another user's events' daily feedbacks`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/alice/events/an-event/days/monday/feedbacks/self')));
        })

        if(userContext.name === 'fred user') {
            it(`As ${userContext.name}, I shoud be able to LIST my user's events' daily feedbacks`, async () => {
                await assertFails(getDocs(collection(userContext.context().firestore(), '/users/fred/events/an-event/days/monday/feedbacks')));
            })
            it(`As ${userContext.name}, I shoud be able to GET my user's events' daily feedbacks`, async () => {
                await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event/days/monday/feedbacks/self')));
            })
            it(`As ${userContext.name}, I shoud not be able to CREATE my user's events' daily feedbacks`, async () => {
                await assertSucceeds(setDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event/days/monday/feedbacks/self'), { dayId: 'monday', feedbacks: [] }));
            })
            it(`As ${userContext.name}, I should not be able to UPDATE my user's events' daily feedbacks`, async () => {
                await assertSucceeds(updateDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event/days/monday/feedbacks/self'), { dayId: 'monday', feedbacks: [] }))
            })
            it(`As ${userContext.name}, I should not be able to DELETE my user's events' daily feedbacks`, async () => {
                await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/fred/events/an-event/days/monday/feedbacks/self')));
            })
        }
    }
}, {
    name: "/event-family-tokens",
    aroundTests: (userContext: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should not be able to LIST event family tokens`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/event-family-tokens')));
        })
        it(`As ${userContext.name}, I should not be able to GET any event family token`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/event-family-tokens/a-family')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE event family token`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/event-family-tokens/another-family'), { families: ['devoxx', 'voxxed'], token: 'd54411a2-4ceb-4c3f-a014-41e9426235ed' }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE event family token`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/event-family-tokens/a-family'), { families: ['devoxx', 'voxxed'], token: 'd54411a2-4ceb-4c3f-a014-41e9426235ed' }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE event family token`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/event-family-tokens/a-family')));
        })
    }
}, {
    name: "/public-tokens",
    aroundTests: (userContext: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should not be able to LIST event family tokens`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/public-tokens')));
        })
        it(`As ${userContext.name}, I should be able to GET any event family token`, async () => {
            await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/public-tokens/eventStats:devoxx-voxxed:a6f5d82a-353d-4e98-b86b-cfc3e7ebb5f2')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE event family token`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/public-tokens/eventStats:devoxx-only:79c44f4e-6158-4c91-9b81-fafba6049e45'), { type: "FamilyEventsStatsAccess", eventFamilies: ["devoxx"]}));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE event family token`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/public-tokens/eventStats:devoxx-voxxed:a6f5d82a-353d-4e98-b86b-cfc3e7ebb5f2'), { type: "FamilyEventsStatsAccess", eventFamilies: ["voxxed"]}));
        })
        it(`As ${userContext.name}, I should not be able to DELETE event family token`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/public-tokens/eventStats:devoxx-voxxed:a6f5d82a-353d-4e98-b86b-cfc3e7ebb5f2')));
        })
    }
}, {
    name: "/crawlers",
    aroundTests: (userContext: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should not be able to LIST crawlers`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/crawlers')));
        })
        it(`As ${userContext.name}, I should not be able to GET any crawler`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/crawlers/a-crawler')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE crawler`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/crawlers/another-crawler'), { crawlingKeys: [ '8bb30ecd-24f0-402b-9ff1-15d9826262dd' ], descriptorUrl: 'https://path-to-descriptor.json', kind: 'devoxx', stopAutoCrawlingAfter: '2023-09-01T00:00:00Z' }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE crawler`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/crawlers/a-crawler'), { crawlingKeys: [ '8bb30ecd-24f0-402b-9ff1-15d9826262dd' ], descriptorUrl: 'https://path-to-descriptor.json', kind: 'devoxx', stopAutoCrawlingAfter: '2023-10-01T00:00:00Z' }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE crawler`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/crawlers/a-crawler')));
        })
    }
}, {
    name: "/schema-migrations",
    aroundTests: (userContext: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should not be able to LIST schema migrations`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/schema-migrations')));
        })
        it(`As ${userContext.name}, I should not be able to GET any schema migrations`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/schema-migrations/self')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE schema migration`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/schema-migrations/another-migration'), { migrations: []}));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE schema migration`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/schema-migrations/self'), { migrations: [] }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE schema migration`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/schema-migrations/self')));
        })
    }
}, {
    name: "/events",
    aroundTests: (userContext: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should be able to LIST events`, async () => {
            await assertSucceeds(getDocs(collection(userContext.context().firestore(), '/events')));
        })
        it(`As ${userContext.name}, I should be able to GET events`, async () => {
            await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/events/an-event')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE event`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/events/another-event'), { title: `Another super event` }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE event`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/events/an-event'), { title: `A super updated event` }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE event`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/events/an-event')));
        })
    }
}, {
    name: "/events/{eventId}/days",
    aroundTests: (userContext: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should be able to LIST events' days`, async () => {
            await assertSucceeds(getDocs(collection(userContext.context().firestore(), '/events/an-event/days')));
        })
        it(`As ${userContext.name}, I should be able to GET events' days`, async () => {
            await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/events/an-event/days/monday')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE events' days`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/events/an-event/days/tuesday'), { day: 'tuesday', timeSlots: [] }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE events' days`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/events/an-event/days/monday'), { day: 'monday', timeSlots: [] }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE events' days`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/events/an-event/days/monday')));
        })
    }
}, {
    name: "/events/{eventId}/event-descriptor",
    aroundTests: (userContext: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should not be able to LIST events' event descriptor`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/events/an-event/event-descriptor')));
        })
        it(`As ${userContext.name}, I should be able to GET events' event descriptor`, async () => {
            await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/events/an-event/event-descriptor/self')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE events' event descriptor`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/events/another-event/event-descriptor/self'), { title: `Another super event` }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE events' event descriptor`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/events/an-event/event-descriptor/self'), { title: `A super updated event` }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE events' event descriptor`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/events/an-event/event-descriptor/self')));
        })
    }
}, {
    name: "/events/{eventId}/talksStats",
    aroundTests: (userContext: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should be able to LIST events' talks stats`, async () => {
            await assertSucceeds(getDocs(collection(userContext.context().firestore(), '/events/an-event/talksStats')));
        })
        it(`As ${userContext.name}, I should be able to GET events' talks stats`, async () => {
            await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/events/an-event/talksStats/12345')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE events' talks stats`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/events/another-event/talksStats/23456'), { id: `23456`, totalFavoritesCount: 0 }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE events' talks stats`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/events/an-event/talksStats/12345'), { id: `12345`, totalFavoritesCount: 1 }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE events' talks stats`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/events/an-event/talksStats/12345')));
        })
    }
}, {
    name: "/events/{eventId}/organizer-space",
    aroundTests: (userContext: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should not be able to LIST events' organizer spaces`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/events/an-event/organizer-space')));
        })
        it(`As ${userContext.name}, I should be able to GET events' organizer space by its token`, async () => {
            await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE events' organizer space`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/events/another-event/organizer-space/d05d6d61-53c4-496c-9269-795a30b70443'), { organizerSecretToken: `d05d6d61-53c4-496c-9269-795a30b70443`, talkFeedbackViewerTokens: [] }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE events' organizer space`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472'), { organizerSecretToken: `6c902c52-9c6d-4d54-b6f2-20814d2f8472`, talkFeedbackViewerTokens: [] }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE events' organizer space`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472')));
        })
    }
}, {
    name: "/events/{eventId}/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/ratings",
    aroundTests: (userContext: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should not be able to LIST events' organizer space ratings`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/ratings')));
        })
        it(`As ${userContext.name}, I should not be able to GET events' organizer space ratings`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/ratings/self')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE events' organizer space ratings`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/events/another-event/organizer-space/d05d6d61-53c4-496c-9269-795a30b70443/ratings/self'), { }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE events' organizer space ratings`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/ratings/self'), { "12345": {} }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE events' organizer space ratings`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/ratings/self')));
        })
    }
}, {
    name: "/events/{eventId}/organizer-space/{secretOrganizerToken}/event-notification-subscriptions",
    aroundTests: (userContext: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should not be able to LIST events' notification subscriptions`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/event-notification-subscriptions')));
        })
        it(`As ${userContext.name}, I should be able to GET events' notification subscriptions`, async () => {
            await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/event-notification-subscriptions/self')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE events' notification subscriptions`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/events/another-event/organizer-space/d05d6d61-53c4-496c-9269-795a30b70443/event-notification-subscriptions/self'), {
                talkNotifications: {
                    pushNotificationsTriggered: [],
                    userIdsForNextNotification: []
                }
            }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE events' notification subscriptions`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/event-notification-subscriptions/self'), {
                talkNotifications: {
                    pushNotificationsTriggered: [],
                    userIdsForNextNotification: []
                }
            }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE events' notification subscriptions`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/events/an-event/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472/event-notification-subscriptions/self')));
        })
    }
}, {
    name: "/events/{eventId}/last-updates",
    aroundTests: (userContext: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should not be able to LIST events' organizer spaces`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/events/an-event/last-updates')));
        })
        it(`As ${userContext.name}, I should be able to GET events' organizer space by its token`, async () => {
            await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/events/an-event/last-updates/self')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE events' organizer space`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/events/another-event/last-updates/self'), { favorites: '2023-09-01T00:00:00Z' }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE events' organizer space`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/events/an-event/last-updates/self'), { favorites: '2023-09-05T00:00:00Z' }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE events' organizer space`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/events/an-event/last-updates/self')));
        })
    }
}, {
    name: "/events/{eventId}/talks",
    aroundTests: (userContext: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should be able to LIST events' talks`, async () => {
            await assertSucceeds(getDocs(collection(userContext.context().firestore(), '/events/an-event/talks')));
        })
        it(`As ${userContext.name}, I should be able to GET events' talks`, async () => {
            await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/events/an-event/talks/1234')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE events' talks`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/events/an-event/talks/2345'), {  id: '2345', title: 'Another super talk' }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE events' talks`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/events/an-event/talks/1234'), {  id: '1234', title: 'A super updated talk' }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE events' talks`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/events/an-event/talks/1234')));
        })
    }
}, {
    name: "/events/{eventId}/talks/{talkId}/feedbacks-access",
    aroundTests: (userContext: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should not be able to LIST events' talks feedbacks access`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/events/an-event/talks/1234/feedbacks-access')));
        })
        it(`As ${userContext.name}, I should be able to GET events' talks feedbacks access`, async () => {
            await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/events/an-event/talks/1234/feedbacks-access/1f0b405a-c3ba-46df-8d02-cce03bc34e5d')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE events' talks feedbacks access`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/events/an-event/talks/2345/feedbacks-access/9f8b0440-8819-48eb-9974-87b69049f132'), { }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE events' talks feedbacks access`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/events/an-event/talks/1234/feedbacks-access/1f0b405a-c3ba-46df-8d02-cce03bc34e5d'), { }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE events' talks feedbacks access`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/events/an-event/talks/1234/feedbacks-access/1f0b405a-c3ba-46df-8d02-cce03bc34e5d')));
        })
    }
}, {
    name: "/events/{eventId}/talks/{talkId}/feedbacks-access/{secretFeedbackViewerToken}/feedbacks",
    aroundTests: (userContext: UserContext) => ({
        beforeEach: [],
        afterEach: [],
    }),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should be able to LIST events' talks feedbacks`, async () => {
            await assertSucceeds(getDocs(collection(userContext.context().firestore(), '/events/an-event/talks/1234/feedbacks-access/1f0b405a-c3ba-46df-8d02-cce03bc34e5d/feedbacks')));
        })
        it(`As ${userContext.name}, I should be able to GET events' talks feedbacks`, async () => {
            await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/events/an-event/talks/1234/feedbacks-access/1f0b405a-c3ba-46df-8d02-cce03bc34e5d/feedbacks/de25005c-de05-48bd-9ae4-4768933eeeb0')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE events' talks feedbacks`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/events/an-event/talks/2345/feedbacks-access/9f8b0440-8819-48eb-9974-87b69049f132/feedbacks/8bf30db6-cb2a-461b-82be-45baf307fd8f'), { attendeePublicToken: '8bf30db6-cb2a-461b-82be-45baf307fd8f', talkId: '2345' }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE events' talks feedbacks`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/events/an-event/talks/1234/feedbacks-access/1f0b405a-c3ba-46df-8d02-cce03bc34e5d/feedbacks/de25005c-de05-48bd-9ae4-4768933eeeb0'), { attendeePublicToken: 'de25005c-de05-48bd-9ae4-4768933eeeb0', talkId: '1234' }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE events' talks feedbacks`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/events/an-event/talks/1234/feedbacks-access/1f0b405a-c3ba-46df-8d02-cce03bc34e5d/feedbacks/de25005c-de05-48bd-9ae4-4768933eeeb0')));
        })
    }
}];

COLLECTIONS.forEach(collectionContext => {
    USER_CONTEXTS.forEach((userContext) => {
        describe(`${collectionContext.name} collection - as ${userContext.name}`, () => {
            beforeEach(async () => await Promise.all(collectionContext.aroundTests(userContext).beforeEach))
            afterEach(async () => await Promise.all(collectionContext.aroundTests(userContext).afterEach))

            collectionContext.tests(userContext);
        })
    })
});
