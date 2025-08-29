// Account creation utility - Run this in browser console if needed
// This can help create the admin account manually

const createAdminAccount = async () => {
  const email = 'amiarchive79.in@gmail.com';
  const password = '123456789';
  
  try {
    // Import Firebase functions
    const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
    const { getFirestore, doc, setDoc } = await import('firebase/firestore');
    
    const auth = getAuth();
    const db = getFirestore();
    
    console.log('Creating admin account...');
    
    // Create user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User created:', user.uid);
    
    // Create user document in Firestore
    const userData = {
      uid: user.uid,
      email: user.email,
      name: 'Admin User',
      enrollment_no: 'ADMIN001',
      course: 'Administration',
      section: 'A',
      semester: '1',
      github_repo_link: '',
      streak_count: 0,
      streak_breaks: 0,
      disqualified: false,
      attempts: { easy: 0, medium: 0, hard: 0, choice: 0 },
      calendar: {},
      last_submission: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isAdmin: true
    };
    
    await setDoc(doc(db, 'users', user.uid), userData);
    
    console.log('Admin account created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    
    return { success: true, uid: user.uid };
    
  } catch (error) {
    console.error('Error creating admin account:', error);
    return { success: false, error: error.message };
  }
};

// To run this function, copy and paste into browser console:
// createAdminAccount().then(result => console.log('Result:', result));

export { createAdminAccount };
