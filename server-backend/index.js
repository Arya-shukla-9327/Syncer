// server-backend/index.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Firestore Listener for Instant & Scheduled Push Notifications
db.collection('scheduled_notifications').onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
            const data = change.doc.data();
            
            // Repeat hone se bachne ke liye status check
            if (data.status === 'SENT') return;

            console.log(`🚀 Sending Notification: "${data.title}"`);

            const payload = {
                notification: {
                    title: data.title || "🎮 Syna Esports Alert",
                    body: data.message || "New match update available!"
                },
                topic: 'all_users' // All registered Android devices subscribe to 'all_users'
            };

            try {
                // Firebase FCM Server Broadcast to all users
                const response = await admin.messaging().send(payload);
                console.log(`✅ Push Sent Successfully! FCM ID: ${response}`);

                // Mark as SENT in database
                await change.doc.ref.update({ status: 'SENT' });
            } catch (err) {
                console.error(`❌ Error sending FCM push: ${err.message}`);
            }
        }
    });
});
