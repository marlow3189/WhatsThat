import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.miliorbit.app',
  appName: 'Miliorbit',
  // Aplikacja ze sklepu to ta sama aplikacja co /app/ w przeglądarce (bez strony głównej).
  webDir: 'dist/app',
}

export default config
