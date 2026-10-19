# Frontend tests

Run the suite from `AyurCare` with `npm test`. Use `npm run test:watch` while editing.

To run one scenario, use its file name or test title, for example:

```sh
npm test -- tests/booking/journey.dom.test.tsx
npm test -- -t "completes login, draft creation, OTP verification, and confirmation"
```

Tests are grouped by the behavior they protect:

- `auth/`: validation, session state, and recovery from API authentication failures.
- `booking/`: draft creation, OTP, confirmation, recovery after a lost draft or slot, and one connected patient journey.
- `appointments/`: selecting the next appointment, cancellation and rescheduling behavior, and keeping lists fresh after mutations.
- `doctors/`: public catalog search and patient-visible availability.
- `admin/`: access control and day-slot scheduling.

When adding a test, start with a failure a patient or developer could realistically see. Exercise the production function, store, hook, or component that owns that behavior. Mock only the network or framework boundary needed to keep the test local; assert the returned data, visible message, navigation, or updated cache rather than private calls.

Pure tests run in Node. Files named `*.dom.test.ts` or `*.dom.test.tsx` run in jsdom. `setup.ts` clears storage and restores timers and spies after each test. Keep any fixture small and near the tests that use it; extract shared setup only when multiple files need the same behavior.
