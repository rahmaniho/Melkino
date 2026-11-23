import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export type MigrationFile = { id: string; sql: string };
const migrationDirectoryName = /^\d{4}_[a-z0-9_]+$/;
const flatMigrationName = /^\d{4}_[a-z0-9_]+\.sql$/;

/** Load folder-based migrations in stable order; each folder contains migration.sql. */
export async function loadMigrationFiles(directory: string): Promise<MigrationFile[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const flatFiles = entries.filter((entry) => entry.isFile() && flatMigrationName.test(entry.name));
  if (flatFiles.length) {
    throw new Error(`Flat SQL migrations are not supported (${flatFiles.map((entry) => entry.name).join(', ')}); use numbered folders containing migration.sql.`);
  }

  const folders = entries
    .filter((entry) => entry.isDirectory() && migrationDirectoryName.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  if (!folders.length) throw new Error('No migration directories found.');

  const migrations: MigrationFile[] = [];
  for (const id of folders) {
    const sql = await readFile(resolve(directory, id, 'migration.sql'), 'utf8');
    if (!sql.trim()) throw new Error(`Migration ${id} is empty.`);
    migrations.push({ id, sql });
  }
  return migrations;
}
