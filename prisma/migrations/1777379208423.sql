-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_webhooks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL DEFAULT 'raw',
    "url" TEXT NOT NULL,
    "events" JSONB NOT NULL DEFAULT [],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "secret" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_webhooks" ("createdAt", "events", "id", "isActive", "secret", "updatedAt", "url") SELECT "createdAt", "events", "id", "isActive", "secret", "updatedAt", "url" FROM "webhooks";
DROP TABLE "webhooks";
ALTER TABLE "new_webhooks" RENAME TO "webhooks";
CREATE INDEX "webhooks_isActive_idx" ON "webhooks"("isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
