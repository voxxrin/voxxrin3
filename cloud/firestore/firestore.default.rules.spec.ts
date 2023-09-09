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
