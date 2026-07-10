-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "exerciseMode" TEXT NOT NULL DEFAULT 'ai',
ADD COLUMN     "exercisesJson" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "slideMode" TEXT NOT NULL DEFAULT 'ai',
ADD COLUMN     "slidesJson" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "LessonQuestion" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "answer" TEXT NOT NULL DEFAULT '',
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonQuestion_lessonId_userId_idx" ON "LessonQuestion"("lessonId", "userId");

-- CreateIndex
CREATE INDEX "LessonQuestion_answeredAt_idx" ON "LessonQuestion"("answeredAt");

-- AddForeignKey
ALTER TABLE "LessonQuestion" ADD CONSTRAINT "LessonQuestion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonQuestion" ADD CONSTRAINT "LessonQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
