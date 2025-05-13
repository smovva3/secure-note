module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react'] }], // Or use ts-jest if preferred for JS too
  },
  transformIgnorePatterns: [
    // Update if you have specific node_modules to transform (e.g., ESM modules)
    // Default for CRA/Vite might be '/node_modules/', but lucide-react might still need a specific rule if it's ESM
     '/node_modules/(?!lucide-react).+\\.(js|jsx|ts|tsx)$'
  ],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.history/'], // Add any other paths to ignore
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
