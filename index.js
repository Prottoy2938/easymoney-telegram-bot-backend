const admin = require("firebase-admin");
const TelegramBot = require("node-telegram-bot-api");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "easymoney-17c05",
      clientEmail:
        "firebase-adminsdk-odfmj@easymoney-17c05.iam.gserviceaccount.com",
      privateKey:
        "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCCgxav/CyAd+LT\n3wr97mzlTh6dyKZDOD6Hbk4i86wJbEwDX7mBRmBnr7mfdooINCYZAAZPyN3J0QDM\nQ+gDC8WPzPUhtJsKPekSIX9UnnKida3PiTh57U6NSqbic+wisHzXTN2v4JCftwIR\n8r/QvG1T7evzLLHoGTpXMZzJmJviCvrOXppfUoe+I9OlZo/9eQl9mxoMDMOBf+x0\noELcgWD+T1fwGobXVuEu9VPzlYUtnYBd0sxsxUz4GKiJkREbbdKxgpDl3uEDNzA2\njNCa2pw0cR9NbQoHeYLNT8RtCHnWrY1Qty5LW7W+UfiGxuW0j2diUbcwWpSt+a6K\nj0pGPqMxAgMBAAECggEAAwZkzTlsEqI0uLJvv8j57yqrXP7ck6xHDr6IwxigwSso\na9+ZHhzyeRTCmaaWtm/2/hdZDhpawaW9ff6I7yEjuByJBfn4qfkbYNcz61Ms1wUh\nPTEyBOlyK6YyTgdfzsIGcrsOXFg5IeqM+ruEpKLpacuW73D2wqlrB8BXoPiPjGKq\nSkMG1f2UTnrJ4Qx32D5Nfyqx0GwQiiWAxheVr4sYlr91p8PADrGyWw2Xz/46L6U7\nJwXh3BCnjxonX5+H9ZD0k6IvL3f65C+KxJOayb71YYPXIRCyw7saitMEnp4Ta3gN\nrUaNC6Zegqiw/B55xf0pqzi6va28/eapOW7kJV9TnQKBgQC4boYhXYwtD9sCblte\n3I0vv/ad2GNigFSv0jJp1pPb9JB1h2EJS40uzrE7m2aWnvIlHiVCmjP5fO5MlBCr\nPmaqf5x/hj+rWi1GOdKoSNzFKpdxg421RUkxo6KhXRZ+xMrVte4XBMO/tYmSOLEV\nCTnG4FAe6Xd7M7KpAfZaYrJtJwKBgQC1KC06T2XnZSAj/dpV6sw12T/f8/octqur\n7wz6tTzgPXoOMIj7s5pUtuZp+9I1h9uXNAsX52EFUsQmEP0DbKGtPGNRTjw4f1aa\nlrPcQNgRRU4Gnu0Cx5qdWfNXCBNYAfa/eF3Zuk4d+Lz/3pulyKt3qIhtO4PEF76o\nfPMBCOHT5wKBgQCjMAg2lZNme9UJPaRTN0slqPEJkWG+0lYcjBxXUanawXbgxzyx\nAMyXUgO3/jSzqUgQV7AYUmESq9wenhRxsPEeg3Nx0tObRlsw/BDNHktZmeoOYpyM\nfBXbejJ4HOm+mVnv5t4YN/sMMhDb9JWbS2J3+hpqf6Fcvc2jhTz5lMLTmQKBgG5p\ntmc7zVhjglttdY24Ng78Arp08ZReofOBF+AWZqwlzCap3lPK+912PKmMGmsWCvj1\nd21yUOf1siehYxSbOU9k5wO/M2Ub96TxBV7RBuA/5XaTltGC5vHQyUfaXC/fwoyg\nyFLUApix6j/pZeR9kkS0K7Kn+3+hGUuIHHQc/ccxAoGABXSVn37X7bcWxua1655n\nifdqPW93yLz8FZyxzfLSU9VH1QCjpPmuZgiBI2Vp3ujYHRHyU17l/o/GlGruEA6o\nLggqJrd4nUdtUt1o/Pezw1v7/2kgOmDIlV+AUBEXi5Llr9qbZwhMu4FHJ0YW2Plu\nn2Tiy3GVrQyovsx/moln+vs=\n-----END PRIVATE KEY-----\n".replace(
          /\\n/g,
          "\n"
        ),
    }),
    databaseURL: `https://easymoney-17c05.firebaseio.com`,
  });
}

const db = admin.firestore();
const token = "6784822201:AAFKDyZe5AGSQxth3hm3AV0RRGEAuZrJAtA";
const bot = new TelegramBot(token, { polling: true });

// Keep track of users who are in the process of providing email
const usersAwaitingEmail = {};

bot.on("polling_error", (msg) => console.log(msg));

// Listen for messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // If user is not in the process of providing email, ask for it
  if (!usersAwaitingEmail[userId]) {
    // Ask user for email
    bot.sendMessage(
      chatId,
      "Welcome to Easymoney Personal Coaching. Please enter your email:"
    );

    // Set user's state to 'awaiting_email'
    usersAwaitingEmail[userId] = true;
  } else {
    // User is in the process of providing email, handle response
    const email = msg.text;
    const userRef = db.collection("users").where("email", "==", email).limit(1);

    try {
      const snapshot = await userRef.get();

      if (snapshot.empty) {
        bot.sendMessage(chatId, "Email not found in our records.");
        // Remove user from email awaiting state
        delete usersAwaitingEmail[userId];
        return;
      }

      snapshot.forEach(async (doc) => {
        const user = doc.data();
        const plan = user.plan;
        console.log(msg);
        if (plan === "ultimate") {
          console.log({
            personalCoaching: {
              status: "initiated",
              lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
              telegramUserDetails: msg.from.username,
            },
          });
          // Update document with personal coaching details
          await doc.ref.update({
            personalCoaching: {
              status: "initiated",
              lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
              telegramUserDetails: msg.from,
            },
          });

          bot.sendMessage(
            chatId,
            "We've received your request for personal coaching. Soon one of the coach will get back to you. Thank you for your patience 🤝🏻"
          );
        } else {
          bot.sendMessage(
            chatId,
            "You'd need to be on the ultimate plan to get access to personal coaching."
          );
        }
      });
    } catch (error) {
      console.error("Error getting document:", error);
      bot.sendMessage(chatId, "An error occurred. Please try again later.");
    }

    // Remove user from email awaiting state
    delete usersAwaitingEmail[userId];
  }
});
