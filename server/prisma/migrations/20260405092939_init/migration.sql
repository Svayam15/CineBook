/*
  Warnings:

  - Added the required column `description` to the `Movie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genre` to the `Movie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `language` to the `Movie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `posterUrl` to the `Movie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rating` to the `Movie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `releaseDate` to the `Movie` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MovieRating" AS ENUM ('U', 'UA', 'A', 'S');

-- AlterTable
ALTER TABLE "Movie" ADD COLUMN     "cast" TEXT,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "director" TEXT,
ADD COLUMN     "genre" TEXT NOT NULL,
ADD COLUMN     "language" TEXT NOT NULL,
ADD COLUMN     "posterUrl" TEXT NOT NULL,
ADD COLUMN     "rating" "MovieRating" NOT NULL,
ADD COLUMN     "releaseDate" TIMESTAMP(3) NOT NULL;
