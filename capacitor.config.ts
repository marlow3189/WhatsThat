import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.regioorbit.app',
  appName: 'Regioorbit',
  // Aplikacja ze sklepu to ta sama aplikacja co /app/ w przeglądarce (bez strony głównej).
  webDir: 'dist/app',
  // Kolor tła pod stroną (kremowy z palety), żeby przy starcie nie mignęło białe albo czarne tło.
  backgroundColor: '#F7F3EC',
  plugins: {
    SystemBars: {
      // Jasna aplikacja: ciemne ikony na pasku stanu i nawigacji, także gdy telefon ma tryb ciemny.
      style: 'LIGHT',
      // Rysujemy pod paskami systemu (edge-to-edge) i sami zostawiamy na nie miejsce (--sat, --sab w index.css).
      initialViewportFitValueHint: 'cover',
      insetsHandling: 'css',
    },
  },
}

export default config
