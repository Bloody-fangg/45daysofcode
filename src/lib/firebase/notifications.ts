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
  addDoc,
  limit,
  startAfter,
  Timestamp
} from 'firebase/firestore';
import { db, COLLECTIONS, getFirebaseErrorMessage } from '../firebase';

// Enhanced notification interface
export interface Notification {
  id?: string;
  user_uid: string;
  type: 'approval' | 'rejection' | 'violation' | 'general' | 'assignment' | 'question_answered' | 'system' | 'maintenance' | 'achievement';
  title: string;
  message: string;
  date: string;
  read: boolean;
  submission_id?: string;
  assignment_date?: string;
  question_id?: string;
  action_required?: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  expires_at?: string;
  data?: any; // Additional metadata
  created_at: string;
  created_by?: string;
  auto_generated: boolean;
}

// Admin notification interface
export interface AdminNotification {
  id?: string;
  type: 'new_submission' | 'new_question' | 'system_alert' | 'user_violation' | 'urgent_support' | 'platform_issue';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source_id?: string; // submission_id, question_id, etc.
  source_type?: string;
  student_info?: {
    uid: string;
    name: string;
    email: string;
  };
  created_at: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  action_taken?: string;
}

// Enhanced notifications service
export const notificationsService = {
  // Create user notification with enhanced features
  async createNotification(notificationData: Omit<Notification, 'id' | 'created_at' | 'auto_generated'>): Promise<string> {
    try {
      const notification: Omit<Notification, 'id'> = {
        ...notificationData,
        priority: notificationData.priority || 'medium',
        auto_generated: true,
        created_at: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), notification);
      return docRef.id;
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Create admin notification
  async createAdminNotification(notificationData: Omit<AdminNotification, 'id' | 'created_at' | 'acknowledged' | 'resolved'>): Promise<string> {
    try {
      const adminNotification: Omit<AdminNotification, 'id'> = {
        ...notificationData,
        created_at: new Date().toISOString(),
        acknowledged: false,
        resolved: false
      };

      const docRef = await addDoc(collection(db, 'admin_notifications'), adminNotification);
      return docRef.id;
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Get user notifications with pagination
  async getUserNotifications(
    userUid: string, 
    options?: {
      limit?: number;
      lastDocId?: string;
      unreadOnly?: boolean;
    }
  ): Promise<Notification[]> {
    try {
      let q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('user_uid', '==', userUid),
        orderBy('created_at', 'desc')
      );

      if (options?.unreadOnly) {
        q = query(q, where('read', '==', false));
      }

      if (options?.limit) {
        q = query(q, limit(options.limit));
      }

      if (options?.lastDocId) {
        const lastDoc = await getDoc(doc(db, COLLECTIONS.NOTIFICATIONS, options.lastDocId));
        if (lastDoc.exists()) {
          q = query(q, startAfter(lastDoc));
        }
      }
      
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

  // Get admin notifications
  async getAdminNotifications(filters?: {
    priority?: string;
    type?: string;
    unacknowledged?: boolean;
    unresolved?: boolean;
  }): Promise<AdminNotification[]> {
    try {
      let q = query(
        collection(db, 'admin_notifications'),
        orderBy('created_at', 'desc')
      );

      if (filters?.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }
      if (filters?.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters?.unacknowledged) {
        q = query(q, where('acknowledged', '==', false));
      }
      if (filters?.unresolved) {
        q = query(q, where('resolved', '==', false));
      }

      const notificationsSnapshot = await getDocs(q);
      return notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminNotification[];
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
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

  // Mark admin notification as acknowledged
  async acknowledgeAdminNotification(notificationId: string, adminName: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'admin_notifications', notificationId), {
        acknowledged: true,
        acknowledged_by: adminName,
        acknowledged_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Resolve admin notification
  async resolveAdminNotification(notificationId: string, adminName: string, actionTaken?: string): Promise<void> {
    try {
      const updateData: any = {
        resolved: true,
        resolved_by: adminName,
        resolved_at: new Date().toISOString()
      };

      if (actionTaken) {
        updateData.action_taken = actionTaken;
      }

      await updateDoc(doc(db, 'admin_notifications', notificationId), updateData);
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userUid: string): Promise<void> {
    try {
      const notifications = await this.getUserNotifications(userUid, { unreadOnly: true });
      const updatePromises = notifications.map(notification => 
        this.markAsRead(notification.id!)
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
      const unreadNotifications = await this.getUserNotifications(userUid, { unreadOnly: true });
      return unreadNotifications.length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  // Get admin notifications count
  async getAdminNotificationCounts(): Promise<{
    total: number;
    unacknowledged: number;
    unresolved: number;
    urgent: number;
  }> {
    try {
      const allNotifications = await this.getAdminNotifications();
      
      return {
        total: allNotifications.length,
        unacknowledged: allNotifications.filter(n => !n.acknowledged).length,
        unresolved: allNotifications.filter(n => !n.resolved).length,
        urgent: allNotifications.filter(n => n.priority === 'urgent').length
      };
    } catch (error) {
      console.error('Error getting admin notification counts:', error);
      return { total: 0, unacknowledged: 0, unresolved: 0, urgent: 0 };
    }
  },

  // Enhanced submission approval notification
  async createApprovalNotification(userUid: string, submissionId: string, questionTitle: string): Promise<string> {
    return this.createNotification({
      user_uid: userUid,
      type: 'approval',
      title: '🎉 Submission Approved!',
      message: `Congratulations! Your submission for "${questionTitle}" has been approved. Your streak continues and you've earned points!`,
      date: new Date().toISOString(),
      read: false,
      submission_id: submissionId,
      priority: 'medium',
      category: 'achievement'
    });
  },

  // Enhanced submission rejection notification
  async createRejectionNotification(
    userUid: string, 
    submissionId: string, 
    questionTitle: string, 
    reason?: string
  ): Promise<string> {
    const message = reason 
      ? `Your submission for "${questionTitle}" requires revision. Feedback: ${reason}. Please review and resubmit.`
      : `Your submission for "${questionTitle}" requires revision. Please check the feedback and resubmit.`;

    return this.createNotification({
      user_uid: userUid,
      type: 'rejection',
      title: '📝 Submission Needs Revision',
      message,
      date: new Date().toISOString(),
      read: false,
      submission_id: submissionId,
      action_required: true,
      priority: 'high',
      category: 'feedback'
    });
  },

  // Question answered notification
  async createQuestionAnsweredNotification(
    userUid: string,
    questionId: string,
    questionPreview: string,
    adminName: string
  ): Promise<string> {
    return this.createNotification({
      user_uid: userUid,
      type: 'question_answered',
      title: '💬 Your Question Has Been Answered',
      message: `${adminName} has answered your question: "${questionPreview}...". Check it out!`,
      date: new Date().toISOString(),
      read: false,
      question_id: questionId,
      priority: 'medium',
      category: 'support'
    });
  },

  // System maintenance notification
  async createMaintenanceNotification(
    title: string,
    message: string,
    startTime: string,
    endTime: string,
    userUids?: string[]
  ): Promise<string[]> {
    try {
      const notificationData = {
        type: 'maintenance' as const,
        title: `🔧 ${title}`,
        message: `${message} Scheduled: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}`,
        date: new Date().toISOString(),
        read: false,
        priority: 'high' as const,
        category: 'system',
        expires_at: endTime,
        data: { startTime, endTime }
      };

      // If specific users provided, notify them; otherwise this would be a broadcast
      if (userUids && userUids.length > 0) {
        const promises = userUids.map(uid => 
          this.createNotification({ ...notificationData, user_uid: uid })
        );
        return Promise.all(promises);
      }

      // For broadcast notifications, you'd need a different approach
      // This is a simplified version
      return [];
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Create violation notification with detailed info
  async createViolationNotification(
    userUid: string, 
    violationType: string, 
    details: string,
    severity: 'warning' | 'minor' | 'major' | 'critical'
  ): Promise<string> {
    const priorityMap = {
      warning: 'low',
      minor: 'medium',
      major: 'high',
      critical: 'urgent'
    };

    return this.createNotification({
      user_uid: userUid,
      type: 'violation',
      title: `⚠️ ${severity.toUpperCase()} Rule Violation`,
      message: `Violation Type: ${violationType}. Details: ${details}. Please review the platform guidelines.`,
      date: new Date().toISOString(),
      read: false,
      action_required: severity !== 'warning',
      priority: priorityMap[severity] as any,
      category: 'violation',
      data: { violationType, severity, details }
    });
  },

  // Clean up expired notifications
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const now = new Date().toISOString();
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('expires_at', '<=', now)
      );
      
      const expiredSnapshot = await getDocs(q);
      const deletePromises = expiredSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      return expiredSnapshot.size;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      return 0;
    }
  },

  // Bulk create notifications for multiple users
  async bulkCreateNotifications(
    userUids: string[],
    notificationData: Omit<Notification, 'id' | 'user_uid' | 'created_at' | 'auto_generated'>
  ): Promise<string[]> {
    try {
      const promises = userUids.map(userUid =>
        this.createNotification({ ...notificationData, user_uid: userUid })
      );
      
      return Promise.all(promises);
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  }
};
