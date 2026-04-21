-- CreateTable
CREATE TABLE "emails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "rawBody" TEXT,
    "rawHeaders" JSONB DEFAULT [],
    "messageId" TEXT,
    "replyTo" JSONB DEFAULT [],
    "lastEvent" TEXT NOT NULL,
    "scheduledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "recipients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "error" TEXT,
    CONSTRAINT "recipients_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "emails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "emails_createdAt_idx" ON "emails"("createdAt");

-- CreateIndex
CREATE INDEX "recipients_emailId_idx" ON "recipients"("emailId");

-- CreateIndex
CREATE INDEX "recipients_emailAddress_idx" ON "recipients"("emailAddress");
