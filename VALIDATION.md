# Verification history

Initial application checks on 4 November 2026, before cloud setup:

- All 14 automated tests pass under Node.js 24.
- JavaScript syntax checks pass for the app, storage module and local server.
- Browser checks: create task, reload and find it; create reflection and see the saved text; attach a harmless text document, reload and download it; save an assessment draft, reload and confirm both text and six-word count; import a clean full backup and see the successful restore message.
- Automated full-backup round trip preserves Unicode attachment contents and creates new storage references. Failure tests cover incomplete backups, unsuccessful saves and cleanup after failed imports.
- Desktop layout checked at 1440 × 1050 and phone layout at 390 × 844. Neither showed horizontal page overflow. Navigation retains accessible names when labels collapse to icons. Test records were removed by restoring a clean workspace.
- Cloud tests use controlled clients to exercise account filtering, revision conflicts and attachment ownership checks. A live Supabase project was not available: SQL execution, real authentication, cloud uploads and policies still need verification after project creation.
- A GitHub repository was not available: no repository or deployment was created. The package includes a GitHub Actions workflow and setup instructions.

The generated website package contains application source and setup files only. It contains no login credentials, personal evidence or browser data.

## Shared Supabase setup, 4 November 2026

- With the user's approval, added the NPQH table and private bucket to the existing QTS project after the account's two-project free limit prevented creation of a third project.
- NPQH database permissions tested using the authenticated database role: the owner can insert, read and update; a different identity cannot read the owner's row or insert on the owner's behalf. Test changes were rolled back.
- Confirmed row-level security is enabled, four owner-specific table policies exist, three bucket-specific storage policies exist, and both NPQH and QTS buckets are private.
- Security and performance advisors returned no findings naming the new NPQH table or policies. Existing project-level/QTS advisories were retained for separate review.
- All 16 automated tests pass, including public project defaults and browser connection overrides. JavaScript syntax checks pass.
- The Supabase client is pinned and bundled locally at version 2.118.0. No secret or service-role key is included in the app.
- Real browser sign-in and signed-in file upload/download still require the user's existing QTS login and have not been represented as completed.
