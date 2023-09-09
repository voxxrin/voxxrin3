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
            beforeEach: [
                adminFirestore.doc('/users/alice').set({ username: 'alice' })
            ],
            afterEach: [
                adminFirestore.doc(`/users/alice`).delete()
            ]
        }))
        .with({ name: "fred user" },  () => ({
            beforeEach: [
                adminFirestore.doc('/users/alice').set({ username: 'alice' }),
                adminFirestore.doc('/users/fred').set({ username: 'fred' })
            ],
            afterEach: [
                adminFirestore.doc(`/users/alice`).delete(),
                adminFirestore.doc(`/users/fred`).delete()
            ]
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
            beforeEach: [
                adminFirestore.doc('/users/alice/tokens-wallet/self').set({ publicUserToken: '00d8b3b4-ec51-4694-865c-5e9d0f542e41' }),
            ],
            afterEach: [
                adminFirestore.doc(`/users/alice/tokens-wallet/self`).delete(),
            ]
        }))
        .with({ name: "fred user" },  () => ({
            beforeEach: [
                adminFirestore.doc('/users/alice/tokens-wallet/self').set({ publicUserToken: '00d8b3b4-ec51-4694-865c-5e9d0f542e41' }),
                adminFirestore.doc('/users/fred/tokens-wallet/self').set({ publicUserToken: 'c808ad21-af33-4e20-a6f8-89adc4d14d75' }),
            ],
            afterEach: [
                adminFirestore.doc(`/users/alice/tokens-wallet/self`).delete(),
                adminFirestore.doc(`/users/fred/tokens-wallet/self`).delete(),
            ]
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
            beforeEach: [
                adminFirestore.doc('/users/alice/preferences/self').set({ pinnedEventIds: [], showPastEvents: false }),
            ],
            afterEach: [
                adminFirestore.doc(`/users/alice/preferences/self`).delete(),
            ]
        }))
        .with({ name: "fred user" },  () => ({
            beforeEach: [
                adminFirestore.doc('/users/alice/preferences/self').set({ pinnedEventIds: [], showPastEvents: false }),
                adminFirestore.doc('/users/fred/preferences/self').set({ pinnedEventIds: [], showPastEvents: false }),
            ],
            afterEach: [
                adminFirestore.doc(`/users/alice/preferences/self`).delete(),
                adminFirestore.doc(`/users/fred/preferences/self`).delete(),
            ]
        })).run(),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should not be able to LIST another user preferences`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/users/alice/preferences')));
        })
        it(`As ${userContext.name}, I should not be able to GET another user preferences`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/users/alice/preferences/self')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE another user's preferences`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/users/alice/preferences/self'), { showPastEvents: true }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE another user's preferences`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/alice/preferences/self'), { showPastEvents: true }));
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
                await assertSucceeds(setDoc(doc(userContext.context().firestore(), '/users/fred/preferences/self'), { showPastEvents: true }));
            })
            it(`As ${userContext.name}, I should be able to UPDATE my user's preferences`, async () => {
                await assertSucceeds(updateDoc(doc(userContext.context().firestore(), '/users/fred/preferences/self'), { showPastEvents: true }))
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
            beforeEach: [
                adminFirestore.doc('/users/alice/events/dvbe23').set({}),
            ],
            afterEach: [
                adminFirestore.doc(`/users/alice/events/dvbe23`).delete(),
            ]
        }))
        .with({ name: "fred user" },  () => ({
            beforeEach: [
                adminFirestore.doc('/users/alice/events/dvbe23').set({}),
                adminFirestore.doc('/users/fred/events/dvbe23').set({}),
            ],
            afterEach: [
                adminFirestore.doc(`/users/alice/events/dvbe23`).delete(),
                adminFirestore.doc(`/users/fred/events/dvbe23`).delete(),
            ]
        })).run(),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should not be able to LIST another user events`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/users/alice/events')));
        })
        it(`As ${userContext.name}, I should not be able to GET another user events`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE another user's events`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/users/alice/events/jsc23'), { }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE another user's events`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23'), { }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE another user's events`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23')));
        })

        if(userContext.name === 'fred user') {
            it(`As ${userContext.name}, I shoud be able to LIST my user's events`, async () => {
                await assertSucceeds(getDocs(collection(userContext.context().firestore(), '/users/fred/events')));
            })
            it(`As ${userContext.name}, I shoud be able to GET my user's events`, async () => {
                await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23')));
            })
            it(`As ${userContext.name}, I shoud be able to CREATE my user's events`, async () => {
                await assertSucceeds(setDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23'), { }));
            })
            it(`As ${userContext.name}, I should be able to UPDATE my user's events`, async () => {
                await assertSucceeds(updateDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23'), { }))
            })
            it(`As ${userContext.name}, I should not be able to DELETE my user's events`, async () => {
                await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23')));
            })
        }
    }
}, {
    name: "/users/{userId}/events/{eventId}/__computed",
    aroundTests: (userContext: UserContext) => match(userContext)
        .with({ name: "unauthenticated user" },  () => ({
            beforeEach: [
                adminFirestore.doc('/users/alice/events/dvbe23/__computed/self').set({ favoritedTalkIds: [] }),
            ],
            afterEach: [
                adminFirestore.doc(`/users/alice/events/dvbe23/__computed/self`).delete(),
            ]
        }))
        .with({ name: "fred user" },  () => ({
            beforeEach: [
                adminFirestore.doc('/users/alice/events/dvbe23/__computed/self').set({ favoritedTalkIds: [] }),
                adminFirestore.doc('/users/fred/events/dvbe23/__computed/self').set({ favoritedTalkIds: [] }),
            ],
            afterEach: [
                adminFirestore.doc(`/users/alice/events/dvbe23`).delete(),
                adminFirestore.doc(`/users/fred/events/dvbe23`).delete(),
            ]
        })).run(),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should not be able to LIST another user events' computed infos`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/users/alice/events/dvbe23/__computed')));
        })
        it(`As ${userContext.name}, I should not be able to GET another user events' computed infos`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23/__computed/self')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE another user's events' computed infos`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23/__computed/self'), { favoritedTalkIds: [] }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE another user's events' computed infos`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23/__computed/self'), { favoritedTalkIds: ['1'] }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE another user's events' computed infos`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23/__computed/self')));
        })

        if(userContext.name === 'fred user') {
            it(`As ${userContext.name}, I shoud not be able to LIST my user's events' computed infos`, async () => {
                await assertFails(getDocs(collection(userContext.context().firestore(), '/users/fred/events/dvbe23/__computed')));
            })
            it(`As ${userContext.name}, I shoud not be able to GET my user's events' computed infos`, async () => {
                await assertFails(getDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23/__computed/self')));
            })
            it(`As ${userContext.name}, I shoud not be able to CREATE my user's events' computed infos`, async () => {
                await assertFails(setDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23/__computed/self'), { favoritedTalkIds: [] }));
            })
            it(`As ${userContext.name}, I should not be able to UPDATE my user's events' computed infos`, async () => {
                await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23/__computed/self'), { favoritedTalkIds: ['1'] }))
            })
            it(`As ${userContext.name}, I should not be able to DELETE my user's events' computed infos`, async () => {
                await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23/__computed/self')));
            })
        }
    }
}, {
    name: "/users/{userId}/events/{eventId}/talkNotes",
    aroundTests: (userContext: UserContext) => match(userContext)
        .with({ name: "unauthenticated user" },  () => ({
            beforeEach: [
                adminFirestore.doc('/users/alice/events/dvbe23/talkNotes/12345').set({ note: { isFavorite: true } }),
            ],
            afterEach: [
                adminFirestore.doc(`/users/alice/events/dvbe23/talkNotes/12345`).delete(),
            ]
        }))
        .with({ name: "fred user" },  () => ({
            beforeEach: [
                adminFirestore.doc('/users/alice/events/dvbe23/talkNotes/12345').set({ note: { isFavorite: true } }),
                adminFirestore.doc('/users/fred/events/dvbe23/talkNotes/12345').set({ note: { isFavorite: true } }),
            ],
            afterEach: [
                adminFirestore.doc(`/users/alice/events/dvbe23/talkNotes/12345`).delete(),
                adminFirestore.doc(`/users/fred/events/dvbe23/talkNotes/12345`).delete(),
            ]
        })).run(),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should not be able to LIST another user events' talk notes`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/users/alice/events/dvbe23/talkNotes')));
        })
        it(`As ${userContext.name}, I should not be able to GET another user events' talk notes`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23/talkNotes/12345')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE another user's events' talk notes`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23/talkNotes/12345'), { note: { isFavorite: true } }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE another user's events' talk notes`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23/talkNotes/12345'), { note: { isFavorite: false } }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE another user's events' talk notes`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23/talkNotes/12345')));
        })

        if(userContext.name === 'fred user') {
            it(`As ${userContext.name}, I shoud be able to LIST my user's events' talk notes`, async () => {
                await assertSucceeds(getDocs(collection(userContext.context().firestore(), '/users/fred/events/dvbe23/talkNotes')));
            })
            it(`As ${userContext.name}, I shoud be able to GET my user's events' talk notes`, async () => {
                await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23/talkNotes/12345')));
            })
            it(`As ${userContext.name}, I shoud not be able to CREATE my user's events' talk notes`, async () => {
                await assertSucceeds(setDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23/talkNotes/12345'), { note: { isFavorite: true } }));
            })
            it(`As ${userContext.name}, I should not be able to UPDATE my user's events' talk notes`, async () => {
                await assertSucceeds(updateDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23/talkNotes/12345'), { note: { isFavorite: false } }))
            })
            it(`As ${userContext.name}, I should not be able to DELETE my user's events' talk notes`, async () => {
                await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23/talkNotes/12345')));
            })
        }
    }
}, {
    name: "/users/{userId}/events/{eventId}/days",
    aroundTests: (userContext: UserContext) => match(userContext)
        .with({ name: "unauthenticated user" },  () => ({
            beforeEach: [
                adminFirestore.doc('/users/alice/events/dvbe23/days/monday').set({ }),
            ],
            afterEach: [
                adminFirestore.doc(`/users/alice/events/dvbe23/days/monday`).delete(),
            ]
        }))
        .with({ name: "fred user" },  () => ({
            beforeEach: [
                adminFirestore.doc('/users/alice/events/dvbe23/days/monday').set({ }),
                adminFirestore.doc('/users/fred/events/dvbe23/days/monday').set({ }),
            ],
            afterEach: [
                adminFirestore.doc(`/users/alice/events/dvbe23/days/monday`).delete(),
                adminFirestore.doc(`/users/fred/events/dvbe23/days/monday`).delete(),
            ]
        })).run(),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should not be able to LIST another user events' days`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/users/alice/events/dvbe23/days')));
        })
        it(`As ${userContext.name}, I should not be able to GET another user events' days`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23/days/monday')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE another user's events' days`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23/days/monday'), { }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE another user's events' days`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23/days/monday'), { }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE another user's events' days`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23/days/monday')));
        })

        if(userContext.name === 'fred user') {
            it(`As ${userContext.name}, I shoud be able to LIST my user's events' days`, async () => {
                await assertSucceeds(getDocs(collection(userContext.context().firestore(), '/users/fred/events/dvbe23/days')));
            })
            it(`As ${userContext.name}, I shoud be able to GET my user's events' days`, async () => {
                await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23/days/monday')));
            })
            it(`As ${userContext.name}, I shoud not be able to CREATE my user's events' days`, async () => {
                await assertSucceeds(setDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23/days/monday'), { }));
            })
            it(`As ${userContext.name}, I should not be able to UPDATE my user's events' days`, async () => {
                await assertSucceeds(updateDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23/days/monday'), { }))
            })
            it(`As ${userContext.name}, I should not be able to DELETE my user's events' days`, async () => {
                await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23/days/monday')));
            })
        }
    }
}, {
    name: "/users/{userId}/events/{eventId}/days/{dayId}/feedbacks",
    aroundTests: (userContext: UserContext) => match(userContext)
        .with({ name: "unauthenticated user" },  () => ({
            beforeEach: [
                adminFirestore.doc('/events/dvbe23/organizer-space/eedef166-3180-4eed-86e6-73eb05f392b1').set({ organizerSecretToken: 'eedef166-3180-4eed-86e6-73eb05f392b1' }),
                adminFirestore.doc('/users/alice/events/dvbe23/days/monday/feedbacks/self').set({ dayId: 'monday', feedbacks: [] }),
            ],
            afterEach: [
                adminFirestore.doc(`/users/alice/events/dvbe23/days/monday/feedbacks/self`).delete(),
                adminFirestore.doc(`/events/dvbe23/organizer-space/eedef166-3180-4eed-86e6-73eb05f392b1`).delete(),
            ]
        }))
        .with({ name: "fred user" },  () => ({
            beforeEach: [
                adminFirestore.doc('/events/dvbe23/organizer-space/6c902c52-9c6d-4d54-b6f2-20814d2f8472').set({ organizerSecretToken: '6c902c52-9c6d-4d54-b6f2-20814d2f8472' }),
                adminFirestore.doc('/users/alice/events/dvbe23/days/monday/feedbacks/self').set({ dayId: 'monday', feedbacks: [] }),
                adminFirestore.doc('/users/fred/events/dvbe23/days/monday/feedbacks/self').set({ dayId: 'monday', feedbacks: [] }),
            ],
            afterEach: [
                adminFirestore.doc(`/users/alice/events/dvbe23/days/monday/feedbacks/self`).delete(),
                adminFirestore.doc(`/users/fred/events/dvbe23/days/monday/feedbacks/self`).delete(),
                adminFirestore.doc(`/events/dvbe23/organizer-space/eedef166-3180-4eed-86e6-73eb05f392b1`).delete(),
            ]
        })).run(),
    tests: (userContext: UserContext) => {
        it(`As ${userContext.name}, I should not be able to LIST another user events' daily feedbacks`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/users/alice/events/dvbe23/days/monday/feedbacks')));
        })
        it(`As ${userContext.name}, I should not be able to GET another user events' daily feedbacks`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23/days/monday/feedbacks/self')));
        })
        it(`As ${userContext.name}, I should not be able to CREATE another user's events' daily feedbacks`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23/days/monday/feedbacks/self'), { dayId: 'monday', feedbacks: [] }));
        })
        it(`As ${userContext.name}, I should not be able to UPDATE another user's events' daily feedbacks`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23/days/monday/feedbacks/self'), { dayId: 'monday', feedbacks: [] }));
        })
        it(`As ${userContext.name}, I should not be able to DELETE another user's events' daily feedbacks`, async () => {
            await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/alice/events/dvbe23/days/monday/feedbacks/self')));
        })

        if(userContext.name === 'fred user') {
            it(`As ${userContext.name}, I shoud be able to LIST my user's events' daily feedbacks`, async () => {
                await assertFails(getDocs(collection(userContext.context().firestore(), '/users/fred/events/dvbe23/days/monday/feedbacks')));
            })
            it(`As ${userContext.name}, I shoud be able to GET my user's events' daily feedbacks`, async () => {
                await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23/days/monday/feedbacks/self')));
            })
            it(`As ${userContext.name}, I shoud not be able to CREATE my user's events' daily feedbacks`, async () => {
                await assertSucceeds(setDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23/days/monday/feedbacks/self'), { dayId: 'monday', feedbacks: [] }));
            })
            it(`As ${userContext.name}, I should not be able to UPDATE my user's events' daily feedbacks`, async () => {
                await assertSucceeds(updateDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23/days/monday/feedbacks/self'), { dayId: 'monday', feedbacks: [] }))
            })
            it(`As ${userContext.name}, I should not be able to DELETE my user's events' daily feedbacks`, async () => {
                await assertFails(deleteDoc(doc(userContext.context().firestore(), '/users/fred/events/dvbe23/days/monday/feedbacks/self')));
            })
        }
    }
}, {
    name: "/event-family-tokens",
    aroundTests: (userContext: UserContext) => ({
        beforeEach: [
            adminFirestore.doc('/event-family-tokens/a-family').set({ families: ['devoxx'], token: 'd54411a2-4ceb-4c3f-a014-41e9426235ed' }),
        ],
        afterEach: [
            adminFirestore.doc(`/event-family-tokens/a-family`).delete(),
        ]
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
    name: "/crawlers",
    aroundTests: (userContext: UserContext) => ({
        beforeEach: [
            adminFirestore.doc('/crawlers/a-crawler').set({ crawlingKeys: [ '8bb30ecd-24f0-402b-9ff1-15d9826262dd' ], descriptorUrl: 'https://path-to-descriptor.json', kind: 'devoxx', stopAutoCrawlingAfter: '2023-09-01T00:00:00Z' }),
        ],
        afterEach: [
            adminFirestore.doc(`/crawlers/a-crawler`).delete(),
        ]
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
        beforeEach: [
            adminFirestore.doc('/schema-migrations/self').set({ migrations: []}),
        ],
        afterEach: [
            adminFirestore.doc(`/schema-migrations/self`).delete(),
        ]
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
