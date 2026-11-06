import { eq, and, or, lt, gt, isNull, isNotNull, desc } from "drizzle-orm";
import { db } from "./index";
import { pastes, type Paste, type NewPaste } from "./schema";

export function getPasteById(id: string): Paste | undefined {
  return db.select().from(pastes).where(eq(pastes.id, id)).get();
}

export function createPaste(data: NewPaste): Paste {
  return db.insert(pastes).values(data).returning().get();
}

export type PasteSummary = Pick<Paste, "id" | "createdAt" | "expiresAt" | "sizeBytes">;

export function getAllPastes(): PasteSummary[] {
  const now = Math.floor(Date.now() / 1000);
  return db
    .select({
      id: pastes.id,
      createdAt: pastes.createdAt,
      expiresAt: pastes.expiresAt,
      sizeBytes: pastes.sizeBytes,
    })
    .from(pastes)
    .where(or(isNull(pastes.expiresAt), gt(pastes.expiresAt, now)))
    .orderBy(desc(pastes.createdAt))
    .all();
}

export function deletePasteById(id: string): boolean {
  const result = db.delete(pastes).where(eq(pastes.id, id)).run();
  return result.changes > 0;
}

export function updatePasteExpiration(
  id: string,
  expiresAt: number | null,
): boolean {
  const result = db
    .update(pastes)
    .set({ expiresAt })
    .where(eq(pastes.id, id))
    .run();
  return result.changes > 0;
}

export type RenameResult = "renamed" | "not-found" | "name-taken";

export function renamePasteById(id: string, newId: string): RenameResult {
  try {
    const result = db
      .update(pastes)
      .set({ id: newId })
      .where(eq(pastes.id, id))
      .run();
    return result.changes > 0 ? "renamed" : "not-found";
  } catch (error) {
    // Renaming onto an existing name trips the id primary key, and
    // SQLite raises instead of reporting zero changes. Report it as a
    // distinct outcome so callers can tell it apart from a missing
    // row; rethrow anything else.
    const code = (error as { code?: string } | null)?.code;
    if (
      code === "SQLITE_CONSTRAINT_PRIMARYKEY" ||
      code === "SQLITE_CONSTRAINT_UNIQUE"
    ) {
      return "name-taken";
    }
    throw error;
  }
}

export function deleteExpiredPastes(): number {
  const now = Math.floor(Date.now() / 1000);
  const result = db
    .delete(pastes)
    .where(and(isNotNull(pastes.expiresAt), lt(pastes.expiresAt, now)))
    .run();
  return result.changes;
}
