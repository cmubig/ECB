#!/usr/bin/env node

/**
 * Firebase Initialization Script
 * 
 * This script helps set up the initial Firestore collections and security rules
 * for the ECB Human Survey application.
 * 
 * Usage: node scripts/init-firebase.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// You'll need to download your service account key from Firebase Console
const serviceAccount = require('../firebase-admin-key.json'); // You need to add this file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

async function initializeCollections() {
  try {
    console.log('Initializing Firestore collections...');

    // Initialize survey_stats collection
    const statsRef = db.collection('survey_stats').doc('global');
    await statsRef.set({
      total_responses: 0,
      responses_by_model: {},
      responses_by_country: {},
      average_completion_time: 0,
      unique_users: 0,
      last_updated: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Survey stats collection initialized');

    // Create indexes (these would typically be created automatically)
    console.log('📝 Remember to create these Firestore indexes:');
    console.log('   - survey_responses: user_id (Ascending), timestamp (Descending)');
    console.log('   - survey_responses: model (Ascending), timestamp (Descending)');
    console.log('   - survey_responses: country (Ascending), timestamp (Descending)');
    console.log('   - survey_responses: user_id (Ascending), question_id (Ascending)');

    console.log('🎉 Firebase initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
  }
}

async function createSecurityRules() {
  const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own progress
    match /user_progress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can create survey responses and read their own
    match /survey_responses/{responseId} {
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.user_id;
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.user_id;
    }
    
    // Public read access to global stats
    match /survey_stats/{document} {
      allow read: if true;
      allow write: if false; // Only admin/cloud functions can write
    }
  }
}`;

  console.log('📋 Firestore Security Rules:');
  console.log(rules);
  console.log('\n📝 Copy these rules to your Firestore Security Rules in the Firebase Console');
}

async function main() {
  console.log('🚀 ECB Human Survey - Firebase Setup');
  console.log('=====================================\n');

  await initializeCollections();
  console.log('');
  await createSecurityRules();
  
  process.exit(0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { initializeCollections, createSecurityRules };
