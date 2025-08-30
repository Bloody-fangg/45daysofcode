import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

export interface RegistrationSettings {
  enabled: boolean;
  maxUsers: number;
  requireApproval: boolean;
  restrictionMessage: string;
  lastUpdated?: any;
  updatedBy?: string;
}

const REGISTRATION_DOC_ID = 'registration_settings';

class RegistrationService {
  private getRegistrationDocRef() {
    return doc(db, 'system_settings', REGISTRATION_DOC_ID);
  }

  async getRegistrationSettings(): Promise<RegistrationSettings | null> {
    try {
      const docRef = this.getRegistrationDocRef();
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as RegistrationSettings;
      }
      
      // Return default settings if none exist
      const defaultSettings: RegistrationSettings = {
        enabled: true,
        maxUsers: 500,
        requireApproval: false,
        restrictionMessage: 'Registration is currently closed.',
        lastUpdated: serverTimestamp()
      };
      
      // Create default settings
      await setDoc(docRef, defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('Error fetching registration settings:', error);
      throw error;
    }
  }

  async updateRegistrationSettings(
    settings: Partial<RegistrationSettings>, 
    updatedBy?: string
  ): Promise<void> {
    try {
      const docRef = this.getRegistrationDocRef();
      
      // First check if document exists
      const docSnap = await getDoc(docRef);
      
      const updateData = {
        ...settings,
        lastUpdated: serverTimestamp(),
        updatedBy: updatedBy || 'admin'
      };
      
      if (docSnap.exists()) {
        await updateDoc(docRef, updateData);
      } else {
        // Document doesn't exist, create it with defaults
        const defaultSettings: RegistrationSettings = {
          enabled: true,
          maxUsers: 500,
          requireApproval: false,
          restrictionMessage: 'Registration is currently closed.',
          ...updateData
        };
        await setDoc(docRef, defaultSettings);
      }
    } catch (error) {
      console.error('Error updating registration settings:', error);
      throw error;
    }
  }

  async toggleRegistration(enabled: boolean, updatedBy?: string): Promise<void> {
    try {
      console.log('Registration service: toggling to', enabled);
      
      const docRef = this.getRegistrationDocRef();
      
      // Get current settings or create with defaults
      let currentSettings: RegistrationSettings;
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          currentSettings = docSnap.data() as RegistrationSettings;
        } else {
          currentSettings = {
            enabled: true,
            maxUsers: 500,
            requireApproval: false,
            restrictionMessage: 'Registration is currently closed.'
          };
        }
      } catch (error) {
        console.error('Error getting current settings:', error);
        currentSettings = {
          enabled: true,
          maxUsers: 500,
          requireApproval: false,
          restrictionMessage: 'Registration is currently closed.'
        };
      }
      
      // Update with new enabled status
      const updatedSettings: RegistrationSettings = {
        ...currentSettings,
        enabled,
        lastUpdated: serverTimestamp(),
        updatedBy: updatedBy || 'admin'
      };
      
      // Use setDoc to ensure the document is created/updated
      await setDoc(docRef, updatedSettings);
      console.log('Registration service: toggle successful');
    } catch (error) {
      console.error('Error toggling registration:', error);
      throw error;
    }
  }

  async setMaxUsers(maxUsers: number, updatedBy?: string): Promise<void> {
    try {
      await this.updateRegistrationSettings({ maxUsers }, updatedBy);
    } catch (error) {
      console.error('Error setting max users:', error);
      throw error;
    }
  }

  async setRequireApproval(requireApproval: boolean, updatedBy?: string): Promise<void> {
    try {
      await this.updateRegistrationSettings({ requireApproval }, updatedBy);
    } catch (error) {
      console.error('Error setting approval requirement:', error);
      throw error;
    }
  }

  async setRestrictionMessage(restrictionMessage: string, updatedBy?: string): Promise<void> {
    try {
      await this.updateRegistrationSettings({ restrictionMessage }, updatedBy);
    } catch (error) {
      console.error('Error setting restriction message:', error);
      throw error;
    }
  }

  // Check if registration is currently allowed
  async canRegister(currentUserCount: number): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const settings = await this.getRegistrationSettings();
      
      if (!settings) {
        return { allowed: false, reason: 'Registration settings not found' };
      }

      if (!settings.enabled) {
        return { allowed: false, reason: settings.restrictionMessage };
      }

      if (currentUserCount >= settings.maxUsers) {
        return { allowed: false, reason: 'Maximum user limit reached' };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking registration permission:', error);
      return { allowed: false, reason: 'Error checking registration status' };
    }
  }
}

export const registrationService = new RegistrationService();
export default registrationService;
