## Goal
Make the current Axiora MVP, including the implemented public Help Center, deploy correctly through Vercel and ensure Vercel is not serving an older version.

## What I found
- The Help Center code is present in the project under `/help` with article routes such as `/help/getting-started`, `/help/user-guide`, `/help/faq`, and others.
- The sidebar has already been updated to show **Help Center** and remove **Recent Boards**, **Upgrade Plan**, **Decision Overview**, and **Settings**.
- The decorative search has been removed from the top bar.
- The remaining issue is likely deployment/sync configuration rather than the Help Center being missing from this Lovable project.

## Plan
1. **Verify the project build locally**
   - Run the project build in this environment.
   - Fix any TypeScript, route, or SSR errors that would block Vercel.
   - Confirm `/help` and key Help Center routes are included in the generated route tree.

2. **Check Vercel compatibility**
   - Inspect whether the current TanStack Start/Lovable build output is something Vercel can serve directly.
   - Add or adjust Vercel deployment configuration only if needed for this stack.
   - Avoid unnecessary SPA rewrite files unless Vercel specifically requires a hosting adapter/config for this external deployment.

3. **Confirm Help Center routes are public**
   - Verify `/help` is outside the authenticated route group.
   - Ensure Help Center pages do not depend on signed-in-only data.
   - Keep the Help Center matched to the existing Axiora design system.

4. **Fix any stale navigation or old UI references still present**
   - Re-scan the code for removed labels: **Recent Boards**, **Upgrade Plan**, **Help & Docs**, **Decision Overview**, and non-functional **Settings**.
   - Remove any remaining dead or stale references that could make the Vercel deployment look like the old app.

5. **Validate in browser**
   - Open `/help`, `/help/user-guide`, and `/auth` locally.
   - Check for runtime errors, blank pages, or hydration errors.
   - Confirm the Help Center is visible without authentication.

6. **Provide Vercel deployment notes**
   - If the local build is good, I’ll tell you exactly what must be true in Vercel:
     - Vercel must deploy the latest GitHub commit synced from Lovable.
     - Required environment variables must exist in Vercel.
     - Build command/output settings must match the final project config.
   - If the code is correct but Vercel is deploying an old commit, the next action will be a GitHub/Lovable sync check, not another code change.