import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc
} from 'firebase/firestore';
import { db, COLLECTIONS, getFirebaseErrorMessage } from '../firebase';

// Notification interface
export interface Notification {
  id?: string;
  user_uid: string;
  type: 'approval' | 'rejection' | 'violation' | 'general' | 'assignment';
  title: string;
  message: string;
  date: string;
  read: boolean;
  submission_id?: string;
  assignment_date?: string;
  action_required?: boolean;
  created_at: string;
}

// Notifications service functions
export const notificationsService = {
  // Create notification
  async createNotification(notificationData: Omit<Notification, 'id' | 'created_at'>): Promise<string> {
    try {
      const notification: Omit<Notification, 'id'> = {
        ...notificationData,
        created_at: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), notification);
      return docRef.id;
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Get notifications for a user
  async getUserNotifications(userUid: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('user_uid', '==', userUid),
        orderBy('created_at', 'desc')
      );
      
      const notificationsSnapshot = await getDocs(q);
      return notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
        read: true
      });
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userUid: string): Promise<void> {
    try {
      const notifications = await this.getUserNotifications(userUid);
      const updatePromises = notifications
        .filter(notification => !notification.read)
        .map(notification => 
          updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notification.id!), { read: true })
        );
      
      await Promise.all(updatePromises);
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId));
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Get unread count for a user
  async getUnreadCount(userUid: string): Promise<number> {
    try {
      const notifications = await this.getUserNotifications(userUid);
      return notifications.filter(notification => !notification.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  // Create submission approval notification
  async createApprovalNotification(userUid: string, submissionId: string, questionTitle: string): Promise<string> {
    return this.createNotification({
      user_uid: userUid,
      type: 'approval',
      title: '✅ Submission Approved',
      message: `Your submission for "${questionTitle}" has been approved! Your streak continues.`,
      date: new Date().toISOString(),
      read: false,
      submission_id: submissionId
    });
  },

  // Create submission rejection notification
  async createRejectionNotification(
    userUid: string, 
    submissionId: string, 
    questionTitle: string, 
    reason?: string
  ): Promise<string> {
    const message = reason 
      ? `Your submission for "${questionTitle}" was rejected. Reason: ${reason}. This counts as a streak break.`
      : `Your submission for "${questionTitle}" was rejected. This counts as a streak break.`;

    return this.createNotification({
      user_uid: userUid,
      type: 'rejection',
      title: '❌ Submission Rejected',
      message,
      date: new Date().toISOString(),
      read: false,
      submission_id: submissionId,
      action_required: true
    });
  },

  // Create violation notification
  async createViolationNotification(userUid: string, violationType: string): Promise<string> {
    return this.createNotification({
      user_uid: userUid,
      type: 'violation',
      title: '⚠️ Rule Violation',
      message: `Rule violation detected: ${violationType}. Please review the challenge guidelines.`,
      date: new Date().toISOString(),
      read: false,
      action_required: true
    });
  }
};
