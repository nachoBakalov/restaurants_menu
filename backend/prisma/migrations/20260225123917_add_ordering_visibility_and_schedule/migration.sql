-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "orderingSchedule" JSONB,
ADD COLUMN     "orderingTimezone" TEXT NOT NULL DEFAULT 'Europe/Sofia',
ADD COLUMN     "orderingVisible" BOOLEAN NOT NULL DEFAULT true;
