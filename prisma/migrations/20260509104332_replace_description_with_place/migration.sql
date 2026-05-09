/*
  Warnings:

  - You are about to drop the column `capacity` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `events` table. All the data in the column will be lost.
  - Added the required column `place` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "capacity",
DROP COLUMN "description",
DROP COLUMN "time",
ADD COLUMN     "place" TEXT NOT NULL;
