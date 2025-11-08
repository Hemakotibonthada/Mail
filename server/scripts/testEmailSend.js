import { EmailService } from '../services/emailService.js';
import { auth, db } from '../config/firebase.js';
import { COLLECTIONS } from '../models/collections.js';

const testEmailForUser = async (userEmail) => {
  try {
    console.log(`\n🧪 Testing email send for: ${userEmail}`);
    console.log('='.repeat(60));

    // Get user by email
    const userRecord = await auth.getUserByEmail(userEmail);
    console.log(`✅ Found Firebase Auth user: ${userRecord.uid}`);

    // Check Firestore user document
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).get();
    const userData = userDoc.data();

    if (!userData) {
      console.log('⚠️  User not in Firestore, will be created automatically');
    } else {
      console.log(`✅ Firestore document exists`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Domain: ${userData.domain || 'not set'}`);
      console.log(`   Active: ${userData.isActive}`);
    }

    // Prepare test email data
    const emailData = {
      to: [{ email: 'hemakotibonthada@gmail.com', name: 'Test Recipient' }],
      cc: [],
      bcc: [],
      subject: `Test Email from ${userEmail}`,
      body: `<h2>Test Email</h2><p>This is a test email sent from <strong>${userEmail}</strong></p><p>Sent at: ${new Date().toLocaleString()}</p>`,
      plainText: `Test email from ${userEmail}. Sent at: ${new Date().toLocaleString()}`,
      attachments: []
    };

    console.log(`\n📧 Attempting to send email...`);
    console.log(`   From: ${userEmail}`);
    console.log(`   To: hemakotibonthada@gmail.com`);

    // Create email service instance
    const emailService = new EmailService();

    // Try to send
    const result = await emailService.sendEmail(emailData, userRecord.uid);

    console.log(`\n✅ SUCCESS! Email sent successfully`);
    console.log(`   Stored Email ID: ${result.id}`);
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`\n✉️  Check hemakotibonthada@gmail.com inbox for the test email!`);

  } catch (error) {
    console.error(`\n❌ FAILED to send email:`);
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('SMTP not configured')) {
      console.error(`\n💡 Solution: Configure SMTP credentials for this domain in .env file`);
      console.error(`   See DOMAIN_SMTP_SETUP.md for instructions`);
    }
  }
};

// Get email from command line argument
const testEmail = process.argv[2];

if (!testEmail) {
  console.log('Usage: node testEmailSend.js <user-email>');
  console.log('\nExamples:');
  console.log('  node testEmailSend.js hema@htresearchlab.com');
  console.log('  node testEmailSend.js hemakoti@ai.com');
  console.log('  node testEmailSend.js admin@circuvent.com');
  process.exit(1);
}

testEmailForUser(testEmail)
  .then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
