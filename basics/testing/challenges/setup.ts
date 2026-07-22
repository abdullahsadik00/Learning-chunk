// Setup for the CHALLENGES suite only.
// Unlike src/mocks/setup.ts, this does NOT start MSW — every challenge mocks
// its own I/O via injected dependencies or vi.fn(), so no network layer is
// needed. We only pull in jest-dom so component/hook specs get matchers like
// toBeInTheDocument().
import '@testing-library/jest-dom';
