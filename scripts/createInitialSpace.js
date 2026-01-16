/**
 * Script to create the initial space in Firestore using Admin SDK
 *
 * Run with: node scripts/createInitialSpace.js
 */

const admin = require('firebase-admin');

// Initialize with default credentials (uses gcloud auth)
admin.initializeApp({
  projectId: 'memora-001'
});

const db = admin.firestore();

// Initial space data
const spaceData = {
  spaceId: "1234567",
  name: "Gokaraju Rangaraju Institute of Engineering and Technology",
  type: "college",
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
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

async function createInitialSpace() {
  try {
    console.log('Creating initial space...');

    await db.collection('spaces').doc(spaceData.spaceId).set(spaceData);

    console.log(`\nSpace created successfully!`);
    console.log(`Space ID: ${spaceData.spaceId}`);
    console.log(`Space Name: ${spaceData.name}`);
    console.log(`\nYou can verify this in Firebase Console:`);
    console.log(`https://console.firebase.google.com/project/memora-001/firestore/data/~2Fspaces~2F${spaceData.spaceId}`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating space:', error);
    process.exit(1);
  }
}

createInitialSpace();
