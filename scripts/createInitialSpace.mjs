/**
 * Script to create the initial space in Firestore
 * Uses service account authentication via GOOGLE_APPLICATION_CREDENTIALS
 *
 * Run with: node scripts/createInitialSpace.mjs
 *
 * If this fails, you can manually create the space in Firebase Console:
 * 1. Go to https://console.firebase.google.com/project/memora-001/firestore
 * 2. Click "Start collection" or add document to "spaces" collection
 * 3. Use document ID: 1234567
 * 4. Add the fields shown below
 */

import { execSync } from 'child_process';

// Space data to create
const spaceData = {
  spaceId: "1234567",
  name: "Gokaraju Rangaraju Institute of Engineering and Technology",
  type: "college",
  settings: {
    yearOptions: [
      "1st Year",
      "2nd Year",
      "3rd Year",
      "4th Year",
      "Graduated"
    ],
    branchOptions: [
      "Computer Science and Engineering",
      "Computer Science and Engineering (AIML)",
      "Computer Science and Engineering (DS)",
      "Computer Science and Business Systems",
      "Electronics and Communication Engineering",
      "Electronics and Electrical Engineering",
      "Mechanical Engineering",
      "Civil Engineering"
    ]
  }
};

console.log('='.repeat(60));
console.log('INITIAL SPACE DATA FOR FIRESTORE');
console.log('='.repeat(60));
console.log('\nCollection: spaces');
console.log('Document ID: 1234567');
console.log('\nDocument Data:');
console.log(JSON.stringify(spaceData, null, 2));
console.log('\n' + '='.repeat(60));
console.log('MANUAL CREATION INSTRUCTIONS');
console.log('='.repeat(60));
console.log(`
To create this space manually:

1. Open Firebase Console:
   https://console.firebase.google.com/project/memora-001/firestore

2. Click "Start collection" (or "+ Start collection")

3. Enter Collection ID: spaces

4. Enter Document ID: 1234567

5. Add the following fields:
   - spaceId (string): "1234567"
   - name (string): "Gokaraju Rangaraju Institute of Engineering and Technology"
   - type (string): "college"
   - createdAt (timestamp): [click timestamp and select current time]
   - settings (map):
     - yearOptions (array): ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduated"]
     - branchOptions (array): [all 8 branch names as shown above]

6. Click "Save"

The space will then be available for users to join with ID: 1234567
`);

// Try to open the Firebase Console
try {
  const platform = process.platform;
  const url = 'https://console.firebase.google.com/project/memora-001/firestore/databases/-default-/data';

  if (platform === 'darwin') {
    console.log('Opening Firebase Console...');
    execSync(`open "${url}"`);
  } else if (platform === 'win32') {
    execSync(`start "${url}"`);
  } else {
    console.log(`Open this URL: ${url}`);
  }
} catch (e) {
  console.log('Could not open browser automatically.');
}
