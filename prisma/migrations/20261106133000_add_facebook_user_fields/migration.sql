-- Add Facebook identity and encrypted user token fields used by Facebook OAuth.
ALTER TABLE "User"
ADD COLUMN "facebookId" TEXT,
ADD COLUMN "facebookAccessToken" TEXT;

CREATE UNIQUE INDEX "User_facebookId_key" ON "User"("facebookId");
