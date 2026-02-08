# 🤖 Automated Database Setup

Easy one-command database configuration wizard!

## Quick Start

```bash
npm run setup:db
```

## What This Script Does

✅ **Option 1: Test Current Credentials**
- Checks if your current `.env.local` MongoDB URI works
- Validates the connection to Atlas
- Shows you exactly what's wrong if it fails

✅ **Option 2: Update Credentials Manually**
- Interactive prompts to enter new MongoDB username/password
- Automatically tests the new credentials
- Updates `.env.local` if successful

✅ **Option 3: Create Brand New User**
- Guides you through creating a new MongoDB Atlas user
- Provides step-by-step instructions for MongoDB Atlas web panel
- Tests the connection automatically
- Updates `.env.local` when ready

## Usage Examples

### Test Your Current Setup
```bash
npm run setup:db
# Choose option 1
```

### Update with Existing Credentials
```bash
npm run setup:db
# Choose option 2
# Enter: username, password, cluster URL
```

### Create a New User
```bash
npm run setup:db
# Choose option 3
# Follow prompts to create creatorly_user in Atlas
```

## After Setup

Once the script confirms success:

```bash
# Start development server
npm run dev

# Test registration API
npm run test:registration
```

Then visit: **http://localhost:3002/auth/register**

## What the Script Tests

When you enter credentials, it:
1. Builds the MongoDB URI
2. Attempts a real connection to your Atlas cluster
3. Tests TLS/SSL security
4. Validates authentication
5. Shows detailed error messages if anything fails
6. Automatically updates `.env.local` on success

## Color-Coded Output

- 🟢 **Green** = Success / Action completed
- 🔴 **Red** = Error / Action failed
- 🟡 **Yellow** = Warning / Important info
- 🔵 **Blue** = Information / Prompts

## Troubleshooting

**"Connection timeout"**
- Make sure your IP is whitelisted in MongoDB Atlas
- Go to: Network Access → Add your IP

**"Authentication failed"**
- Double-check username and password
- Make sure user is active (not disabled) in Atlas
- Try resetting the password in Database Access

**"Cannot find module mongoose"**
- First run: `npm install`
- Then try again: `npm run setup:db`

## MongoDB Atlas Quick Links

- **Database Access**: https://cloud.mongodb.com/v2 → Database Access
- **Network Access**: https://cloud.mongodb.com/v2 → Network Access
- **Connection Strings**: Click "Connect" on your cluster

## What Gets Updated

The script only modifies:
- `.env.local` (one line: MONGODB_URI)
- Creates temporary test file (auto-deleted)

Your code stays untouched.

---

**🎯 Recommended Flow:**

1. Create new user in MongoDB Atlas (free tier works great)
2. Run: `npm run setup:db`
3. Choose option 3
4. Follow prompts
5. Script tests automatically
6. Done! ✅

---

**Advanced:**

To use a specific MongoDB user you already have:
1. Run: `npm run setup:db`
2. Choose option 2
3. Enter existing username
4. Enter password
5. Enter cluster URL
6. Let it test and update

Enjoy! 🚀
