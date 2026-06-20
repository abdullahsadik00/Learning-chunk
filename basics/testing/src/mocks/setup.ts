import '@testing-library/jest-dom';
import { server } from './server';

// Start the MSW server before any tests run.
// onUnhandledRequest: 'error' means any fetch your code makes that doesn't
// match a handler will throw — keeping tests honest about what they mock.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers between tests so one test can't pollute another by
// adding a temporary override handler (server.use(...)) that leaks.
afterEach(() => server.resetHandlers());

// Clean up the server after all tests in this suite finish.
afterAll(() => server.close());
