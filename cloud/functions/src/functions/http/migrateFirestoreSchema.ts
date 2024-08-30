import {extractSingleQueryParam, sendResponseMessage} from "./utils";
import {db} from "../../firebase";
import {ISODatetime} from "../../../../../shared/type-utils";
import * as functions from "firebase-functions";
import * as express from "express";

/**
 * Like Flyway, but for firestore :-)
 */
const MIGRATIONS: Migration[] = [
    { name: "createExistingUsersTokensWallet", exec: async () => (await import("../firestore/migrations/000-createExistingUsersTokensWallet")).createExistingUsersTokensWallet() },
    { name: "createExistingUsersInfos", exec: async () => (await import("../firestore/migrations/001-createExistingUsersInfos")).createExistingUsersInfos() },
    { name: "addUserIdInTokenWallet", exec: async () => (await import("../firestore/migrations/002-addUserIdInTokenWallet")).addUserIdInTokenWallet() },
    { name: "gettingRidOfUserPreferencesPastEvents", exec: async () => (await import("../firestore/migrations/003-gettingRidOfUserPreferencesPastEvents")).gettingRidOfUserPreferencesPastEvents() },
    { name: "createOrganizerSpaceRatings", exec: async () => (await import("../firestore/migrations/006-createOrganizerSpaceRatings")).createOrganizerSpaceRatings() },
    { name: "deleteComputedTalkFavoritesCollections", exec: async () => (await import("../firestore/migrations/007-deleteComputedTalkFavoritesCollection")).deleteComputedTalkFavoritesCollections(), minimumMigrationDate: "2023-10-09T00:00:00Z" },
    { name: "introducingPerTalkFeedbacksLastUpdates", exec: async () => (await import("../firestore/migrations/008-introducingPerTalkFeedbacksLastUpdates")).introducingPerTalkFeedbacksLastUpdates() },
    { name: "refactoOrgaSpaceRatingsToPerTalkRatings", exec: async () => (await import("../firestore/migrations/009-refactoOrgaSpaceRatingsToPerTalkRatings")).refactoOrgaSpaceRatingsToPerTalkRatings() },
    { name: "introduceTalksStats_allInOneDocument", exec: async () => (await import("../firestore/migrations/010-introduceTalksStats-allInOneDocument")).introduceTalksStats_allInOneDocument() },
    { name: "introduceOrganizerSpaceDailyRatings", exec: async () => (await import("../firestore/migrations/011-introduceOrganizerSpaceDailyRatings")).introduceOrganizerSpaceDailyRatings() },
    { name: "introduceOrganizerSpaceDailyRatingsAgain", exec: async () => (await import("../firestore/migrations/011-introduceOrganizerSpaceDailyRatings")).introduceOrganizerSpaceDailyRatings() },
    { name: "cleanComputedTalkFavoritesCollectionsDeletion", exec: async () => (await import("../firestore/migrations/007-deleteComputedTalkFavoritesCollection")).cleanComputedTalkFavoritesCollectionsDeletion() },
    { name: "resetFavoritesLastUpdates", exec: async () => (await import("../firestore/migrations/012-resetFavoritesLastUpdates")).resetFavoritesLastUpdates() },
    { name: "introduceRoomsStats", exec: async () => (await import("../firestore/migrations/013-introduceRoomsStats")).introduceRoomsStats() },
    { name: "introduceGlobalInfosAndSlowPacedTalkStats", exec: async () => (await import("../firestore/migrations/014-introduceGlobalInfosAndSlowPacedTalkStats")).introduceGlobalInfosAndSlowPacedTalkStats() },
    { name: "introduceCrawlerFamilyAndEventName", exec: async () => (await import("../firestore/migrations/015-introduceCrawlerFamilyAndEventName")).introduceCrawlerFamilyAndEventName() },
    { name: "considerCrawlingKeysAsLegacy", exec: async () => (await import("../firestore/migrations/016-considerCrawlingKeysAsLegacy")).considerCrawlingKeysAsLegacy() },
    { name: "migrateFamilyEventsStatsAccessTokenTypes", exec: async () => (await import("../firestore/migrations/017-migrateSomePublicTokenTypes")).migrateFamilyEventsStatsAccessTokenTypes() },
    { name: "introduceTalkAssets", exec: async () => (await import("../firestore/migrations/018-introduceTalkAssets")).introduceTalkAssets() },
    { name: "introduceFormattingsFeature", exec: async () => (await import("../firestore/migrations/019-introduceFormattingsFeature")).introduceFormattingsFeature() },
    { name: "cleaningUnusedFirestoreDocs", exec: async () => (await import("../firestore/migrations/020-cleaningUnusedFirestoreDocs")).cleaningUnusedFirestoreDocs() },
    { name: "introduceEventVisibility", exec: async () => (await import("../firestore/migrations/021-introduceEventVisibility")).introduceEventVisibility() },
    { name: "introduceSpaceTokenDoc", exec: async () => (await import("../firestore/migrations/022-introduceSpaceTokenDoc")).introduceSpaceTokenDoc() },
    { name: "dontConsiderOptionalMigrationInUserVersion", exec: async () => (await import("../firestore/migrations/023-dontConsiderOptionalMigrationInUserVersion")).dontConsiderOptionalMigrationInUserVersion() },
    { name: "fillEmptyUserSubCollectionDocs", exec: async () => (await import("../firestore/migrations/024-fillEmptyUserSubCollectionDocs")).fillEmptyUserSubCollectionDocs() },
    { name: "fillUserLastConnection", exec: async () => (await import("../firestore/migrations/025-fillUserLastConnection")).fillUserLastConnection() },
    { name: "fillTalkEditorsSpeakersAndTitle", exec: async () => (await import("../firestore/migrations/026-fillTalkEditorsSpeakersAndTitle")).fillTalkEditorsSpeakersAndTitle() },
    { name: "introduceEventSpeakersAndFixTalkUndefinedTags", exec: async () => (await import("../firestore/migrations/027-introduceEventSpeakersAndFixTalkUndefinedTags")).introduceEventSpeakersAndFixTalkUndefinedTags() },
];

