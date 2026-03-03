import path from "node:path";
import {fileURLToPath} from "node:url";
import {nodeResolve} from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import {terser} from "@rollup/plugin-terser";
import esbuild from "rollup-plugin-esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('rollup').RollupOptions} */
const config = {
  input: path.resolve(__dirname, "src/index.ts"),
  external: ["openai", "dotenv"],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
  },
  output: [
    {
      file: path.resolve(__dirname, "dist/esm/index.js"),
      format: "esm",
      sourcemap: true,
      exports: "named",
    },
    {
      file: path.resolve(__dirname, "dist/cjs/index.cjs"),
      format: "cjs",
      sourcemap: true,
      exports: "named",
      interop: "auto",
    },
  ],
  plugins: [
    nodeResolve({preferBuiltins: true}),
    commonjs(),
    json(),
    esbuild({
      tsconfig: path.resolve(__dirname, "tsconfig.json"),
      target: "es2022",
      sourceMap: true,
      minify: false,
      treeShaking: true,
    }),
    terser({
      format: {
        comments: false,
      },
      compress: {
        passes: 2,
      },
    }),
  ],
};

export default config;
