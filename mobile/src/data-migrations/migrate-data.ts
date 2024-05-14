
type Migration = {
  name: string,
  exec: (userId: string) => Promise<"OK"|"Error">,
}

const MIGRATIONS: Array<Migration> = [
]

type MigrationResult = { name: string, duration: number }
  & (
    {status: "error", errorMessage: string}
  | {status: "success" }
  )

export async function migrateData(userId: string) {
  const migrationStoreKey = `user:${userId}:migrations`;
  const executedMigrations = JSON.parse(localStorage.getItem(migrationStoreKey) || "[]") as Array<MigrationResult>

  await MIGRATIONS.reduce(async (previousPromise, migration) => {
    await previousPromise

    if(executedMigrations.find(m => m.name === migration.name)) {
      // Already processed => skipping
    } else {
      const start = Date.now();
      try {
        console.log(`Starting data migration named [${migration.name}]...`)
        await migration.exec(userId);
        const duration = Date.now() - start;

        console.log(`  -> data migration named [${migration.name}] performed successfully (${duration}ms)`)
        executedMigrations.push({
          name: migration.name,
          duration,
          status: "success",
        })
      } catch(error) {
        const duration = Date.now() - start;
        const errorMessage = error?.toString() || "Error"
        console.log(`  -> data migration named [${migration.name}] not performed due to error (after ${duration}ms): ${errorMessage}`)
        executedMigrations.push({
          name: migration.name,
          duration,
          status: "error",
          errorMessage
        })
      }

      localStorage.setItem(migrationStoreKey, JSON.stringify(executedMigrations));
    }
  }, Promise.resolve())
}