export type MigrationResult = "OK"|"Error";

type Migration = {
    name: string,
    exec: () => Promise<MigrationResult>,
    minimumMigrationDate?: ISODatetime
}

type SuccessfulPersistedMigration = {
    name: string,
    startedOn: ISODatetime,
    duration: number,
    status: 'success'
}
type SkippedPersistedMigration = {
    name: string,
    status: 'skipped',
}
type IgnoredPersistedMigration = {
    name: string,
    status: 'ignored',
}
type FailurePersistedMigration = {
    name: string,
    startedOn: ISODatetime,
    duration: number,
    status: 'failure',
    errorMessage: string
}

type PersistedMigration = SuccessfulPersistedMigration | FailurePersistedMigration | SkippedPersistedMigration | IgnoredPersistedMigration;

type SchemaMigrations = {
    migrations: PersistedMigration[];
}

const migrationNames = MIGRATIONS.map(m => m.name);

export async function migrateFirestoreSchema(request: functions.https.Request, response: express.Response) {
    const migrationToken = extractSingleQueryParam(request, 'migrationToken')
    if(!migrationToken) {
        return sendResponseMessage(response, 400, `Missing 'migrationToken' query parameter !`)
    }
    if(migrationToken !== process.env.MIGRATION_TOKEN) {
        return sendResponseMessage(response, 403, `Forbidden: invalid migrationToken !`)
    }

    const schemaMigrations = ((await db.collection('schema-migrations').doc("self").get()).data() as undefined|SchemaMigrations) || {migrations: []};
    const persistedMigrations = schemaMigrations.migrations;

    const persistedMigrationNames = persistedMigrations.map(m => m.name);
    const unknownMigrations = persistedMigrationNames.filter(pmn => !migrationNames.includes(pmn))
    if(unknownMigrations.length) {
        return sendResponseMessage(response, 500,
            `Unknown migrations detected: ${unknownMigrations.join(", ")}
        Known migrations: ${migrationNames.join(", ")}`)
    }

    const { executedMigrations: alreadyExecutedMigrations, migrationsToExecute, error } = MIGRATIONS
        .map((migration, index) => ({ migration, index }))
        .reduce((result, { migration, index}) => {
        if(result.error) {
            return result;
        }

        if(index < persistedMigrations.length && migration.name !== persistedMigrations[index].name) {
            return { ...result, error: `Unexpected migration at index ${index}: expected: ${persistedMigrations[index].name}, got: ${migration.name}` }
        }

        if(index >= persistedMigrations.length
            || persistedMigrations[index].status === 'skipped'
            || persistedMigrations[index].status === 'failure'
            || persistedMigrations[index].status === 'ignored'
        ) {
            result.migrationsToExecute.push({ migration, atIndex: index });
        } else {
            result.executedMigrations.push(persistedMigrations[index]);
        }

        return result;
    }, { executedMigrations: [] as PersistedMigration[], migrationsToExecute: [] as { migration: Migration, atIndex: number }[], error: undefined as string|undefined });

    if(error) {
        return sendResponseMessage(response, 500, `Error: ${error}`)
    }

    const { success, migrationsToPersist, executedMigrations, migrationFailure } = await migrationsToExecute.reduce(async (previousPromise, { migration, atIndex }) => {
        const {success: previousSuccess, migrationsToPersist, ignoredMigrations, executedMigrations, migrationFailure: previousMigrationFailure} = await previousPromise;

        let persistedMigration: PersistedMigration;
        if(!previousSuccess) {
            persistedMigration = {
                name: migration.name,
                status: 'skipped',
            };
        } else if(migration.minimumMigrationDate && new Date(migration.minimumMigrationDate).getTime() > Date.now()) {
            persistedMigration = {
                name: migration.name,
                status: "ignored",
            }
        } else {
            const start = new Date();
            try {
                await migration.exec();
                persistedMigration = {
                    name: migration.name,
                    status: "success",
                    startedOn: start.toISOString() as ISODatetime,
                    duration: Date.now() - start.getTime(),
                }
            }catch(error: any) {
                console.error(`Error during migration [${migration.name}]:`, error)
                persistedMigration = {
                    name: migration.name,
                    status: "failure",
                    startedOn: start.toISOString() as ISODatetime,
                    duration: Date.now() - start.getTime(),
                    errorMessage: error.toString(),
                }
            }
        }

        migrationsToPersist.splice(atIndex, 0, persistedMigration)

        return {
            success: persistedMigration.status === 'success' || persistedMigration.status === 'ignored',
            migrationsToPersist,
            executedMigrations: executedMigrations.concat(...(persistedMigration.status === 'success'?[persistedMigration]:[])),
            ignoredMigrations: ignoredMigrations.concat(...(persistedMigration.status === 'ignored'?[persistedMigration]:[])),
            migrationFailure: persistedMigration.status === 'failure' ? persistedMigration : previousMigrationFailure
        };
    }, Promise.resolve({
        success: true,
        migrationsToPersist: alreadyExecutedMigrations,
        executedMigrations: [] as SuccessfulPersistedMigration[],
        ignoredMigrations: [] as IgnoredPersistedMigration[],
        migrationFailure: undefined as undefined|FailurePersistedMigration
    }))

    const updatedSchemaMigration: SchemaMigrations = {
        migrations: migrationsToPersist
    }
    await db.collection('schema-migrations').doc("self").set(updatedSchemaMigration)

    if(migrationFailure) {
      console.error(`Migration failure at ${migrationFailure.name}: ${JSON.stringify(migrationFailure)}`)
    }

    return sendResponseMessage(response, success?200:500, [
        `Executed migrations: [${executedMigrations.map(m => `${m.name} (${m.duration}ms)`).join(", ")}]`,
        migrationFailure?`Migration failure at ${migrationFailure.name}: ${JSON.stringify(migrationFailure)}`:``
    ].join("\n"))
}
