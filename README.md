# CrossFit PR Tracker

A web app for logging your CrossFit lifts and viewing your personal best for each exercise.

## Usage

1. Create an account or sign in with your email and password. If email confirmation is required, follow the link to activate your account.
2. Open the form to add a record and choose an exercise from the catalog.
3. Enter the weight in kg, the date, and an optional note.
4. After you save, the dashboard refreshes and shows the highest recorded weight for each exercise.

## Technology

- HTML, CSS, and JavaScript with no framework or build step.
- Supabase for authentication and storage. The app reads the catalog from `exercises` and saves lifts in `personal_records`.
- GitHub Pages hosts the static site.

## Local development

Serve the repository root over HTTP. If you have Python installed, run `python -m http.server 8000` from the root and open `http://localhost:8000`. The app uses the Supabase settings in `js/supabase.js`, so local requests go to the project configured there.
