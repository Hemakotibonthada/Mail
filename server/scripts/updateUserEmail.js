import { auth, db } from '../config/firebase.js';
import { COLLECTIONS } from '../models/collections.js';

const updateUserEmail = async () => {
  try {
    const oldEmail = 'hemakoti@circuvent.com';
    const newEmail = 'hema@htresearchlab.com';
    
    // Get user by old email
    let user;
    try {
      user = await auth.getUserByEmail(oldEmail);
    } catch (error) {
      console.log(`User with ${oldEmail} not found in Firebase Auth`);
      // Try to find by new email
      user = await auth.getUserByEmail(newEmail);
      console.log(`Found user with ${newEmail} instead`);
    }
    
    console.log(`Found user UID: ${user.uid}`);
    
    // Update Firestore document
    const userRef = db.collection(COLLECTIONS.USERS).doc(user.uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      await userRef.update({
        email: newEmail,
        domain: 'htresearchlab.com',
        updatedAt: new Date()
      });
      console.log(`✅ Firestore document updated for ${newEmail}`);
    } else {
      console.log('⚠️ User document not found in Firestore');
    }
    
    console.log('✅ User email domain updated successfully');
    console.log('Please sign out and sign in again for changes to take effect.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user email:', error.message);
    process.exit(1);
  }
};

updateUserEmail();
