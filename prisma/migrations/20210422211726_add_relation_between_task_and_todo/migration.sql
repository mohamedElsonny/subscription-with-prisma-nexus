/*
  Warnings:

  - Added the required column `todoId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "todoId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Task" ADD FOREIGN KEY ("todoId") REFERENCES "Todo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
