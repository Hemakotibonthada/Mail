import { db, auth } from '../config/firebase.js';
import { COLLECTIONS } from '../models/collections.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const migrateUsers = async () => {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  User Domain Migration to htresearchlab.com              ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Get all users from Firestore
    const usersSnapshot = await db.collection(COLLECTIONS.USERS).get();
    const usersToMigrate = [];

    console.log('📋 Current Users:\n');
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const domain = data.email?.split('@')[1];
      
      if (domain && domain !== 'htresearchlab.com' && !data.email?.includes('gmail.com') && !data.email?.includes('example.com')) {
        usersToMigrate.push({
          uid: doc.id,
          oldEmail: data.email,
          newEmail: data.email.split('@')[0] + '@htresearchlab.com',
          domain: domain
        });
        console.log(`  ⚠️  ${data.email} → ${data.email.split('@')[0]}@htresearchlab.com`);
      } else {
        console.log(`  ✓  ${data.email} (no change needed)`);
      }
    });

    if (usersToMigrate.length === 0) {
      console.log('\n✅ No users need migration. All users are already using htresearchlab.com or external domains.\n');
      rl.close();
      return;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Users to migrate: ${usersToMigrate.length}`);
    console.log(`   Action: Change email domain to htresearchlab.com`);
    console.log(`\n⚠️  IMPORTANT NOTES:`);
    console.log(`   1. Users will need to sign in again with new email`);
    console.log(`   2. You must create these email accounts in GoDaddy:`);
    usersToMigrate.forEach(u => console.log(`      - ${u.newEmail}`));
    console.log(`   3. This will update Firestore only (Firebase Auth emails cannot be changed)`);
    console.log(`   4. Consider creating new Firebase Auth users for new emails\n`);

    const answer = await question('❓ Do you want to proceed? (yes/no): ');

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Migration cancelled.\n');
      rl.close();
      return;
    }

    console.log('\n🔄 Starting migration...\n');

    for (const user of usersToMigrate) {
      try {
        // Update Firestore document
        await db.collection(COLLECTIONS.USERS).doc(user.uid).update({
          email: user.newEmail,
          domain: 'htresearchlab.com',
          oldEmail: user.oldEmail, // Keep track of old email
          migratedAt: new Date().toISOString()
        });

        console.log(`  ✅ Updated: ${user.oldEmail} → ${user.newEmail}`);
      } catch (error) {
        console.log(`  ❌ Failed: ${user.oldEmail} - ${error.message}`);
      }
    }

    console.log('\n✅ Migration completed!\n');
    console.log('📝 NEXT STEPS:');
    console.log('   1. Go to GoDaddy Email Management');
    console.log('   2. Create these email accounts:');
    usersToMigrate.forEach(u => console.log(`      - ${u.newEmail}`));
    console.log('   3. Set passwords for each account');
    console.log('   4. Users should sign in with new email addresses');
    console.log('\n💡 TIP: You can test each user with:');
    console.log('   node scripts/testEmailSend.js <new-email>\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    rl.close();
  }
};

// Alternative: List users by domain without migration
const listUsersByDomain = async () => {
  try {
    console.log('\n📊 Users by Domain:\n');

    const usersSnapshot = await db.collection(COLLECTIONS.USERS).get();
    const domainMap = {};

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const domain = data.email?.split('@')[1] || 'unknown';
      
      if (!domainMap[domain]) {
        domainMap[domain] = [];
      }
      domainMap[domain].push(data.email);
    });

    Object.keys(domainMap).sort().forEach(domain => {
      console.log(`\n${domain}:`);
      domainMap[domain].forEach(email => {
        console.log(`  - ${email}`);
      });
    });

    console.log('\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Check command line argument
const command = process.argv[2];

if (command === '--list' || command === '-l') {
  listUsersByDomain().then(() => process.exit(0));
} else if (command === '--help' || command === '-h') {
  console.log('\nUsage:');
  console.log('  node migrateUsersToHtresearchlab.js           # Migrate users');
  console.log('  node migrateUsersToHtresearchlab.js --list    # List users by domain');
  console.log('  node migrateUsersToHtresearchlab.js --help    # Show this help\n');
  process.exit(0);
} else {
  migrateUsers().then(() => process.exit(0));
}
