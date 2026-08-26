const { hashPassword } = require("../server/auth");

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run hash-password -- \"your-password\"");
  process.exit(1);
}

try {
  console.log(hashPassword(password));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
