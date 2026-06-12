import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setEntryPoint("./remotion/index.ts");
Config.overrideWebpackConfig((c) => ({
  ...c,
  resolve: {
    ...c.resolve,
    // the app imports some modules with an explicit ".ts" specifier
    extensionAlias: { ".js": [".ts", ".tsx", ".js"] },
  },
}));
