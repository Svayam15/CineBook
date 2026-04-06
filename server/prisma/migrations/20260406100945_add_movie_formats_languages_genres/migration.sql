/*
  Warnings:

  - You are about to drop the column `genre` on the `Movie` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `Movie` table. All the data in the column will be lost.
  - Added the required column `language` to the `Show` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Movie" DROP COLUMN "genre",
DROP COLUMN "language",
ADD COLUMN     "formats" TEXT[],
ADD COLUMN     "genres" TEXT[],
ADD COLUMN     "languages" TEXT[];

-- AlterTable
ALTER TABLE "Show" ADD COLUMN     "language" TEXT NOT NULL;
