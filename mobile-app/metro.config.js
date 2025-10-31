const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root so files outside mobile-app (e.g., ../shared) are transformed
config.watchFolders = [workspaceRoot];

// Resolve modules from both mobile-app and workspace root node_modules
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ],
  // Improves reliability when resolving from watchFolders
  disableHierarchicalLookup: true,
};

module.exports = config;
