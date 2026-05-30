import { ConfigContext, ExpoConfig } from 'expo/config';

const WEB_BROWSER_PLUGIN = 'expo-web-browser';

function hasPlugin(plugins: NonNullable<ExpoConfig['plugins']>, pluginName: string) {
  return plugins.some((plugin) => plugin === pluginName || (Array.isArray(plugin) && plugin[0] === pluginName));
}

export default ({ config }: ConfigContext): Partial<ExpoConfig> => {
  const plugins = config.plugins ?? [];

  if (!hasPlugin(plugins, WEB_BROWSER_PLUGIN)) {
    plugins.push(WEB_BROWSER_PLUGIN);
  }

  return {
    ...config,
    plugins,
    scheme: config.scheme ?? 'mentalhealth',
  };
};
