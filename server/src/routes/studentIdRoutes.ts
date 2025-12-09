import { Router } from 'express';
import { firestore } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { toEthiopian } from 'ethiopian-date';
import userService from '../services/userService';

const router = Router();

// Helper to get program code
const getProgramCode = (programType?: string): string => {
  if (programType?.toLowerCase().includes('six months')) return 'E6';
  if (programType?.toLowerCase() === 'online') return 'O';
  if (programType?.toLowerCase() === 'extension') return 'E';
  if (programType?.toLowerCase() === 'weekend') return 'W';
  if (programType?.toLowerCase() === 'distance') return 'D';
  if (programType?.toLowerCase() === 'regular') return 'R';
  return 'GEN'; // General/Default
};

// POST /api/student-id/generate
router.post('/generate', async (req, res) => {
  const { programType } = req.body;

  try {
    const programCode = getProgramCode(programType);
    const now = new Date();
    const ethiopianYear = toEthiopian(now.getFullYear(), now.getMonth() + 1, now.getDate())[0];
    
    const counterRef = firestore.collection('counters').doc(`studentId-${programCode}-${ethiopianYear}`);
    
    let nextIdNumber = 1;

    // Use a transaction to atomically get and increment the counter
    await firestore.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists) {
        transaction.set(counterRef, { lastNumber: 1 });
      } else {
        const lastNumber = counterDoc.data()?.lastNumber || 0;
        nextIdNumber = lastNumber + 1;
        transaction.update(counterRef, { lastNumber: nextIdNumber });
      }
    });

    const sequentialNumber = String(nextIdNumber).padStart(3, '0');

    const studentId = `DHSR/${programCode}/${ethiopianYear}/${sequentialNumber}`;

    res.status(200).json({ studentId });
  } catch (error) {
    console.error('Error generating student ID:', error);
    res.status(500).json({ success: false, message: 'Failed to generate student ID.' });
  }
});

// POST /api/student-id/check
router.post('/check', async (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ exists: false, message: 'studentId is required.' });
  }

  try {
    const querySnapshot = await firestore.collection('users').where('studentId', '==', studentId).limit(1).get();
    const exists = !querySnapshot.empty;
    return res.status(200).json({ exists });
  } catch (error) {
    console.error('Error checking student ID:', error);
    return res.status(500).json({ success: false, message: 'Failed to check student ID.' });
  }
});

export default router;
