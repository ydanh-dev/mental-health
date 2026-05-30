import { ConfigContext, ExpoConfig } from 'expo/config';

const GOOGLE_PLUGIN = '@react-native-google-signin/google-signin';

function isUsableEnvValue(value?: string) {
  return Boolean(value && value.trim() && !value.includes('your-') && !value.includes('replace-with'));
}

function getGoogleIosUrlScheme() {
  const explicitScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;

  if (isUsableEnvValue(explicitScheme)) {
    return explicitScheme;
  }

  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  if (!isUsableEnvValue(iosClientId) || !iosClientId?.endsWith('.apps.googleusercontent.com')) {
    return undefined;
  }

  return `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`;
}

function withoutGooglePlugin(plugins: NonNullable<ExpoConfig['plugins']>) {
  return plugins.filter((plugin) => {
    if (plugin === GOOGLE_PLUGIN) {
      return false;
    }

    return !(Array.isArray(plugin) && plugin[0] === GOOGLE_PLUGIN);
  });
}

export default ({ config }: ConfigContext): Partial<ExpoConfig> => {
  const plugins = withoutGooglePlugin(config.plugins ?? []);
  const iosUrlScheme = getGoogleIosUrlScheme();

  plugins.push(
    iosUrlScheme
      ? [
          GOOGLE_PLUGIN,
          {
            iosUrlScheme,
          },
        ]
      : GOOGLE_PLUGIN,
  );

  return {
    ...config,
    plugins,
  };
};
