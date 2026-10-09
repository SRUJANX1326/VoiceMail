# Voice Mail Assistant

Say **"Hey Assistant"** and chat with it about anything: it answers out loud and keeps the conversation going until you say "goodbye". Ask it to write a mail and it switches to email mode, e.g. **"Hey Assistant, write a mail to my boss, his email is abc@gmail.com, I can't attend the conference tomorrow because I'm sick"**.
The assistant asks about saved contacts and confirms the recipient. It asks for a subject and body instructions when needed, but if you already describe the whole email in one natural sentence it reuses those details instead of making you repeat them. AI creates an original email of about 200 words. It reads the draft back, supports revisions, and sends only after final confirmation via Google OAuth. No paid services, no card.

Stack: React + Vite (frontend) · Node.js/Express (backend) · optional Supabase (contact and sent-email history persistence) · Android Studio + Java (WebView shell with native speech).

## 1. Free keys
**Gemini:** https://aistudio.google.com/apikey -> Create API key.

**Google OAuth (no billing needed):**
1. https://console.cloud.google.com -> New Project.
2. APIs & Services -> Library -> enable **Gmail API**.
3. OAuth consent screen / Google Auth Platform -> User type **External**, fill app name + your email. Add scope `.../auth/gmail.send`. Under **Test users** add your own Gmail. Leave it in "Testing".
4. Credentials -> Create credentials -> OAuth client ID -> **Web application**. Authorized redirect URI: `http://localhost:3000/auth/callback`. Copy Client ID + Secret.

## 2. Backend + frontend (on your PC, Node 18+)
```
cd frontend && npm install && npm run build
cd ../backend && npm install
cp .env.example .env     # fill GEMINI_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
npm start
```
Test on PC first: open http://localhost:3000 in Chrome, tap Connect Google, tap Start.

