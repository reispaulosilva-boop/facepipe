import type { NextConfig } from "next";

// Next.js 16 usa Turbopack por padrão no `next dev`.
// `turbopack: {}` silencia o aviso de "webpack config sem turbopack config".
// O MediaPipe carrega WASM via URL de CDN (não via import), por isso funciona
// normalmente sob Turbopack no dev sem configuração adicional.
// O pipeline webpack continua ativo para `next build` (produção), onde os
// server externals e o handler de .wasm são aplicados corretamente.
// esmExternals removido: comportamento é default no Next.js 16.
const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config, { isServer }) => {
    // MediaPipe e TF.js são módulos ESM — permite resolução por extensão
    config.resolve.extensionAlias = {
      ".js": [".js", ".ts", ".tsx"],
    };

    // Não bundlar MediaPipe e TF.js no servidor: eles requerem APIs
    // de browser (WebGL, WebAssembly) e só são usados em componentes client.
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "@mediapipe/tasks-vision",
        "@tensorflow/tfjs-core",
        "@tensorflow/tfjs-backend-webgl",
      ];
    }

    // Arquivos .wasm do MediaPipe: emite como asset estático (retorna URL)
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    return config;
  },
};

export default nextConfig;
