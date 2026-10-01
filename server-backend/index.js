```js
const admin = require("firebase-admin");

// Firebase service account Render Environment Variable se load hoga
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT environment variable is missing.");
  process.exit(1);
}

let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT contains invalid JSON.");
  console.error(error.message);
  process.exit(1);
}

// Firebase Admin initialize
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const messaging = admin.messaging();

console.log("🔥 Firebase Admin initialized successfully.");
console.log("👂 Listening for scheduled notifications...");

// Firestore listener
db.collection("scheduled_notifications").onSnapshot(
  (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      // Sirf newly added documents process karo
      if (change.type !== "added") {
        return;
      }

      const data = change.doc.data();

      // Already sent notification ko skip karo
      if (data.status === "SENT") {
        console.log(`⏭️ Skipping already sent notification: ${change.doc.id}`);
        return;
      }

      const title = data.title || "🎮 Syna Esports Alert";
      const message =
        data.message || "New match update available!";

      console.log(`🚀 Sending notification: "${title}"`);

      const payload = {
        notification: {
          title: title,
          body: message
        },
        topic: "all_users"
      };

      try {
        // Firebase Cloud Messaging
        const response = await messaging.send(payload);

        console.log(`✅ Push sent successfully. FCM ID: ${response}`);

        // Database me SENT mark karo
        await change.doc.ref.update({
          status: "SENT",
          sentAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Notification ${change.doc.id} marked as SENT.`);
      } catch (error) {
        console.error(
          `❌ Error sending notification: ${error.message}`
        );
      }
    });
  },
  (error) => {
    console.error("❌ Firestore listener error:", error);
  }
);

// Basic process error handling
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled Promise Rejection:", error);
});

console.log("🟢 Syna Esports notification server is running.");
```
