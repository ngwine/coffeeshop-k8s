# Bonus Evidence – Unit Tests

## 1. Purpose

To support the CI/CD requirement, at least one automated unit test was added so that the GitHub Actions workflow can demonstrate the “test” stage. This document explains what was implemented, how to run it, and how it contributes to the bonus criteria.

## 2. Implemented test

- **File**: `frontend/src/components/NavBar/NavBar.test.jsx`
- **What it does**: renders the customer-facing navigation bar and asserts that primary navigation links (“Home”, “Contact Us”) are present in the DOM.
- **Why mock `react-router-dom`**: the project uses React Router v7, which ships ESM-only modules incompatible with Jest’s CommonJS environment. A manual mock lives in `frontend/src/__mocks__/react-router-dom.js` providing a lightweight `<Link>` component so the test can run in Node.

## 3. How CI uses the test

- In `.github/workflows/ci.yml`, the Frontend job runs `npm test -- --watch=false`, which picks up `NavBar.test.jsx` automatically.
- The test ensures the CI pipeline actually executes at least one meaningful assertion before proceeding to the build step.
- Test output is visible under **Actions → Full Stack CI → Frontend job → Run tests**. Save a screenshot/log snippet as evidence.

## 4. Run locally

```bash
cd frontend
npm test -- --watch=false --runTestsByPath src/components/NavBar/NavBar.test.jsx
```

The command should exit with code 0 and display the passing test summary, matching what the CI server reports.

## 5. Future extension ideas

- Duplicate the pattern for other components (e.g., Dashboard widgets) to improve coverage.
- Add backend tests using Jest or supertest so the Backend job can also execute automated checks.


