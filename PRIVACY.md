# Privacy Policy — MyExpenses

**Last updated:** August 26, 2026

MyExpenses is a personal expense-tracking app. This policy explains what data the app accesses and how it is used.

## Data collection and storage

MyExpenses stores all of your data — accounts, transactions, budgets, categories, and settings — locally on your device only. No data is transmitted to any external server, and the app does not use a backend or cloud service of its own.

## SMS permission (RECEIVE_SMS)

MyExpenses requests the `RECEIVE_SMS` Android permission to automatically detect bank and UPI transaction messages (e.g. "debited", "credited", "sent") and turn them into pending transaction entries for your review.

- The app does **not** request `READ_SMS` and cannot read your existing SMS history or any message unrelated to a transaction.
- Incoming SMS text is processed entirely **on your device**. It is never uploaded, transmitted, or shared with any third party or server.
- Only the fields needed to build a transaction (amount, date, direction, masked account digits, merchant, reference number) are kept, and only while the transaction is pending your review. The original message text is discarded once you approve or ignore the transaction.
- You can review, edit, approve, or ignore every detected transaction before it is added to your records — nothing is created without the option to review it (unless you explicitly enable auto-approval in Settings).
- You can revoke SMS permission at any time via Android Settings, which stops detection but does not affect your existing data.

## Data sharing

MyExpenses does not sell, share, or transmit your data to any third party. There are no analytics, ad, or tracking SDKs in this app.

## Data deletion

Since all data is stored locally, uninstalling the app removes all associated data from your device.

## Contact

Questions about this policy can be sent to: purshothcs@gmail.com
