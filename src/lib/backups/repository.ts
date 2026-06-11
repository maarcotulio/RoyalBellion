import { z } from "zod";

import { connectToMongo } from "@/lib/db/mongoose";
import { CreatureModel } from "@/lib/db/models/creature";
import { EncounterModel } from "@/lib/db/models/encounter";
import {
  RoyalBellionBackupSchema,
  type RoyalBellionBackup,
} from "@/lib/backups/schema";
import { CreatureSchema } from "@/lib/schemas/creature";
import { EncounterSchema } from "@/lib/schemas/encounter";

function parseBackup(input: unknown) {
  return RoyalBellionBackupSchema.parse(input);
}

function normalizeEncounterDocument(document: unknown) {
  if (typeof document !== "object" || document === null || !("log" in document)) {
    return document;
  }

  const candidate = document as { readonly log?: unknown };

  if (!Array.isArray(candidate.log)) {
    return document;
  }

  return {
    ...document,
    log: candidate.log.map((entry) => {
      if (typeof entry !== "object" || entry === null || !("damage" in entry)) {
        return entry;
      }

      const logEntry = entry as { readonly damage?: unknown };
      const damage = logEntry.damage;

      if (
        typeof damage !== "object" ||
        damage === null ||
        ("expression" in damage && typeof damage.expression === "string")
      ) {
        return entry;
      }

      const entryWithoutDamage = Object.fromEntries(
        Object.entries(logEntry).filter(([key]) => key !== "damage"),
      );

      return entryWithoutDamage;
    }),
  };
}

export async function exportRoyalBellionBackup(): Promise<RoyalBellionBackup> {
  await connectToMongo();

  const [creatureDocuments, encounterDocuments] = await Promise.all([
    CreatureModel.find({}, { _id: 0 }).sort({ name: 1 }).lean().exec(),
    EncounterModel.find({}, { _id: 0 }).sort({ updatedAt: -1 }).lean().exec(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      creatures: creatureDocuments.map((document) => CreatureSchema.parse(document)),
      encounters: encounterDocuments.map((document) =>
        EncounterSchema.parse(normalizeEncounterDocument(document)),
      ),
    },
  };
}

export async function importRoyalBellionBackup(input: unknown) {
  const backup = parseBackup(input);

  await connectToMongo();

  const [creatureResult, encounterResult] = await Promise.all([
    backup.data.creatures.length > 0
      ? CreatureModel.bulkWrite(
          backup.data.creatures.map((creature) => ({
            updateOne: {
              filter: { id: creature.id },
              update: { $set: creature },
              upsert: true,
            },
          })),
          { ordered: true },
        )
      : Promise.resolve(null),
    backup.data.encounters.length > 0
      ? EncounterModel.bulkWrite(
          backup.data.encounters.map((encounter) => ({
            updateOne: {
              filter: { id: encounter.id },
              update: { $set: encounter },
              upsert: true,
            },
          })),
          { ordered: true },
        )
      : Promise.resolve(null),
  ]);

  return {
    creatures: {
      matched: creatureResult?.matchedCount ?? 0,
      modified: creatureResult?.modifiedCount ?? 0,
      upserted: creatureResult?.upsertedCount ?? 0,
    },
    encounters: {
      matched: encounterResult?.matchedCount ?? 0,
      modified: encounterResult?.modifiedCount ?? 0,
      upserted: encounterResult?.upsertedCount ?? 0,
    },
  };
}

export function formatBackupZodIssues(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "<root>",
    message: issue.message,
  }));
}
