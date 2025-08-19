/* eslint-disable @typescript-eslint/no-explicit-any */
import { Timestamp } from 'firebase/firestore';
import { submissionService, assignmentService, activityLogService, certificateService } from '@/lib/firestore';

export async function evaluateAndAwardCertificates(uid: string) {
  const now = new Date();

  // Top Performer (90 days, avg >= 90, >= 5 graded)
  try {
    const since = new Date(); since.setDate(since.getDate() - 90);
    const submissions = await submissionService.getSubmissionsByStudent(uid);
    const graded = submissions.filter((s: any) => s.status === 'graded' && s.submittedAt.toDate() >= since);
    const avg = graded.length ? Math.round(graded.reduce((a: number, s: any) => a + (s.grade || 0), 0) / graded.length) : 0;
    if (graded.length >= 5 && avg >= 90) {
      await certificateService.award(uid, {
        type: 'top-performer',
        awardedAt: Timestamp.now(),
        period: { start: Timestamp.fromDate(since), end: Timestamp.fromDate(now) },
        details: { averageGrade: avg, gradedCount: graded.length },
      });
    }
  } catch {}

  // Perfect Attendance (30 days, >= 25 active days)
  try {
    const daysActive = await activityLogService.countDays(uid, 30);
    if (daysActive >= 25) {
      const since = new Date(); since.setDate(since.getDate() - 30);
      await certificateService.award(uid, {
        type: 'perfect-attendance',
        awardedAt: Timestamp.now(),
        period: { start: Timestamp.fromDate(since), end: Timestamp.fromDate(now) },
        details: { daysActive },
      });
    }
  } catch {}

  // Homework Hero (60 days, on-time >= 90% over >= 5)
  try {
    const since = new Date(); since.setDate(since.getDate() - 60);
    const submissions = await submissionService.getSubmissionsByStudent(uid);
    const windowed = submissions.filter((s: any) => s.submittedAt.toDate() >= since);
    const assignmentIds = Array.from(new Set(windowed.map((s: any) => s.assignmentId).filter(Boolean)));
    const assignmentMap = await assignmentService.getAssignmentsByIds(assignmentIds);
    const considered = windowed.filter((s: any) => !!assignmentMap[s.assignmentId]);
    const matches = considered.filter((s: any) => {
      const a = assignmentMap[s.assignmentId] as any;
      if (!a?.dueDate) return false;
      const onTime = s.submittedAt.toDate() <= a.dueDate.toDate();
      const accurate = (s.grade ?? 0) >= 85;
      return s.status === 'graded' && onTime && accurate;
    });
    const onTimeRate = considered.length ? Math.round((matches.length / considered.length) * 100) : 0;
    if (considered.length >= 5 && onTimeRate >= 90) {
      await certificateService.award(uid, {
        type: 'homework-hero',
        awardedAt: Timestamp.now(),
        period: { start: Timestamp.fromDate(since), end: Timestamp.fromDate(now) },
        details: { onTimeRate, considered: considered.length },
      });
    }
  } catch {}
}

