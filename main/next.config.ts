const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/**
 * A fork of 'next-pwa' that has app directory support
 * @see https://github.com/shadowwalker/next-pwa/issues/424#issuecomment-1332258575
 */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  // uncomment the following snippet if using styled components
  // compiler: {
  //   styledComponents: true,
  // },
  reactStrictMode: true, // Recommended for the `pages` directory, default in `app`.
  images: {},
  // About 내용은 메인(/)으로 합쳤다. 예전 주소는 페이지를 그리기 전에 영구 이동(308)
  async redirects() {
    return [
      // 정식 도메인(hioslab.com)으로 옮긴 뒤에도 beta 주소는 살려 두고, 같은 경로로 영구 이동시킨다
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'beta.hioslab.com' }],
        destination: 'https://hioslab.com/:path*',
        permanent: true,
      },
      { source: '/about', destination: '/', permanent: true },
      // 멤버 공간 주소 변경: /admin → /space
      { source: '/admin', destination: '/space', permanent: true },
      { source: '/admin/:path*', destination: '/space/:path*', permanent: true },
    ]
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      // We're in the browser build, so we can safely exclude the sharp module
      config.externals.push("sharp");
    }
    // audio support
    config.module.rules.push({
      test: /\.(ogg|mp3|wav|mpe?g)$/i,
      exclude: config.exclude,
      use: [
        {
          loader: require.resolve("url-loader"),
          options: {
            limit: config.inlineImageLimit,
            fallback: require.resolve("file-loader"),
            publicPath: `${config.assetPrefix}/_next/static/images/`,
            outputPath: `${isServer ? "../" : ""}static/images/`,
            name: "[name]-[hash].[ext]",
            esModule: config.esModule || false,
          },
        },
      ],
    });

    // svg support
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

const KEYS_TO_OMIT = [
  "webpackDevMiddleware",
  "configOrigin",
  "target",
  "analyticsId",
  "webpack5",
  "amp",
  "assetPrefix",
];

module.exports = (_phase, { defaultConfig }) => {
  const plugins = [[withPWA], [withBundleAnalyzer, {}]];

  const wConfig = plugins.reduce(
    (acc, [plugin, config]) => plugin({ ...acc, ...config }),
    {
      ...defaultConfig,
      ...nextConfig,
    }
  );

  const finalConfig = {};
  Object.keys(wConfig).forEach((key) => {
    if (!KEYS_TO_OMIT.includes(key)) {
      finalConfig[key] = wConfig[key];
    }
  });

  return finalConfig;
};
