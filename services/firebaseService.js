import dotenv from 'dotenv';
import { getDatabase } from '../config/firebase.js';

dotenv.config();

/**
 * Fetches all documents from Firebase Realtime Database
 * @param {string} path - Database path (default: 'documents')
 * @returns {Promise<Array>} - Array of documents
 */
export const fetchDocuments = async (path = 'documents') => {
  try {
    console.log(`Attempting to fetch documents from path: ${path}`);
    
    const db = getDatabase();
    const ref = db.ref(path);
    
    const snapshot = await ref.once('value');
    const data = snapshot.val();

    if (!data) {
      console.log('No data found in Firebase');
      return [];
    }

    const documents = Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));

    console.log(`Fetched ${documents.length} documents from Firebase`);
    return documents;
  } catch (error) {
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    throw new Error(`Failed to fetch documents from ODLaaS: ${error.message}`);
  }
};

/**
 * Fetches all logbook entries from Firebase Realtime Database
 * @param {string} path - Database path (default: 'logbook')
 * @returns {Promise<Array>} - Array of log entries
 */
export const fetchLogbook = async (path = 'logbook') => {
  try {
    console.log(`Attempting to fetch logbook from path: ${path}`);
    
    const db = getDatabase();
    const ref = db.ref(path);
    
    const snapshot = await ref.once('value');
    const data = snapshot.val();

    if (!data) {
      console.log('No logbook data found in Firebase');
      return [];
    }

    const logs = Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));

    console.log(`Fetched ${logs.length} log entries from Firebase`);
    return logs;
  } catch (error) {
    console.error('Error fetching logbook:', error.message);
    throw new Error(`Failed to fetch logbook from ODLaaS: ${error.message}`);
  }
};

/**
 * Fetches a specific document by ID
 * @param {string} documentId - Document ID
 * @param {string} path - Database path
 * @returns {Promise<Object|null>} - Document object or null
 */
export const fetchDocumentById = async (documentId, path = 'documents') => {
  try {
    const db = getDatabase();
    const ref = db.ref(`${path}/${documentId}`);
    
    const snapshot = await ref.once('value');
    const data = snapshot.val();

    if (!data) {
      return null;
    }

    return {
      id: documentId,
      ...data
    };
  } catch (error) {
    console.error('Error fetching document by ID:', error.message);
    throw new Error('Failed to fetch document from ODLaaS');
  }
};