/*
  Warnings:

  - You are about to drop the column `curriculumHighlights` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `durationLabel` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `featuredInHero` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `fee` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `targetAudience` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the `Enrollment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `title` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('UPCOMING', 'OFFERED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('NEW', 'CONTACTED', 'CONFIRMED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_courseId_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "curriculumHighlights",
DROP COLUMN "description",
DROP COLUMN "durationLabel",
DROP COLUMN "featuredInHero",
DROP COLUMN "fee",
DROP COLUMN "name",
DROP COLUMN "targetAudience",
ADD COLUMN     "about" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "audience" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "certificate" JSONB,
ADD COLUMN     "confirmationNotes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "courseSchedule" JSONB,
ADD COLUMN     "durationHours" INTEGER,
ADD COLUMN     "durationText" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "feeText" TEXT,
ADD COLUMN     "level" TEXT,
ADD COLUMN     "overview" JSONB,
ADD COLUMN     "periodText" TEXT,
ADD COLUMN     "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "scheduleNotes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "scheduleText" TEXT,
ADD COLUMN     "startDateText" TEXT,
ADD COLUMN     "status" "CourseStatus" NOT NULL DEFAULT 'OFFERED',
ADD COLUMN     "takeaways" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "trainingTeam" JSONB,
ADD COLUMN     "trainingTeamNotes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "displayOrder" SET DEFAULT 0;

-- DropTable
DROP TABLE "Enrollment";

-- DropEnum
DROP TYPE "EnrollmentStatus";

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "credentials" TEXT,
    "bio" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseInstructor" (
    "courseId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CourseInstructor_pkey" PRIMARY KEY ("courseId","staffId")
);

-- CreateTable
CREATE TABLE "CourseRegistration" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "organization" TEXT,
    "designation" TEXT,
    "preferredBatch" TEXT,
    "message" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseRegistration_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CourseInstructor" ADD CONSTRAINT "CourseInstructor_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseInstructor" ADD CONSTRAINT "CourseInstructor_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRegistration" ADD CONSTRAINT "CourseRegistration_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
