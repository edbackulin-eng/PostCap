-- CreateEnum
CREATE TYPE "FiscalStatus" AS ENUM ('pending', 'success', 'failed');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "fiscal_status" "FiscalStatus" NOT NULL DEFAULT 'pending';
