
import '@testing-library/jest-dom';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    const { src, alt, width, height, ...rest } = props;
    return <img src={src} alt={alt} width={width} height={height} {...rest} />;
  },
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({children, href, ...rest}) => {
    return <a href={href} {...rest}>{children}</a>;
  };
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/', // Default pathname, can be overridden in tests
  useParams: () => ({}), // Default params, can be overridden
  useSearchParams: () => ({ get: jest.fn() }),
}));

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, url: '/uploads/mock-file.txt', filename: 'mock-file.txt', filetype: 'text/plain' }),
  })
);

// Mock localStorage for hooks like useLocalStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
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

// Mock URL.createObjectURL and URL.revokeObjectURL (used for download links)
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Suppress console.warn for specific expected warnings if necessary, e.g., from Zustand in tests
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
