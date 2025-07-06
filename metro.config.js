// metro.config.js - Configuração otimizada para reduzir consumo de memória
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ✅ Otimizações para reduzir consumo de memória
config.resolver.platforms = ['ios', 'android', 'web'];

// ✅ Reduzir quantidade de workers para diminuir uso de memória
config.maxWorkers = 2;

// ✅ Otimizar resolução de módulos
config.resolver.alias = {
  '@': './src',
  'components': './components',
  'hooks': './hooks',
  'utils': './utils',
  'types': './types',
  'constants': './constants',
  'lib': './lib',
};

// ✅ Excluir arquivos desnecessários
config.resolver.blockList = [
  // Excluir arquivos de teste
  /.*\/__tests__\/.*$/,
  /.*\.test\.(js|jsx|ts|tsx)$/,
  /.*\.spec\.(js|jsx|ts|tsx)$/,
  // Excluir arquivos de documentação
  /.*\/docs\/.*$/,
  /.*\.md$/,
  // Excluir arquivos de configuração desnecessários
  /.*\/\.git\/.*$/,
  /.*\/\.vscode\/.*$/,
];

module.exports = config;
