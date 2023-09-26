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
    deleteComputedTalkFavoritesCollections
} from "../firestore/migrations/007-deleteComputedTalkFavoritesCollection";

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
type FailurePersistedMigration = {
    name: string,
    startedOn: ISODatetime,
    duration: number,
    status: 'failure',
    errorMessage: string
}

type PersistedMigration = SuccessfulPersistedMigration | FailurePersistedMigration | SkippedPersistedMigration;

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
        .filter(migration => !migration.minimumMigrationDate || new Date(migration.minimumMigrationDate).getTime() < Date.now())
        .reduce((result, migration, idx) => {
        if(result.error) {
            return result;
        }

        if(idx < persistedMigrations.length && migration.name !== persistedMigrations[idx].name) {
            return { ...result, error: `Unexpected migration at index ${idx}: expected: ${persistedMigrations[idx].name}, got: ${migration.name}` }
        }

        if(idx >= persistedMigrations.length || persistedMigrations[idx].status === 'skipped' || persistedMigrations[idx].status === 'failure') {
            result.migrationsToExecute.push(migration);
        } else {
            result.executedMigrations.push(persistedMigrations[idx]);
        }

        return result;
    }, { executedMigrations: [] as PersistedMigration[], migrationsToExecute: [] as Migration[], error: undefined as string|undefined });

    if(error) {
        return sendResponseMessage(response, 500, `Error: ${error}`)
    }

    const { success, migrationsToPersist, executedMigrations, migrationFailure } = await migrationsToExecute.reduce(async (previousPromise, migration) => {
        const {success: previousSuccess, migrationsToPersist, executedMigrations, migrationFailure: previousMigrationFailure} = await previousPromise;

        let persistedMigration: PersistedMigration;
        if(!previousSuccess) {
            persistedMigration = {
                name: migration.name,
                status: 'skipped',
            };
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

        return {
            success: persistedMigration.status === 'success',
            migrationsToPersist: migrationsToPersist.concat(persistedMigration),
            executedMigrations: executedMigrations.concat(...(persistedMigration.status === 'success'?[persistedMigration]:[])),
            migrationFailure: persistedMigration.status === 'failure' ? persistedMigration : previousMigrationFailure
        };
    }, Promise.resolve({
        success: true,
        migrationsToPersist: alreadyExecutedMigrations,
        executedMigrations: [] as SuccessfulPersistedMigration[],
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
