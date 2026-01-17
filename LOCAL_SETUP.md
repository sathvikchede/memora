# Local Development Setup

## Prerequisites
- Node.js installed
- Firebase project created (memora-001)

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start local server**:
   ```bash
   npm run dev
   ```

3. **Open browser**:
   - Go to http://localhost:9002
   - App connects to real Firebase project automatically

4. **Test the flow**:
   - Sign in with Google (real OAuth)
   - Enter space ID: `1234567` (GRIET)
   - Verify with your student email (@grietcollege.com)
   - Complete your profile

## Firebase Project

Currently using: **memora-001**

- Firebase Console: https://console.firebase.google.com/project/memora-001

## Important: Setup GRIET Space

Before testing, ensure the GRIET space exists in Firestore. Run this script:

```bash
npx tsx scripts/setup-griet-space.ts
```

This creates the space with ID `1234567` and email verification for `@grietcollege.com`.

## Environment Variables

The `.env` file contains:
- Firebase configuration (API keys, project ID)
- Email credentials for OTP verification

**Never commit `.env` to git!**

## Cleaning Test Data

Test data goes to real Firestore. Clean up in Firebase Console:
1. Go to https://console.firebase.google.com/project/memora-001
2. Navigate to Firestore Database
3. Delete test documents as needed:
   - `users/{userId}` - Test user profiles
   - `spaces/1234567/members/{userId}` - Test memberships
   - `emailVerifications/{id}` - Test OTP records

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (port 9002) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run linter |
| `npm run typecheck` | TypeScript type checking |

## Data Flow

1. **Google Sign-in** → Creates user in Firebase Auth
2. **Name Collection** → Creates `/users/{userId}` in Firestore
3. **Space ID Entry** → Reads `/spaces/1234567` to verify
4. **Email Verification** → Creates `/emailVerifications/{userId}_1234567` with OTP
5. **Profile Completion** → Creates `/spaces/1234567/members/{userId}`

## Troubleshooting

### "Space not found" error
Run the setup script to create the GRIET space:
```bash
npx tsx scripts/setup-griet-space.ts
```

### Google Sign-in not working
1. Check Firebase Console > Authentication > Sign-in method
2. Ensure Google provider is enabled
3. Add `localhost:9002` to authorized domains

### OTP email not sending
1. Check EMAIL_USER and EMAIL_APP_PASSWORD in `.env`
2. Ensure Gmail App Password is set up correctly
3. Check server console for errors
