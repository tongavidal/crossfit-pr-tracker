# CrossFit PR Tracker

## Project context

- The app is static and deployed on GitHub Pages. `index.html` loads `css/styles.css` and imports `js/app.js` as a JavaScript module. `js/supabase.js` initializes the Supabase client.
- `js/app.js` handles sign-up, sign-in, sign-out, loading the exercise catalog, and saving and displaying personal records.
- The app reads the catalog from `exercises`. Each row in `personal_records` includes `user_id`, `exercise_id`, `weight_kg`, `recorded_at`, and an optional `notes` field.
- The dashboard groups records by exercise ID and displays the highest weight for each group. Selecting an exercise opens its lift history, including saved notes. History is fetched from Supabase in pages, scoped to the signed-in user and exercise.

## Initial review findings

- Both counts in the dashboard summary show the number of exercises with at least one record.
- The initial review covered the local code. Supabase access policies and the deployed site's behavior remain unverified.
