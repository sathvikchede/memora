# Email Verification Setup Guide

This guide explains how to set up email verification for spaces (like GRIET college) in Memora AI.

## Overview

Email verification ensures that only users with verified institutional emails can join specific spaces. This is particularly useful for college/university spaces to ensure only enrolled students can access the community.

---

## Part 1: Email Service Configuration

### Step 1: Set Up Gmail for Sending Verification Emails

1. **Create or use an existing Gmail account** for sending verification emails
   - Recommended: Create a dedicated account like `memora-verify@gmail.com`

2. **Enable 2-Step Verification**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click on **2-Step Verification**
   - Follow the steps to enable it

3. **Generate an App Password**
   - After enabling 2-Step Verification, go back to Security settings
   - Scroll down to **App passwords**
   - Click **App passwords**
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Enter: "Memora AI"
   - Click **Generate**
   - **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

4. **Update your `.env` file**

   ```bash
   EMAIL_USER=your-gmail-address@gmail.com
   EMAIL_APP_PASSWORD=your-16-char-app-password
   ```

   **Example:**
   ```bash
   EMAIL_USER=memora-verify@gmail.com
   EMAIL_APP_PASSWORD=abcd efgh ijkl mnop
   ```

   ⚠️ **Important:** Remove spaces from the app password in the .env file

---

## Part 2: Firestore Space Configuration

You have two options to configure the GRIET space in Firestore.

### Option A: Using Firebase Console (Recommended for beginners)

