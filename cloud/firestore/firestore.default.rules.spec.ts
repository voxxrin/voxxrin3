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
import { setDoc, doc, collection, getDocs, getDoc, updateDoc } from "firebase/firestore";
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

[{
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
        it(`As ${userContext.name}, I shouldn't be able to list user ids`, async () => {
            await assertFails(getDocs(collection(userContext.context().firestore(), '/users')));
        })
        it(`As ${userContext.name}, I shouldn't be able to create a new user`, async () => {
            await assertFails(setDoc(doc(userContext.context().firestore(), '/users/bob'), { username: 'bob' }));
        })
        it(`As ${userContext.name}, I shouldn't be able to get another user's info`, async () => {
            await assertFails(getDoc(doc(userContext.context().firestore(), '/users/alice')));
        })
        it(`As ${userContext.name}, I shouldn't be able to update another user's info`, async () => {
            await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/alice'), { userLastConnection: new Date().toISOString() }))
        })

        if(userContext.name === 'fred user') {
            it(`As ${userContext.name}, I shoud be able to get my user's info`, async () => {
                await assertSucceeds(getDoc(doc(userContext.context().firestore(), '/users/fred')));
            })
            it(`As ${userContext.name}, I should be able to only update userLastConnection field in my user's infos`, async () => {
                await assertSucceeds(updateDoc(doc(userContext.context().firestore(), '/users/fred'), { userLastConnection: new Date().toISOString() }))
            })
            it(`As ${userContext.name}, I should not be able to update any other fields than userLastConnection on my user's infos`, async () => {
                await assertFails(updateDoc(doc(userContext.context().firestore(), '/users/fred'), { username: 'updated username' }))
            })
        }
    }
}].forEach(collectionContext => {
    USER_CONTEXTS.forEach((userContext) => {
        describe(`${collectionContext.name} collection - as ${userContext.name}`, () => {
            beforeEach(async () => await Promise.all(collectionContext.aroundTests(userContext).beforeEach))
            afterEach(async () => await Promise.all(collectionContext.aroundTests(userContext).afterEach))

            collectionContext.tests(userContext);
        })
    })
});
