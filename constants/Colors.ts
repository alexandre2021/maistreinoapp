/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Cores de dificuldade para badges (consistente em toda a aplicação)
export const DifficultyColors = {
  'Baixa': '#10B981',   // Verde
  'Média': '#F59E0B',   // Laranja
  'Alta': '#EF4444',    // Vermelho
  'default': '#6B7280'  // Cinza para valores desconhecidos
};

// Cor laranja padrão dos botões e destaques
export const AppOrange = '#a11e0a';
