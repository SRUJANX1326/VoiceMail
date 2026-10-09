# Voice Mail Assistant — Setup Guide

This guide explains how to configure your own copy of Voice Mail Assistant from scratch. You will create your own API keys, Google OAuth credentials, database project (optional), and deployment settings.

> **Important:** Never reuse another developer's API keys, OAuth client secret, Supabase secret, access tokens, or `.env` file. Create credentials in accounts you control and keep secrets out of GitHub.

## Contents

- [1. Prerequisites](#1-prerequisites)
- [2. Get the project](#2-get-the-project)
- [3. Create your own AI API key](#3-create-your-own-ai-api-key)
- [4. Configure Google Cloud and OAuth](#4-configure-google-cloud-and-oauth)
- [5. Configure the backend environment](#5-configure-the-backend-environment)
- [6. Install dependencies and run locally](#6-install-dependencies-and-run-locally)
- [7. Optional: Set up Supabase](#7-optional-set-up-supabase)
- [8. Configure Google Drive uploads](#8-configure-google-drive-uploads)
- [9. WhatsApp messaging setup](#9-whatsapp-messaging-setup)
- [10. Build the Android app](#10-build-the-android-app)
- [11. Deploy the application](#11-deploy-the-application)
- [12. Security checklist](#12-security-checklist)
- [13. Troubleshooting](#13-troubleshooting)

---

## 1. Prerequisites

Install the tools you need:

- **Git** — to clone the repository and manage changes.
- **Node.js and npm** — use Node.js 18 or the version required by the project's `package.json`/deployment platform.
- **VS Code** or another code editor.
- **Google account** — for Gmail and Google Drive integrations.
- **AI provider account** — Gemini, Groq, or whichever provider the current backend is configured to use.
- **Android Studio** — only if you want to build the Android APK.
- **Supabase account** — optional, if you want hosted persistence.

Check that Node.js and npm are installed:

```bash
node --version
npm --version
git --version
```

## 2. Get the project

Clone the repository:

```bash
git clone https://github.com/SRUJANX1326/VoiceMail.git
cd VoiceMail
```

Create your own working branch if you plan to customize the project:

```bash
git checkout -b my-setup
```

Inspect the project files before configuring it. The project may contain `frontend/`, `backend/`, `android/`, and `supabase/` directories.

### Find the environment template

Look for `backend/.env.example`. Use that file as the source of truth for the exact environment variable names expected by your current code.

Create your own environment file:

**Windows PowerShell**
```powershell
Copy-Item backend/.env.example backend/.env
```

**macOS/Linux**
```bash
cp backend/.env.example backend/.env
```

If the template is located somewhere else in your version, copy the template from its actual location. Do not copy another developer's `.env` file.

## 3. Create your own AI API key

The backend may be configured to use Google Gemini, Groq, or another supported provider. Check `backend/gemini.js`, other AI-provider files, and `backend/.env.example` to confirm which provider and variable names your version uses.

### Option A: Gemini

1. Open [Google AI Studio](https://aistudio.google.com/apikey).
2. Sign in with your Google account.
3. Create an API key in a project you control.
4. Store the key in `backend/.env` using the variable name required by `.env.example`, commonly:

```env
GEMINI_API_KEY=replace_with_your_own_key
```

### Option B: Groq

1. Open [Groq Console](https://console.groq.com/).
2. Create or sign in to your account.
3. Create an API key.
4. Add it to `backend/.env` using the exact variable name expected by your current backend, for example:

```env
GROQ_API_KEY=replace_with_your_own_key
```

The Groq variable above is an example; use the exact name in your project's environment template and source code. Do not configure both providers unless the code supports selecting between them.

Free tiers, model availability, rate limits, and terms can change. Review the provider's current policies. Never put an AI key in frontend code or a public repository.

## 4. Configure Google Cloud and OAuth

Google OAuth is used to let the user authorize Google services such as Gmail and Google Drive. You must create your own Google Cloud project and OAuth credentials.

### 4.1 Create a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select one you control.
3. Open **APIs & Services → Library**.
4. Enable **Gmail API**.
5. If you want Google Drive uploads, enable **Google Drive API** as well.

### 4.2 Configure the OAuth consent screen

1. Open **Google Auth Platform** or the OAuth consent-screen settings.
2. Enter an application name and support/contact email.
3. Configure the audience/user type as appropriate for your account and use case.
4. If the app is in **Testing** mode, add the Google accounts that will test it.
5. Configure only the scopes required by the features you intend to use.

The email feature commonly requires the Gmail send scope:

```text
https://www.googleapis.com/auth/gmail.send
```

The Drive upload feature commonly uses:

```text
https://www.googleapis.com/auth/drive.file
```

Use the scope names actually requested by the current code. Google may change the Console interface and can impose testing, verification, or publishing requirements depending on the scopes and audience.

### 4.3 Create OAuth client credentials

1. Open **Google Auth Platform → Clients** or **APIs & Services → Credentials**.
2. Create an **OAuth client ID**.
3. Select **Web application** if your backend handles the OAuth callback.
4. Add your local callback URL under **Authorized redirect URIs**:

```text
http://localhost:3000/auth/callback
```

5. Copy the OAuth client ID and client secret into your own `backend/.env`:

```env
GOOGLE_CLIENT_ID=replace_with_your_client_id
GOOGLE_CLIENT_SECRET=replace_with_your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

Use the exact variable names expected by your code. The redirect URI must match exactly in both Google Cloud Console and your environment configuration.

**Keep the client secret private.** Do not put it in React code, Android resources, screenshots, or Git commits.

## 5. Configure the backend environment

Open `backend/.env` and fill in the values required by your chosen features. A typical local configuration may resemble:

```env
# AI provider: use only the provider/configuration supported by your code
GEMINI_API_KEY=replace_with_your_own_key

# Google OAuth
GOOGLE_CLIENT_ID=replace_with_your_client_id
GOOGLE_CLIENT_SECRET=replace_with_your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Optional hosted database
SUPABASE_URL=
SUPABASE_KEY=

# Optional: country calling code for 10-digit WhatsApp numbers
DEFAULT_COUNTRY_CODE=91
```

This is a **sample**, not a guaranteed complete list. Your current `backend/.env.example` and backend source code are authoritative. If your version uses Groq or other provider variables, add the appropriate entries from that template.

Do not commit `backend/.env`. Confirm that `.gitignore` excludes it:

```gitignore
.env
.env.*
!.env.example
```

Only use these ignore patterns if they are compatible with your repository's existing `.gitignore`. Keep `.env.example` limited to variable names and harmless placeholders.

## 6. Install dependencies and run locally

### 6.1 Build the frontend

```bash
cd frontend
npm install
npm run build
```

Run frontend tests if configured:

```bash
npm test
```

### 6.2 Install backend dependencies

Open another terminal at the project root, or return to it:

```bash
cd ../backend
npm install
```

If your terminal is already at the project root, simply run `cd backend` instead.

Run backend tests if configured:

```bash
npm test
```

### 6.3 Start the server

From the `backend/` directory:

```bash
npm start
```

Open:

[http://localhost:3000](http://localhost:3000)

If the project is configured to serve the production frontend from `frontend/dist`, rebuild the frontend after making UI changes before restarting the backend.

### 6.4 Test Google authorization

1. Open the application in a supported browser.
2. Grant microphone permission if you want voice interaction.
3. Select **Connect Google**.
4. Sign in with an account allowed by your OAuth consent-screen settings.
5. Approve the requested permissions.
6. Return to the app and test a low-risk workflow before sending a real email.

If the OAuth consent screen is in Testing mode, you may need to reconnect after authorization expires or settings change.

## 7. Optional: Set up Supabase

Supabase provides hosted PostgreSQL persistence for supported records such as contacts and email history. The application can also support local JSON files, depending on its current configuration.

1. Open [Supabase](https://supabase.com/) and create a project.
2. Open the SQL Editor.
3. Run the SQL from `supabase/schema.sql`.
4. Open the project's API settings and copy its project URL.
5. Create or locate the appropriate server-side secret key.
6. Add the values to `backend/.env` using the exact variable names expected by the backend, commonly:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=replace_with_your_server_side_secret
```

7. Restart the backend and check its startup logs or health endpoint, if available.
8. If the project supports a migration script and you already have local JSON data, review the script and back up the files before migrating.

**Security:** a Supabase secret/service-role key must remain server-side. Never expose it in the frontend, Android app, GitHub, or client-side environment variables. Configure suitable database access controls and use only the privileges required by the backend.

Supabase is optional for local development if your version supports local JSON storage. Hosted/serverless deployments may require a persistent database.

## 8. Configure Google Drive uploads

To use Google Drive uploads:

1. Enable the **Google Drive API** in your Google Cloud project.
2. Add the Drive scope required by the code to the OAuth configuration.
3. Ensure the backend's OAuth flow requests the required Gmail and Drive permissions.
4. Reconnect Google so the new permissions can be granted.
5. Review the upload directory and file restrictions in the current backend code and `.env.example`.
6. Test with a non-sensitive sample file.

The `drive.file` scope is designed for file access granted through the app; it does not provide unrestricted access to every file in the user's Drive.

On hosted or serverless platforms, the filesystem may be read-only or temporary. Confirm that the deployment supports the file-source behavior used by this project before relying on local project files for uploads.

## 9. WhatsApp messaging setup

The documented WhatsApp workflow uses a Click to Chat link or deep-link handoff rather than the paid WhatsApp Business Platform API.

1. Ensure WhatsApp is installed on the phone, or use WhatsApp Web on a desktop.
2. Provide the recipient's phone number with the correct country code.
3. If the app supports saving WhatsApp contacts, confirm the number before saving it.
4. Ask the assistant to prepare a message.
5. Confirm that the app should open WhatsApp.
6. Review the recipient and prefilled message, then tap **Send** in WhatsApp.

No WhatsApp API key is required for this handoff flow. It does not send messages silently or automatically; the user completes sending inside WhatsApp.

If Supabase is enabled and the project uses a `whatsapp_contacts` table, make sure the current schema includes that table.

## 10. Build the Android app

### 10.1 Configure the app URL

Open the `android/` project and locate its documented app URL configuration. The project documentation identifies `APP_URL` in `android/gradle.properties`.

For a deployed app, set it to your own deployment URL, for example:

```properties
APP_URL=https://your-own-app.example
```

Use your actual URL, without a trailing slash if required by the project. Do not copy the example domain.

### 10.2 Build the APK

1. Install and open [Android Studio](https://developer.android.com/studio).
2. Open the project's `android/` directory.
3. Let Gradle sync and resolve dependencies.
4. Confirm the configured app URL.
5. Select **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
6. Install the generated APK on a test device.
7. Grant microphone permission and test Google OAuth return behavior.

For local development with the backend running on your computer, follow the Android networking instructions in the project's existing README. A USB-connected device may require `adb reverse` if the app is configured to access the development server through localhost.

Always test the APK against the same backend and OAuth configuration you intend users to use.

## 11. Deploy the application

Deployment steps depend on your chosen hosting provider and the current backend architecture.

### 11.1 Prepare the production configuration

Before deploying:

- Push the project to a GitHub repository you control.
- Build the frontend and confirm the build succeeds.
- Choose a host that supports the backend's runtime and routing requirements.
- Configure production environment variables in the host's dashboard.
- Set `GOOGLE_REDIRECT_URI` to the production callback URL.
- Add that exact callback URL to your Google OAuth client.
- Configure `APP_URL` in the Android project to point to your deployed application.
- Configure Supabase or another persistent storage option if the deployment filesystem is not persistent.

### 11.2 Vercel

If using Vercel, import your repository or deploy using the supported Vercel workflow. Confirm that the project's backend is compatible with the chosen deployment setup; a standard Express server may need appropriate serverless routing or adaptation.

Add secrets through the Vercel project settings, not by committing them to GitHub. Configure the production OAuth callback URL and verify that API routes, frontend routes, database access, and file-upload behavior work in the deployed environment.

A deployment is not complete until you test Google OAuth and the main workflows against the live URL.

### 11.3 Free-tier notes

Hosting providers, AI providers, and databases can change their free-tier quotas, usage limits, sleep behavior, and billing rules. Check current pricing and usage policies before deploying. “Free tier” does not mean unlimited use or guaranteed permanent availability.

## 12. Security checklist

Before publishing or sharing your fork, confirm all of the following:

- [ ] I created my own AI provider key.
- [ ] I created my own Google Cloud project and OAuth credentials.
- [ ] I created my own Supabase project and server-side key if using Supabase.
- [ ] My actual `.env` file is not tracked by Git.
- [ ] No API keys, client secrets, refresh tokens, or private user data appear in commits.
- [ ] Production callback URLs match the URLs configured in Google Cloud.
- [ ] Frontend and Android code do not contain server-side secrets.
- [ ] Google OAuth scopes are limited to the features I use.
- [ ] Email sending requires explicit user confirmation.
- [ ] WhatsApp messages are reviewed and sent by the user inside WhatsApp.
- [ ] I tested the deployed application and Android APK with my own accounts.
- [ ] I reviewed provider billing, quota, and data-handling policies.

If a secret was ever committed to a public repository, deleting it from the latest file is not enough. Revoke or rotate the credential with the provider and review the repository history.

## 13. Troubleshooting

### OAuth redirect URI mismatch

- Ensure `GOOGLE_REDIRECT_URI` exactly matches the authorized redirect URI in Google Cloud Console.
- Check scheme (`http` versus `https`), domain, port, path, and trailing slash.
- Restart the backend after changing environment variables.

### Google sign-in says the app is unverified or access is blocked

- Check the OAuth consent-screen status, configured audience, test users, and requested scopes.
- If the app is in Testing mode, sign in with an account listed as a test user.
- Follow Google's current verification requirements for the intended audience and scopes.

### AI requests fail

- Verify the provider key and variable name.
- Confirm the configured model is available to your account.
- Check provider quotas, rate limits, and backend logs.
- Never paste API keys into public issue reports.

### Microphone or speech recognition does not work

- Allow microphone access in the browser or Android settings.
- Check the device's internet connection and speech-recognition support.
- Test in a supported browser and keep the app open while using the wake phrase.
- Speech recognition behavior varies by browser, Android version, device, and network.

### Changes to the frontend do not appear

Run the frontend build again:

```bash
cd frontend
npm install
npm run build
```

Then restart the backend if it serves the compiled `frontend/dist` directory. Hard-refresh the browser if an older version remains cached.

### Contacts or history disappear after deployment

- Check whether the current configuration uses local JSON files or Supabase.
- Local files may be ephemeral or unavailable on serverless hosting.
- Configure persistent storage and verify the backend is connecting to it.
- Back up any local JSON data before migrating.

### Android app opens the wrong website

- Verify the app URL setting in `android/gradle.properties`.
- Rebuild the APK after changing the URL.
- Install the newly built APK and confirm the backend URL is reachable from the device.

---

## Final note

This guide is a starting point for configuring your own instance. Because environment variable names, provider selection, routes, and deployment requirements can vary between project revisions, use the current `backend/.env.example`, source code, and Android configuration as the final authority for your particular checkout.
