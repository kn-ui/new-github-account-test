import { userService } from '../lib/firestore';
import { UserRole } from '../types';

const updateRoles = async () => {
  try {
    // --- IMPORTANT ---
    // Replace these with the actual emails of your admin and teacher users.
    const adminEmail = 'admin@example.com';
    const teacherEmail = 'teacher@example.com';

    // --- Update Admin User ---
    const adminUser = await userService.getUserByEmail(adminEmail);
    if (adminUser) {
      await userService.updateUser(adminUser.uid, { role: UserRole.ADMIN });
      console.log(`User with email ${adminEmail} has been updated to an admin.`);
    } else {
      console.log(`User with email ${adminEmail} not found.`);
    }

    // --- Update Teacher User ---
    const teacherUser = await userService.getUserByEmail(teacherEmail);
    if (teacherUser) {
      await userService.updateUser(teacherUser.uid, { role: UserRole.TEACHER });
      console.log(`User with email ${teacherEmail} has been updated to a teacher.`);
    } else {
      console.log(`User with email ${teacherEmail} not found.`);
    }

  } catch (error) {
    console.error('Error updating user roles:', error);
  }
};

updateRoles();