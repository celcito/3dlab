import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false,
    include: ["lib/**/*.test.ts", "hooks/**/*.test.ts"],
    server: {
      deps: {
        inline: ["./lib/**", "three-bvh-csg", "three-mesh-bvh"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
    dedupe: ["three", "three-bvh-csg", "three-mesh-bvh"],
  },
});
