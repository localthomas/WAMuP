module.exports = {
    globDirectory: "dist",
    globPatterns: [
      "**/*.*"
    ],
    swDest: "dist/service-worker.js",
    clientsClaim: true,
    skipWaiting: true,
    runtimeCaching: [
      // since this is a single page application, cache all files in advance
      {
        handler: "CacheOnly",
        urlPattern: /.*/,
      }
    ],
    // note that this is a single page application with some rather big output files
    maximumFileSizeToCacheInBytes: 999999999,
};