1. **Open Firebase Console**
   - Go to [https://console.firebase.google.com](https://console.firebase.google.com)
   - Select project: **memora-001**

2. **Navigate to Firestore**
   - Left sidebar → **Firestore Database**

3. **Create/Edit the Space Document**

   - Collection: `spaces`
   - Document ID: `1234567`

   Add these fields:

   ```
   spaceId: "1234567"
   name: "Gokaraju Rangaraju Institute of Engineering and Technology"
   type: "college"
   createdAt: [Current Timestamp]

   settings: {
     yearOptions: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
     branchOptions: [
       "Computer Science Engineering",
       "Information Technology",
       "Electronics and Communication Engineering",
       "Electrical and Electronics Engineering",
       "Mechanical Engineering",
       "Civil Engineering"
     ]
   }

   verification: {
     required: true,
     type: "email",
     emailPattern: "^[a-zA-Z0-9]+@grietcollege\\.com$",
     emailDomain: "grietcollege.com",
     verificationMessage: "Enter your college email (rollno@grietcollege.com) to verify you're a GRIET student"
   }
   ```

4. **Field Types in Firestore Console:**
   - `spaceId`, `name`, `type`: **string**
   - `createdAt`: **timestamp**
   - `settings`: **map**
     - `yearOptions`: **array** of strings
     - `branchOptions`: **array** of strings
   - `verification`: **map**
     - `required`: **boolean**
     - `type`: **string**
     - `emailPattern`: **string**
     - `emailDomain`: **string**
     - `verificationMessage`: **string**

### Option B: Using Setup Script (Recommended for developers)

1. **Install tsx globally** (if not already installed):
   ```bash
   npm install -g tsx
   ```

2. **Run the setup script:**
   ```bash
   npx tsx scripts/setup-griet-space.ts
   ```

3. **Verify in Firebase Console:**
   - Check that the space document was created correctly
   - Verify all fields are present

---

## Part 3: Understanding the Configuration Fields

### Verification Object Fields

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `required` | boolean | Enable/disable verification | `true` |
| `type` | string | Verification method | `"email"` |
| `emailPattern` | string | Regex to validate email format | `"^[a-zA-Z0-9]+@grietcollege\\.com$"` |
| `emailDomain` | string | Domain shown to users | `"grietcollege.com"` |
| `verificationMessage` | string | Custom message on verification screen | Custom text |

### Email Pattern Examples

For different email formats:

**GRIET College** (rollno@grietcollege.com):
```regex
^[a-zA-Z0-9]+@grietcollege\.com$
```

**General college format** (anything@college.edu):
```regex
^[a-zA-Z0-9._%+-]+@college\.edu$
```

**Subdomain format** (student@students.university.edu):
```regex
^[a-zA-Z0-9._%+-]+@students\.university\.edu$
```

**Multiple allowed domains:**
You would need to use alternation:
```regex
^[a-zA-Z0-9]+@(griet\.edu|grietcollege\.com)$
```

---

## Part 4: Testing the Email Verification Flow

### Test as a New User

1. **Sign in with Google**
   - Use a test Google account

2. **Enter Name**
   - Provide first and last name

3. **Enter Space ID**
   - Enter: `1234567`

4. **Email Verification Screen**
   - You should see: "Verify Your Email"
   - Message: "Enter your college email (rollno@grietcollege.com)..."

5. **Test Email Validation**

   ❌ **Should fail:**
   - `test@gmail.com` (wrong domain)
   - `student@griet.edu` (wrong domain)
   - `@grietcollege.com` (missing username)

   ✅ **Should succeed:**
   - `25241a66b9@grietcollege.com`
   - `22241a1234@grietcollege.com`
   - `student123@grietcollege.com`

6. **Receive OTP**
   - Check the entered email inbox
   - Should receive an email with 6-digit code
   - Code expires in 10 minutes

7. **Enter OTP**
   - Enter the 6-digit code
   - Click "Verify Email"

8. **Complete Profile**
   - After verification, proceed to profile setup
   - Select year and branch

### Test Email Delivery

To test that emails are being sent correctly:

```bash
# In the email verification screen, enter a test email
# Check these locations:
1. Inbox of the email address
2. Spam/Junk folder
3. Check terminal/logs for any errors
```

---

## Part 5: Troubleshooting

### Problem: Emails Not Sending

**Check:**
1. ✅ `.env` file has correct `EMAIL_USER` and `EMAIL_APP_PASSWORD`
2. ✅ App password has no spaces
3. ✅ 2-Step Verification is enabled on Gmail account
4. ✅ App password is still valid (doesn't expire, but can be revoked)

**Solution:**
- Regenerate app password
- Check server logs for SMTP errors
- Verify Gmail security settings

### Problem: Email Validation Failing

**Check:**
1. ✅ `emailPattern` in Firestore matches expected format
2. ✅ Regex pattern has proper escaping (`\\.` for dots)
3. ✅ Email domain matches exactly

**Solution:**
- Test regex pattern at [regex101.com](https://regex101.com)
- Verify Firestore `verification.emailPattern` field

### Problem: OTP Verification Failing

**Check:**
1. ✅ OTP was entered correctly (6 digits)
2. ✅ OTP hasn't expired (10 minute limit)
3. ✅ User is signed in with the same account

**Solution:**
- Click "Resend" to get a new code
- Check Firestore `emailVerifications` collection for the document

### Problem: Already Verified User

If a user has already verified their email for a space, they won't see the verification screen again. To reset:

1. Go to Firestore Console
2. Collection: `emailVerifications`
3. Find document: `{userId}_{spaceId}`
4. Delete the document OR set `verified: false`

---

## Part 6: Firestore Collections Created

The email verification system creates a new collection:

### Collection: `emailVerifications`

**Document ID Format:** `{userId}_{spaceId}`

**Document Structure:**
```javascript
{
  userId: "firebase-user-id",
  spaceId: "1234567",
  email: "25241a66b9@grietcollege.com",
  otp: "123456",
  createdAt: Timestamp,
  expiresAt: Timestamp,  // 10 minutes from createdAt
  verified: false        // true after successful verification
}
```

**Security Rules Needed:**

Add these to your Firestore rules:

```javascript
match /emailVerifications/{verificationId} {
  // Only the user who created it can read
  allow read: if request.auth != null &&
                 resource.data.userId == request.auth.uid;

  // Only authenticated users can create
  allow create: if request.auth != null;

  // Only the user who created it can update
  allow update: if request.auth != null &&
                   resource.data.userId == request.auth.uid;

  // Nobody can delete (admin only via console)
  allow delete: if false;
}
```

---

## Part 7: Adding More Spaces with Verification

To add verification to other spaces:

1. **Get the Space ID** (e.g., `2345678`)

2. **Determine the email pattern**
   - Example: `@university.edu`
   - Regex: `^[a-zA-Z0-9._%+-]+@university\.edu$`

3. **Update the space document in Firestore:**

   ```javascript
   {
     // ... other fields
     verification: {
       required: true,
       type: "email",
       emailPattern: "^[a-zA-Z0-9._%+-]+@university\\.edu$",
       emailDomain: "university.edu",
       verificationMessage: "Enter your university email to verify"
     }
   }
   ```

4. **Test with a valid email** from that domain

---

## Part 8: Disabling Verification for a Space

To disable verification:

**Option 1: Remove the field**
- Delete the `verification` field from the space document

**Option 2: Set required to false**
```javascript
{
  verification: {
    required: false,
    type: "none"
  }
}
```

---

## Security Considerations

1. **OTP Storage:** OTPs are stored in Firestore but expire after 10 minutes
2. **Rate Limiting:** Consider adding rate limiting to prevent spam
3. **Email Privacy:** Verified emails are stored but not shared with other users
4. **App Password Security:** Keep your app password in `.env` and never commit to git
5. **Firestore Rules:** Ensure proper security rules are set (see Part 6)

---

## Email Template Customization

To customize the verification email template, edit:

**File:** `src/ai/flows/send-verification-email.ts`

**Sections to customize:**
- Email subject line
- HTML content (colors, layout, branding)
- Plain text fallback
- Footer text

---

## Support

If you encounter issues:

1. Check Firestore Console for the space configuration
2. Verify `.env` file has correct credentials
3. Check server logs for errors
4. Test email delivery manually
5. Verify Firestore security rules

For GRIET-specific issues, contact: [your-support-email]

---

## Quick Reference

**Space ID:** `1234567`
**Email Pattern:** `^[a-zA-Z0-9]+@grietcollege\.com$`
**Email Domain:** `grietcollege.com`
**OTP Expiry:** 10 minutes
**Resend Cooldown:** 60 seconds
