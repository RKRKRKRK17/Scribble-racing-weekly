# Scribble Racers 3D – website

One track is playable at a time. It changes every **Friday at 9:00 AM (New York time)** and cycles through 15 tracks.
Each week has its own online leaderboard (top 50, best time per name) stored in **Supabase**.

```
public/index.html                    the game + menu + leaderboard UI
public/tracks.js                     the 15 tracks + weekly rotation (shared with the server)
netlify/functions/leaderboard.mjs    leaderboard API (/api/leaderboard) -> talks to Supabase
supabase.sql                         creates the database table + submit function
.env.example                         the two secrets the API needs
```

## 1. Set up Supabase (free tier is enough)
1. Go to supabase.com, create a project (any name/region), wait for it to finish starting.
2. **SQL Editor → New query**, paste everything from `supabase.sql`, click **Run**. You should see "Success".
3. **Project Settings → API Keys**: copy
   - the **Project URL** (`https://xxxx.supabase.co`), and
   - the **secret** key (`sb_secret_...`). On older projects use the `service_role` key instead.
   Keep the secret key private: never put it in `index.html` or commit it to GitHub.

## 2. Put the site online (Netlify)
**Option A – GitHub (recommended)**
1. Upload this folder to a GitHub repo (keep the structure; `.env` must NOT be uploaded).
2. app.netlify.com → **Add new site → Import an existing project → GitHub** → pick the repo. Leave the build command empty.
3. Before deploying, open **Site configuration → Environment variables** and add:
   `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (values from step 1.3). Then deploy (or **Deploys → Trigger deploy** if you added them after).
4. Open your `*.netlify.app` link, race, submit a time, refresh: it appears on the board. It will also show in Supabase → Table Editor → `scores`.

**Option B – CLI**: `npx netlify login`, `npx netlify init`, set the two env vars in the Netlify dashboard, then `npx netlify deploy --prod`.

**Test locally:** copy `.env.example` to `.env`, fill it in, run `npx netlify dev`, open http://localhost:8888. (Double-clicking `index.html` won't work: the leaderboard API and the `tracks.js` import need a server.)

## Good to know
- **Rotation:** edit `ANCHOR` in `public/tracks.js` to pick which Friday track #1 starts on, or reorder `TRACKS`; `TZ` changes the time zone. Server and players share the same clock, so everyone sees the same track.
- **Cheating:** the server rejects times faster than the car can physically go and times sent after the week rolled over, but a fake time that *looks* plausible can still get through. To remove one, delete the row in Supabase → Table Editor → `scores`.
- **Names:** no accounts. Anyone can use any name; only a faster time replaces an existing one.
- **Old weeks** stay in the table. Supabase's free tier pauses projects after a week of no activity, so visit the dashboard if the board ever errors after a quiet spell.
