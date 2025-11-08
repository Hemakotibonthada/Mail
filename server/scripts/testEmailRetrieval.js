import { db } from '../config/firebase.js';
import { COLLECTIONS } from '../models/collections.js';

async function testEmailRetrieval() {
  try {
    console.log('🔍 Testing email retrieval...\n');

    // Get all emails
    const allEmailsSnapshot = await db.collection(COLLECTIONS.EMAILS).get();
    console.log(`📊 Total emails in database: ${allEmailsSnapshot.size}`);

    if (allEmailsSnapshot.size === 0) {
      console.log('⚠️  No emails found in database!');
      return;
    }

    // Group by user and folder
    const emailsByUser = {};
    allEmailsSnapshot.forEach(doc => {
      const data = doc.data();
      const userId = data.userId || 'unknown';
      const folder = data.folder || 'unknown';
      
      if (!emailsByUser[userId]) {
        emailsByUser[userId] = {};
      }
      if (!emailsByUser[userId][folder]) {
        emailsByUser[userId][folder] = [];
      }
      
      emailsByUser[userId][folder].push({
        id: doc.id,
        subject: data.subject,
        from: data.from?.email || 'unknown',
        to: data.to?.map(t => t.email).join(', ') || 'unknown',
        folder: data.folder,
        createdAt: data.createdAt?.toDate?.() || 'unknown'
      });
    });

    // Display results
    console.log('\n📧 Emails by User and Folder:\n');
    for (const [userId, folders] of Object.entries(emailsByUser)) {
      console.log(`👤 User: ${userId}`);
      for (const [folder, emails] of Object.entries(folders)) {
        console.log(`  📁 ${folder}: ${emails.length} email(s)`);
        emails.forEach(email => {
          console.log(`    - ${email.subject || '(No Subject)'}`);
          console.log(`      From: ${email.from} → To: ${email.to}`);
          console.log(`      Created: ${email.createdAt}`);
        });
      }
      console.log('');
    }

    // Test query with userId and folder
    console.log('\n🧪 Testing query with userId and folder...');
    const firstUserId = Object.keys(emailsByUser)[0];
    const firstFolder = Object.keys(emailsByUser[firstUserId])[0];
    
    console.log(`Testing: userId=${firstUserId}, folder=${firstFolder}`);
    
    const testSnapshot = await db.collection(COLLECTIONS.EMAILS)
      .where('userId', '==', firstUserId)
      .where('folder', '==', firstFolder)
      .limit(10)
      .get();
    
    console.log(`✅ Query returned ${testSnapshot.size} email(s)`);

    // Test with ordering
    console.log('\n🧪 Testing query with ordering...');
    try {
      const orderedSnapshot = await db.collection(COLLECTIONS.EMAILS)
        .where('userId', '==', firstUserId)
        .where('folder', '==', firstFolder)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      
      console.log(`✅ Ordered query returned ${orderedSnapshot.size} email(s)`);
    } catch (orderError) {
      console.error('❌ Ordered query failed:', orderError.message);
      if (orderError.message.includes('index')) {
        console.log('\n⚠️  FIRESTORE INDEX REQUIRED!');
        console.log('Please create the composite index using the link in the error message.');
        console.log('Or use the firestore.indexes.json file in the server directory.');
      }
    }

  } catch (error) {
    console.error('❌ Error testing email retrieval:', error);
    console.error('Error details:', error.message);
  } finally {
    process.exit(0);
  }
}

testEmailRetrieval();
