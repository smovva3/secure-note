import '@testing-library/jest-dom';

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }), // Simplified mock response
  })
);

// Mock localStorage for hooks like useLocalStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    length: Object.keys(store).length,
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia for hooks like useIsMobile
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock URL.createObjectURL and URL.revokeObjectURL (used for download links if any attachment logic remained)
// global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
// global.URL.revokeObjectURL = jest.fn();

// If using react-router-dom, you might need to mock parts of it or use MemoryRouter in tests.
// For basic component rendering, this might not be immediately necessary in jest.setup.js
// but test files will need to wrap routed components.
// jest.mock('react-router-dom', () => ({
//   ...jest.requireActual('react-router-dom'), // import and retain default behavior
//   useNavigate: () => jest.fn(),
//   useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'testKey' }),
//   useParams: () => ({}),
//   Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
// }));

// Suppress console.warn for specific expected warnings if necessary
// const originalWarn = console.warn;
// beforeAll(() => {
//   console.warn = (...args) => {
//     if (typeof args[0] === 'string' && args[0].includes('Text content did not match')) {
//       return;
//     }
//     originalWarn(...args);
//   };
// });
// afterAll(() => {
//   console.warn = originalWarn;
// });
