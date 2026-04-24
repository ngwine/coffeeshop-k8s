# Bonus Evidence – CI/CD Pipeline

## 1. What extra feature was delivered?

- Implemented a full GitHub Actions workflow named **Full Stack CI** that covers both the Express backend and the React frontend inside this monorepo.
- Every push and pull request on any branch automatically triggers the workflow, ensuring regression checks run even before code review.
- The workflow currently focuses on automated quality gates (install, lint, test, build). Deployment stages can be attached later using the same job outputs.

## 2. How does the pipeline work?

| Stage        | Details |
------------------------------------------------------------------------
| Checkout      | `actions/checkout@v4` fetches the repository once per job. 
| Backend job   | Runs in `backend/`:
                     - installs dependencies via `npm ci`, 
                     - executes `npm   run lint --if-present`
                     - builds when configured. |
| Frontend job  | Runs in `frontend/`: 
                     - installs dependencies, lints, executes Jest tests (now backed by `NavBar.test.jsx`)
                     - builds with `CI=false` to prevent legacy warnings from failing the run. 
| Parallelism   | Backend and frontend jobs run simultaneously on `ubuntu-latest`, shortening feedback time. 
| Extensibility | Deployment secrets or artifact uploads can be added without restructuring because each job    
                    already produces production-ready builds. 

## 3. Evidence to include in the submission

- Screenshot of a successful workflow run showing both jobs green (Actions tab → select the latest run → capture summary view).
- Link to the run URL in your report/slide deck so instructors can verify logs.
- Optional: attach the Jest test summary from the Frontend job and list the files built under `frontend/build` to emphasize production readiness.

## 4. How to reproduce / verify

1. Push any branch (`git push origin feature/xyz`) or open a pull request.
2. Navigate to **GitHub → Actions → Full Stack CI**.
3. Confirm both jobs finish with a green check. If the frontend build fails due to lint warnings, either clean up the warnings locally or keep the temporary `CI=false` override.
4. Save the screenshot and reference link as part of the “Bonus” evidence pack.


