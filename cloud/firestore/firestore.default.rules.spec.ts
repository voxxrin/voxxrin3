import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment,
    RulesTestEnvironment,
} from "@firebase/rules-unit-testing"
import {initializeApp as initializeAppAsAdmin} from "firebase-admin/app";
import {getFirestore as getFirestoreAsAdmin} from "firebase-admin/firestore";
import {User} from '../../shared/user.firestore'
import * as fs from "fs";
import { setDoc, doc, collection, getDocs, getDoc, updateDoc } from "firebase/firestore";
import {ISODatetime} from "../../shared/type-utils";


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

describe("/users collection - as unauthenticated user", () => {
    beforeEach(async () => {
        await adminFirestore.doc('/users/alice').set({
            username: 'alice'
        })
    })
    afterEach(async () => {
        await adminFirestore.doc(`/users/alice`).delete();
    })

    it(`As an unauthenticated users, I shouldn't be able to list user ids`, async () => {
        const unauthenticated = testEnv.unauthenticatedContext();
        await assertFails(getDocs(collection(unauthenticated.firestore(), '/users')));
    })
    it(`As an unauthenticated users, I shouldn't be able to create a new user`, async () => {
        const unauthenticated = testEnv.unauthenticatedContext();
        await assertFails(setDoc(doc(unauthenticated.firestore(), '/users/bob'), { username: 'bob' }));
    })
    it(`As an unauthenticated users, I shouldn't be able to get any user info`, async () => {
        const unauthenticated = testEnv.unauthenticatedContext();
        await assertFails(getDoc(doc(unauthenticated.firestore(), '/users/alice')));
    })
    it(`As an unauthenticated users, I shouldn't be able to update another user's info`, async () => {
        const unauthenticated = testEnv.unauthenticatedContext();
        await assertFails(updateDoc(doc(unauthenticated.firestore(), '/users/alice'), { userLastConnection: new Date().toISOString() }))
    })
})

describe("/users collection - as fred user", () => {
    beforeEach(async () => {
        await adminFirestore.doc('/users/alice').set({ username: 'alice' })
        await adminFirestore.doc('/users/fred').set({ username: 'fred' })
    })
    afterEach(async () => {
        await adminFirestore.doc(`/users/alice`).delete();
        await adminFirestore.doc(`/users/fred`).delete();
    })

    it(`As fred user, I shouldn't be able to list user ids`, async () => {
        const fred = testEnv.authenticatedContext('fred');
        await assertFails(getDocs(collection(fred.firestore(), '/users')));
    })
    it(`As fred user, I shouldn't be able to create a new user`, async () => {
        const fred = testEnv.authenticatedContext('fred');
        await assertFails(setDoc(doc(fred.firestore(), '/users/bob'), { username: 'bob' }));
    })
    it(`As fred user, I shouldn't be able to get another user's info`, async () => {
        const fred = testEnv.authenticatedContext('fred');
        await assertFails(getDoc(doc(fred.firestore(), '/users/alice')));
    })
    it(`As fred user, I shoud be able to get my user's info`, async () => {
        const fred = testEnv.authenticatedContext('fred');
        await assertSucceeds(getDoc(doc(fred.firestore(), '/users/fred')));
    })
    it(`As fred user, I shouldn't be able to update another user's infos`, async () => {
        const fred = testEnv.authenticatedContext('fred');
        await assertFails(updateDoc(doc(fred.firestore(), '/users/alice'), { userLastConnection: new Date().toISOString() }))
    })
    it(`As fred user, I should be able to only update userLastConnection field in my user's infos`, async () => {
        const fred = testEnv.authenticatedContext('fred');
        await assertSucceeds(updateDoc(doc(fred.firestore(), '/users/fred'), { userLastConnection: new Date().toISOString() }))
    })
    it(`As fred user, I should not be able to update any other fields than userLastConnection on my user's infos`, async () => {
        const fred = testEnv.authenticatedContext('fred');
        await assertFails(updateDoc(doc(fred.firestore(), '/users/fred'), { username: 'updated username' }))
    })
})
