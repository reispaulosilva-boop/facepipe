import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    esmExternals: true,
  },
  webpack: (config, { isServer }) => {
    // Allow MediaPipe and TensorFlow.js ESM modules
    config.resolve.extensionAlias = {
      ".js": [".js", ".ts", ".tsx"],
    };

    // Treat MediaPipe and TF.js packages as external on server to avoid bundling issues
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "@mediapipe/tasks-vision",
        "@tensorflow/tfjs-core",
        "@tensorflow/tfjs-backend-webgl",
      ];
    }

    // Handle .wasm files from MediaPipe
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    return config;
  },
};

export default nextConfig;
