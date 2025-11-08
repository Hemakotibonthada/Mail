import { auth } from '../config/firebase.js';

const setAdminRole = async () => {
  try {
    const email = 'hema@htresearchlab.com';
    
    // Get user by email
    const user = await auth.getUserByEmail(email);
    
    // Set custom claims
    await auth.setCustomUserClaims(user.uid, { role: 'admin' });
    
    console.log(`✅ Admin role set for ${email} (UID: ${user.uid})`);
    console.log('User needs to sign out and sign in again for changes to take effect.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting admin role:', error.message);
    process.exit(1);
  }
};

setAdminRole();
