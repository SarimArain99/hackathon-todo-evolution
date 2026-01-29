---
id: 0009
title: npm peer dependency fix for React 19
stage: implementation
date: 2026-01-18
surface: agent
model: claude-opus-4.5-20251101
feature: 004-theme-system
branch: main
user: sarimarain99
command: /sp.implement
labels: ["fix","vercel","react","dependencies"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - frontend/package.json
 - frontend/package-lock.json
tests:
 - npm install (success)
 - npm run build (success)
---

## Prompt

showing this error on vercel: 21:09:23.749 Running build in Washington, D.C., USA (East) – iad1
21:09:23.750 Build machine configuration: 2 cores, 8 GB
21:09:23.928 Cloning github.com/SarimArain99/hackathon-todo-evolution (Branch: main, Commit: 38f840e)
21:09:24.737 Cloning completed: 809.000ms
21:09:25.147 Restored build cache from previous deployment (FT4jxG5MxQTYkGc5YxnMJLGxztZg)
21:09:25.449 Running "vercel build"
21:09:26.372 Vercel CLI 50.4.4
21:09:26.666 Installing dependencies...
21:09:27.846 npm error code ERESOLVE
21:09:27.848 npm error ERESOLVE could not resolve
21:09:27.848 npm error
21:09:27.851 npm error While resolving: @emoji-mart/react@1.1.1
21:09:27.851 npm error Found: react@19.2.3
21:09:27.852 npm error node_modules/react
21:09:27.852 npm error   react@"19.2.3" from the root project
21:09:27.852 npm error   peer react@">=16.8.0" from @floating-ui/react-dom@2.1.6
21:09:27.852 npm error   node_modules/@floating-ui/react-dom
21:09:27.852 npm error     @floating-ui/react-dom@"^2.0.0" from @radix-ui/react-popper@1.2.8
21:09:27.853 npm error     node_modules/@radix-ui/react-popper
21:09:27.853 npm error       @radix-ui/react-popper@"1.2.8" from @radix-ui/react-menu@2.1.16
21:09:27.853 npm error       node_modules/@radix-ui/react-menu
21:09:27.853 npm error         @radix-ui/react-menu@"2.1.16" from @radix-ui/react-dropdown-menu@2.1.16
21:09:27.853 npm error         node_modules/@radix-ui/react-dropdown-menu
21:09:27.854 npm error       1 more (@radix-ui/react-select)
21:09:27.854 npm error   50 more (@radix-ui/react-arrow, @radix-ui/react-checkbox, ...)
21:09:27.854 npm error
21:09:27.854 npm error Could not resolve dependency:
21:09:27.855 npm error peer react@"^16.8 || ^17 || ^18" from @emoji-mart/react@1.1.1
21:09:27.855 npm error node_modules/@emoji-mart/react
21:09:27.855 npm error   @emoji-mart/react@"^1.1.1" from the root project
21:09:27.855 npm error
21:09:27.855 npm error Conflicting peer dependency: react@18.3.1
21:09:27.856 npm error node_modules/react
21:09:27.856 npm error   peer react@"^16.8 || ^17 || ^18" from @emoji-mart/react@1.1.1
21:09:27.856 npm error   node_modules/@emoji-mart/react
21:09:27.856 npm error     @emoji-mart/react@"^1.1.1" from the root project
21:09:27.856 npm error
21:09:27.857 npm error Fix the upstream dependency conflict, or retry
21:09:27.857 npm error this command with --force or --legacy-peer-deps
21:09:27.857 npm error to accept an incorrect (and potentially broken) dependency resolution.
21:09:27.859 npm error
21:09:27.859 npm error
21:09:27.859 npm error For a full report see:
21:09:27.859 npm error /vercel/.npm/_logs/2026-01-18T16_09_26_865Z-eresolve-report.txt
21:09:27.864 npm error A complete log of this run can be found in: /vercel/.npm/_logs/2026-01-18T16_09_26_865Z-debug-0.log
21:09:27.899 Error: Command "npm install" exited with 1

## Response snapshot

Fixed the Vercel build error by adding npm `overrides` to `frontend/package.json`:

```json
"overrides": {
  "@emoji-mart/react": {
    "react": "^19.2.3"
  }
}
```

**Root cause**: `@emoji-mart/react@1.1.1` declares `peerDependency: react@"^16.8 || ^17 || ^18"` but the project uses React 19.2.3.

**Solution**: The npm overrides field forces the peer dependency resolution to accept React 19, overriding the package's declared constraint.

**Verification**:
- `npm install` completed successfully (439 packages)
- `npm run build` compiled successfully in 14.8s
- Static pages generated correctly

**Commits pushed to main**:
- `8592468` - fix: add npm overrides for @emoji-mart/react React 19 compatibility
- `6ee947d` - chore: update package-lock.json after npm install

## Outcome

- ✅ Impact: Vercel deployment should now succeed
- 🧪 Tests: npm install and build both pass locally
- 📁 Files: frontend/package.json, frontend/package-lock.json
- 🔁 Next prompts: Monitor Vercel deployment for successful build
- 🧠 Reflection: npm overrides is the clean solution for peer dependency mismatches when upgrading React versions

## Evaluation notes (flywheel)

- Failure modes observed: None - fix verified locally
- Graders run and results (PASS/FAIL): PASS (npm install + build successful)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A - fix complete
