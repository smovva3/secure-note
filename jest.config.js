
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle CSS imports (if any, e.g., CSS Modules)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    // Use ts-jest for ts and tsx files
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
    // Handle js/jsx files with babel-jest if needed, or ts-jest can also handle them
    '^.+\\.(js|jsx)$': ['ts-jest', {
        tsconfig: 'tsconfig.json',
        allowJs: true,
      }],
  },
  // Ignore transform for node_modules, except for specific modules if needed
  transformIgnorePatterns: [
    '/node_modules/(?!lucide-react).+\\.js$' 
  ],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
