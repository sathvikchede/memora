/**
 * Script to set up the GRIET space in Firestore
 *
 * Run with: npx tsx scripts/setup-griet-space.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

async function setupGRIETSpace() {
  console.log('Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);

  console.log('Setting up GRIET space (ID: 1234567)...');

  const spaceRef = doc(firestore, 'spaces', '1234567');

  const spaceData = {
    spaceId: '1234567',
    name: 'Gokaraju Rangaraju Institute of Engineering and Technology',
    type: 'college',
    createdAt: serverTimestamp(),
    settings: {
      yearOptions: [
        '1st Year',
        '2nd Year',
        '3rd Year',
        '4th Year'
      ],
      branchOptions: [
        'Computer Science Engineering',
        'Information Technology',
        'Electronics and Communication Engineering',
        'Electrical and Electronics Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Artificial Intelligence and Machine Learning',
        'Data Science',
        'Cyber Security'
      ]
    },
    verification: {
      required: true,
      type: 'email',
      emailPattern: '^[a-zA-Z0-9]+@grietcollege\\.com$',
      emailDomain: 'grietcollege.com',
      verificationMessage: 'Enter your college email (rollno@grietcollege.com) to verify you\'re a GRIET student'
    }
  };

  await setDoc(spaceRef, spaceData, { merge: true });

  console.log('✅ GRIET space setup complete!');
  console.log('\nSpace Configuration:');
  console.log('- Space ID: 1234567');
  console.log('- Name:', spaceData.name);
  console.log('- Email verification: Enabled');
  console.log('- Accepted email pattern:', spaceData.verification.emailPattern);
  console.log('- Email domain:', spaceData.verification.emailDomain);
  console.log('\nStudents will need to verify with their @grietcollege.com email before joining.');

  process.exit(0);
}

setupGRIETSpace().catch((error) => {
  console.error('❌ Error setting up GRIET space:', error);
  process.exit(1);
});
