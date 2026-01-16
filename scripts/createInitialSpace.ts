/**
 * Script to create the initial space in Firestore
 *
 * Run with: npx ts-node scripts/createInitialSpace.ts
 * Or: npx tsx scripts/createInitialSpace.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase config for memora-001
const firebaseConfig = {
  apiKey: "AIzaSyA3OfbZVarqpkm8han7qLzn5Q3jr5T5AJI",
  authDomain: "memora-001.firebaseapp.com",
  projectId: "memora-001",
  storageBucket: "memora-001.firebasestorage.app",
  messagingSenderId: "104760912132",
  appId: "1:104760912132:web:ece40e44b145639ebac851"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initial space data
const spaceData = {
  spaceId: "1234567",
  name: "Gokaraju Rangaraju Institute of Engineering and Technology",
  type: "college",
  createdAt: serverTimestamp(),
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

    await setDoc(doc(db, "spaces", spaceData.spaceId), spaceData);

    console.log(`Space created successfully!`);
    console.log(`Space ID: ${spaceData.spaceId}`);
    console.log(`Space Name: ${spaceData.name}`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating space:', error);
    process.exit(1);
  }
}

createInitialSpace();
