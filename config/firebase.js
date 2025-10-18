import dotenv from 'dotenv';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

let db = null;

export const initializeFirebase = () => {
  console.log('Initializing Firebase with config:');
  console.log('Database URL:', firebaseConfig.databaseURL);
  console.log('Project ID:', firebaseConfig.projectId);
  
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    console.log('Firebase initialized successfully');
    console.log('Database instance:', db ? 'OK' : 'FAILED');
  }
  return db;
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return db;
};

export { firebase };