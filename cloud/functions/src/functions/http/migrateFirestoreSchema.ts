import {https} from "firebase-functions";
import {extractSingleQueryParam, sendResponseMessage} from "./utils";
import {db} from "../../firebase";
import {ISODatetime} from "../../../../../shared/type-utils";
import {
    createExistingUsersTokensWallet
} from "../firestore/migrations/000-createExistingUsersTokensWallet";
import {createExistingUsersInfos} from "../firestore/migrations/001-createExistingUsersInfos";
import {addUserIdInTokenWallet} from "../firestore/migrations/002-addUserIdInTokenWallet";
import {
    gettingRidOfUserPreferencesPastEvents
} from "../firestore/migrations/003-gettingRidOfUserPreferencesPastEvents";
import {createOrganizerSpaceRatings} from "../firestore/migrations/006-createOrganizerSpaceRatings";
import {
    cleanComputedTalkFavoritesCollectionsDeletion,
    deleteComputedTalkFavoritesCollections
} from "../firestore/migrations/007-deleteComputedTalkFavoritesCollection";
import {
    introducingPerTalkFeedbacksLastUpdates,
} from "../firestore/migrations/008-introducingPerTalkFeedbacksLastUpdates";
import {
    refactoOrgaSpaceRatingsToPerTalkRatings
} from "../firestore/migrations/009-refactoOrgaSpaceRatingsToPerTalkRatings";
import {
    introduceTalksStats_allInOneDocument
} from "../firestore/migrations/010-introduceTalksStats-allInOneDocument";
import {
    introduceOrganizerSpaceDailyRatings
} from "../firestore/migrations/011-introduceOrganizerSpaceDailyRatings";
import {resetFavoritesLastUpdates} from "../firestore/migrations/012-resetFavoritesLastUpdates";
import {introduceRoomsStats} from "../firestore/migrations/013-introduceRoomsStats";
import {
  introduceGlobalInfosAndSlowPacedTalkStats
} from "../firestore/migrations/014-introduceGlobalInfosAndSlowPacedTalkStats";
import {introduceCrawlerFamilyAndEventName} from "../firestore/migrations/015-introduceCrawlerFamilyAndEventName";
import {considerCrawlingKeysAsLegacy} from "../firestore/migrations/016-considerCrawlingKeysAsLegacy";

/**
 * Like Flyway, but for firestore :-)
 */
const MIGRATIONS: Migration[] = [
    { name: "createExistingUsersTokensWallet", exec: createExistingUsersTokensWallet },
    { name: "createExistingUsersInfos", exec: createExistingUsersInfos },
    { name: "addUserIdInTokenWallet", exec: addUserIdInTokenWallet },
    { name: "gettingRidOfUserPreferencesPastEvents", exec: gettingRidOfUserPreferencesPastEvents },
    { name: "createOrganizerSpaceRatings", exec: createOrganizerSpaceRatings },
    // This migration can wait Devoxx BE '23 to be completed, as __computed collection might still be
    // used by people having an old version of the app in their service worker cache, so the longer we keep
    // the collection and the safer we will be
    { name: "deleteComputedTalkFavoritesCollections", exec: deleteComputedTalkFavoritesCollections, minimumMigrationDate: "2023-10-09T00:00:00Z" },
    { name: "introducingPerTalkFeedbacksLastUpdates", exec: introducingPerTalkFeedbacksLastUpdates },
    { name: "refactoOrgaSpaceRatingsToPerTalkRatings", exec: refactoOrgaSpaceRatingsToPerTalkRatings },
    { name: "introduceTalksStats_allInOneDocument", exec: introduceTalksStats_allInOneDocument },
    { name: "introduceOrganizerSpaceDailyRatings", exec: introduceOrganizerSpaceDailyRatings },
    { name: "introduceOrganizerSpaceDailyRatingsAgain", exec: introduceOrganizerSpaceDailyRatings },
    { name: "cleanComputedTalkFavoritesCollectionsDeletion", exec: cleanComputedTalkFavoritesCollectionsDeletion },
    { name: "resetFavoritesLastUpdates", exec: resetFavoritesLastUpdates },
    { name: "introduceRoomsStats", exec: introduceRoomsStats },
    { name: "introduceGlobalInfosAndSlowPacedTalkStats", exec: introduceGlobalInfosAndSlowPacedTalkStats },
    { name: "introduceCrawlerFamilyAndEventName", exec: introduceCrawlerFamilyAndEventName },
    { name: "considerCrawlingKeysAsLegacy", exec: considerCrawlingKeysAsLegacy },
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

export const migrateFirestoreSchema = https.onRequest(async (request, response) => {
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

    return sendResponseMessage(response, success?200:500, [
        `Executed migrations: [${executedMigrations.map(m => `${m.name} (${m.duration}ms)`).join(", ")}]`,
        migrationFailure?`Migration failure at ${migrationFailure.name}: ${JSON.stringify(migrationFailure)}`:``
    ].join("\n"))
});
