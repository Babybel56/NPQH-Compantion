# NPQH Companion

A personal study workspace for William’s Best Practice Network NPQH, starting November 2026. The app is ready for GitHub Pages and optionally Supabase. No installation or build step is needed on GitHub.

## What is included

- Dashboard and the five published learning cycles.
- Editable task lists, deadlines and calendar export.
- Structured reflections: experience, learning, application, impact and next steps.
- Evidence documents and links, mapped to the ten headship framework areas and your own statement references.
- Coaching, events and learning-time records, with actions that can become tasks.
- Personal development reviews and a reading library.
- Assessment analysis, response and review notes with a word counter.
- Full backup/restore including attachments, records export and printable HTML portfolio.
- Browser storage immediately; private Supabase sign-in, database and attachments when configured.

## Publish on GitHub

1. Create a repository named **NPQH-Compantion** in your GitHub account. The website code contains no personal study records or credentials. Choose the repository visibility that suits your account and GitHub Pages plan.
2. Unzip the upload package. In the empty repository, choose **uploading an existing file**, then drag in **the contents of the `npqh-companion` folder**, including `index.html`, `app`, `icon.svg`, `package.json`, `server.mjs`, `tests`, `supabase` and the hidden `.github` folder. Do not upload the ZIP itself or add an extra enclosing folder.
3. Commit to the **main** branch.
4. Open **Settings → Pages**. Set **Source** to **GitHub Actions**.
5. Open **Actions → Check and deploy NPQH Companion → Run workflow**, select `main`, and run it. Later commits publish automatically after the tests pass.
6. Open the website link shown in the successful deployment. It will normally be `https://Babybel56.github.io/NPQH-Compantion/`.

If `.github` is hidden in File Explorer, enable **View → Show → Hidden items** before uploading. It must contain `workflows/pages.yml`. GitHub’s upload interface accepts folders; check that `.github/workflows/pages.yml` appears in the commit. The workflow publishes only website files, not SQL or tests.

The app works as soon as the site is live. Until you connect Supabase, records are stored only in that browser. The local preview and GitHub website have separate browser storage: use a full backup to move your work between them.

## Connect private Supabase storage

1. Create a new Supabase project. A separate project avoids accidentally inheriting broader permissions from your QTS database.
2. Open **SQL Editor**, paste the contents of **`supabase/setup.sql`**, and run it once. This creates `npqh_workspaces` with owner-only access and a private `npqh-evidence` bucket.
3. Open **Authentication → Users → Add user** and create your own user with an email address and a strong password. If the dashboard offers an auto-confirm option for an administrator-created user, enable it. For this personal app, disable new public sign-ups in the project’s authentication settings.
4. Copy the project URL and **publishable key** from the project’s API/connection settings. A legacy **anon** key also works. Never use a secret or `service_role` key in this app or your repository.
5. In the app, open **Settings & backup → Private cloud storage**, enter the URL/key, and select **Connect project**.
6. Sign in with the user you created. A new cloud account starts with a blank workspace and suggested tasks.
7. To move existing browser work: download a **full backup before signing in**, then sign in and **Import full backup**. Import replaces the current account’s workspace and uploads fresh copies of its attachments.
8. On another device, open the same GitHub Pages URL, connect the same project and sign in. Your cloud records should appear. Connection details are saved independently in each browser.

There is no public registration, mentor sharing or provider-portal integration in v1. The app does not submit work to Best Practice. Password management happens in Supabase; the app does not store your password. Supabase maintains the usual browser session so sign-in can survive a reload.

## Programme setup

Open Settings and enter your actual start day, coach, portal and confirmed assessment requirements. Exact dates and word limits are deliberately blank: public provider documents include different versions, so your cohort brief is the authority. The November 2026 cohort label reflects your requested start month.

The suggested checklists are personal planning prompts, not a complete list of mandatory activities or a compliance calculation. The task progress percentage does not measure official engagement or determine eligibility for assessment. Development ratings are personal needs-analysis notes. The counter uses whitespace-separated words; your provider may count differently. Log sessions after they happen so learning hours reflect completed activity.

## Protect and back up your work

- In browser mode, records use local storage and attachments use IndexedDB. Clearing website data removes them. Keep full backups.
- A full backup includes all current records and attachments, up to 100 MB of attachment contents and 25 MB per file. Store it privately. Records-only exports and printable portfolios do **not** include attached file contents and cannot be imported as a full restore.
- Cloud access uses owner-only database and storage policies. Files download through the signed-in client, without public file links. Supabase project administrators still have administrative access.
- Concurrent saves check the workspace revision. If another device saved first, keep a copy of your text and reload. A failed save leaves the editor open; retry after resolving the error. Do not refresh an unsaved draft without copying it first.
- Signing out returns you to this device’s separate browser workspace. Cloud records are not copied to local browser storage. Supabase session information remains managed by its authentication library.
- Successful imports keep previous attachment objects in private storage for recovery. They are no longer listed by the new workspace. Remove old objects manually only after verifying your backups. Failed imports try to remove newly uploaded objects.
- Your code may be publicly visible through GitHub Pages. Your cloud records remain behind Supabase authentication. Do not put evidence, backups, passwords or secret keys in the repository.

## Local preview and checks

With Node.js 24 installed, open a terminal in this folder and run:

```text
node server.mjs
```

Then open `http://127.0.0.1:4173`. Keep that terminal running while using the local app. Use the same port each time to retain access to the same browser storage. Opening `index.html` directly is not supported because the app uses JavaScript modules.

```text
node --test
node --check app/main.js
node --check app/store.js
```

The core app has no package dependencies. Supabase’s official JavaScript library is loaded from jsDelivr only when a cloud project is configured. Cloud mode requires internet access; it does not queue offline changes. Browser mode can continue while the loaded app stays open, but this release is not an installable offline PWA.

## Verify your cloud setup before relying on it

After connecting your project:

1. Add a test reflection and attach a harmless test document to an evidence record.
2. Reload and confirm both reopen.
3. Sign in on a second device and confirm they appear.
4. Make a full backup and restore it into the browser workspace; confirm the document downloads correctly.
5. For an access check, create a second test user and verify it starts with an empty workspace and cannot access the first user’s records or attachments.

The supplied automated tests exercise backup validation, calendar output, local save conflicts, cloud revision conflicts and attachment owner checks using controlled clients. They do not replace executing the SQL and checking your real project’s access policies. Live Supabase authentication, SQL and cloud uploads cannot be verified until you have created a project.

## Sources

Public programme structure checked on 4 November 2026:

- [Best Practice Network NPQH](https://www.bestpracticenet.co.uk/NPQH)
- [DfE Headship Framework](https://www.gov.uk/government/publications/national-professional-qualification-npq-headship-framework)
- [GOV.UK NPQH overview](https://www.gov.uk/guidance/headship-national-professional-qualification)
- [Supabase JavaScript installation](https://supabase.com/docs/reference/javascript/installing)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase private storage access](https://supabase.com/docs/guides/storage/security/access-control)

This is a personal companion, independent of Best Practice Network. It does not reproduce their course materials or replace their learning platform.
