require('dotenv').config();
const { connectMongo } = require('../config/mongodb');
const User = require('../models/User');

async function main() {
  const emailArg = process.argv[2];
  if (!emailArg) {
    console.error('Usage: node src/scripts/makeAdmin.js <email>');
    process.exit(1);
  }

  const email = emailArg.toLowerCase().trim();

  await connectMongo();

  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        role: 'admin',
        account_status: 'active',
        password_reset_required: false,
      },
    },
    { new: true }
  );

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  console.log(`Promoted ${email} to admin`);
  process.exit(0);
}

main().catch((error) => {
  console.error('Failed to promote user to admin:', error);
  process.exit(1);
});
