# Shulife mobile (Expo)

Director and bursar app (§17 Stage 12): collection at a glance, the review queue, and manual receipts with a camera photo that work offline and sync later.

```bash
cd apps/mobile
npm install
npx expo start          # scan the QR code with Expo Go on an Android phone
```
Enter the school server's address (for the demo, your computer's address where `npm run dev` runs) and sign in as director or bursar.

Not done yet: Supabase email/password sign-in in the app (the server already accepts Supabase tokens), push notifications for payments, and a signed APK build (`eas build -p android`).