## 3. Android
1. Open the `android/` folder in Android Studio (let it sync; JDK 17 is bundled).
2. Enable Developer options + USB debugging on your phone, plug it in.
3. In a terminal (adb lives in `<Android SDK>/platform-tools`): `adb reverse tcp:3000 tcp:3000`
   (makes `localhost:3000` on the phone point to your PC's server. Re-run after each reconnect.)
4. Press Run. Allow microphone. Tap **Connect Google** -> browser opens -> sign in -> "Google hasn't verified this app" -> Advanced -> Continue -> Allow. Go back to the app.
5. Say "Hey Assistant ...".

APK: Build -> Build Bundle(s)/APK(s) -> Build APK(s).


## Optional: run without the PC (free hosting)
Deploy `backend` on Render's free web service (build: `cd ../frontend && npm i && npm run build && cd ../backend && npm i`, start: `node index.js`; set env vars; use Supabase since the disk is ephemeral). Add `https://YOUR-APP.onrender.com/auth/callback` as a redirect URI in Google, set `GOOGLE_REDIRECT_URI` to it, and change `APP_URL` in `android/app/build.gradle`.

## Limits
- Wake word works while the app is open (screen kept on); not in the background.
- In Google "Testing" mode, the login expires every 7 days -> tap Connect Google again.
- Gemini free tier has rate limits; model name is `GEMINI_MODEL` in `.env`.
- Android's recognizer may beep between listens; needs internet on most phones.

## Voice upgrade (all free, no paid services)
- **Wake phrase:** "Hey my assistant" (also "Hey assistant"). After that the conversation continues hands-free; no Start/Stop taps.
- **Spoken addresses** are converted by deterministic code before any AI sees them (`frontend/src/emailNormalize.js`): "A P C at gmail dot com" -> apc@gmail.com, "john dot doe at gmail dot com" -> john.doe@gmail.com. Also understands underscore, dash/hyphen, period, "at the rate of", spoken digits.
- **Safety:** the assistant asks "I heard apc@gmail.com. Is that correct?", then reads the mail, then asks a final "Shall I send it?". It never sends without both a yes to the address and a yes to the final question (enforced in `frontend/src/dialog.js` and covered by tests).
- **Corrections** work any time: "No, I meant abc123 at gmail dot com".
- **Interrupting:** voice interruption is enabled by default, so you can start speaking while the assistant is talking (headphones recommended to prevent audio feedback). You can turn it off in Preferences.
- **Voice:** picks the most natural installed voice automatically (Android: best installed system voice; desktop: Edge "Natural"/Chrome "Google" voices), falling back to plain browser speech. Install better voices in Android Settings -> Text-to-speech -> Google engine.
- **Tests:** `cd frontend && npm test` and `cd backend && npm test`.

## Contacts and email memory (works without Supabase)
- When you say **write an email**, the assistant first asks whether the person is already saved.
- For a new contact, say their name and email address. When asked, say something like **"Yep, that would work"** to save them, or **"not now"** to use them only once.
- Without Supabase, contacts are saved on the server in `backend/data/contacts.json`, and sent-email history is stored in `backend/data/email-history.json`. These files are created automatically. Back them up if you want to keep your contact list.
- Supabase is optional. To use it, create a project, run the updated `supabase/schema.sql`, and set `SUPABASE_URL` and `SUPABASE_KEY` in `backend/.env`. This stores contacts, sent-email history, and Google tokens in Supabase instead of local JSON files. Never expose the service-role key in frontend code.
- Past-email suggestions can only use emails sent through this app and saved in its history; it does not import your entire Gmail inbox.

## Email conversation flow
1. Ask whether the recipient is saved, then find and confirm their contact (or collect a new name and address).
2. Ask for the subject in the user's own words.
3. Ask for the email purpose, reason, requested action, and tone in a few spoken lines.
4. AI writes the subject/body from those instructions (about 200 words); there is no prefilled subject or message template.
5. Review, optional relevant past-email suggestion, then explicit send confirmation.
6. Confirmation understands natural replies such as "yep", "that would work", "sounds good", "go for it", "not now", and "rather not". It still never sends without final confirmation.


## Troubleshooting conversation
- The live conversation strip shows only the latest utterance and fades it out after about 4.5 seconds.
- If the assistant speaks too long or misunderstands a fragment, interrupt it and give a correction; the flow retains prior details and does not require you to repeat the entire email.
- Browser speech recognition generally requires an internet connection. If recognition repeatedly reports a network error, check your connection and Chrome microphone permission.
- After updating source code, always run `cd frontend`, `npm install`, and `npm run build` before restarting the backend; the server serves the compiled `frontend/dist` files.

## Supabase (free database for login tokens, contacts and sent-email history)
1. https://supabase.com -> sign up -> **New project** (free plan, no card). Wait ~2 minutes.
2. **SQL Editor** -> New query -> paste all of `supabase/schema.sql` -> Run. (Creates `google_tokens`, `contacts`, `email_history`.)
3. Copy the **Project URL** (Project Settings -> Data API, looks like `https://abcd.supabase.co`).
4. **Project Settings -> API Keys** -> copy the **Secret key** (`sb_secret_...`; the old `service_role` key also works for now). Never use the publishable/anon key and never put the secret key in the frontend.
5. In `backend/.env`: `SUPABASE_URL=...` and `SUPABASE_KEY=...`
6. `cd backend && npm start`. You must see `Supabase check: OK (3 tables found)`. Also open http://localhost:3000/api/health.
7. Already have local data? Run once: `npm run migrate` (copies backend/data/*.json into Supabase).
8. Tap **Connect Google** again if the app says it is not connected.
Leave both variables empty to keep using local files in `backend/data/`.

## Google Drive upload (free)
Say: **"Hey my assistant, upload report.txt to my Google Drive."** It names the file, asks for confirmation, uploads to a Drive folder called **Voice Mail Assistant**, then confirms.
- Files come ONLY from the project folder (next to `backend/` and `frontend/`; a sample `report.txt` is included). Only .txt .md .csv .pdf .docx .xlsx .png .jpg up to 25 MB; hidden files such as `.env` are never listed. Change the folder with `UPLOAD_DIR` in `backend/.env`.
- One-time Google setup: (1) Google Cloud Console -> APIs & Services -> Library -> **Google Drive API** -> Enable. (2) OAuth consent screen -> Data Access -> Add scope `.../auth/drive.file` -> Save. (3) Restart the server, tap **Connect Google** again and tick ALL permission boxes (Gmail and Drive).
- The `drive.file` permission only lets the app see files it created itself, not the rest of your Drive.

## WhatsApp messages by voice (free, no API key)
Say: **"Hey my assistant, message Rahul on WhatsApp that I'll be late."**
1. If Rahul is a saved WhatsApp contact it uses his number. Otherwise it asks for the number, reads it back digit by digit, and saves it after you say yes.
2. It reads the message and asks "Shall I open WhatsApp?"
3. After **yes**, WhatsApp opens with the chat and message already filled in. **You tap Send** (apps cannot press Send in WhatsApp for you; that is a WhatsApp/Android rule). Nothing opens without your yes.
- Numbers: 10-digit numbers get the country code from `DEFAULT_COUNTRY_CODE` in `backend/.env` (91 = India). Other countries: say "plus" and the code, e.g. "plus four four ...".
- Needs WhatsApp installed on the phone (on a PC it opens WhatsApp Web).
- Supabase users: re-run `supabase/schema.sql` once (adds the `whatsapp_contacts` table).
- Windows tip: keep the project in a SHORT path such as `C:\vma` (not deep inside OneDrive). Very long paths make Windows drop files from node_modules.

## Deploy on Vercel (free Hobby plan)
See the steps in the chat answer. Short version: push to GitHub (or use `vercel` CLI) -> import -> add environment variables (GOOGLE_*, LLM keys, SUPABASE_*, GOOGLE_REDIRECT_URI=https://YOUR-APP.vercel.app/auth/callback) -> Deploy -> add that redirect URI in Google Cloud -> set APP_URL in `android/app/build.gradle` to your Vercel URL.
Supabase is REQUIRED on Vercel (the disk is read-only). Drive upload on Vercel can only upload files bundled with the deployment (`report.txt`).

## Android app
1. Put your deployed address in `android/gradle.properties` -> `APP_URL=https://YOUR-APP.vercel.app` (no trailing slash).
2. Android Studio: open the `android` folder -> Build -> Build Bundle(s)/APK(s) -> Build APK(s). The file is `android/app/build/outputs/apk/debug/app-debug.apk`.
3. Copy it to the phone, allow "Install unknown apps" for your file manager, install, open, allow the microphone.
4. Tap Connect Google (browser opens) -> after sign-in tap "Return to the app".
