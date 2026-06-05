-- CreateIndex
CREATE INDEX "AIEvaluation_userId_createdAt_idx" ON "AIEvaluation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AIEvaluation_userId_topic_idx" ON "AIEvaluation"("userId", "topic");

-- CreateIndex
CREATE INDEX "InterviewSession_interviewerId_scheduledAt_idx" ON "InterviewSession"("interviewerId", "scheduledAt");

-- CreateIndex
CREATE INDEX "InterviewSession_candidateId_idx" ON "InterviewSession"("candidateId");

-- CreateIndex
CREATE INDEX "InterviewSession_status_idx" ON "InterviewSession"("status");
