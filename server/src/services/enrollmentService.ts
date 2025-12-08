import { firestore } from '../config/firebase';
import { Enrollment } from '../types';

class EnrollmentService {
  private enrollmentsCollection = firestore?.collection('enrollments');

  async getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]> {
    try {
      if (!this.enrollmentsCollection) {
        return [];
      }

      const snapshot = await this.enrollmentsCollection
        .where('courseId', '==', courseId)
        .where('isActive', '==', true) // Filter for active enrollments
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment));
    } catch (error) {
      console.error('Error getting enrollments by course:', error);
      throw new Error('Failed to get enrollments');
    }
  }
}

export default new EnrollmentService();
