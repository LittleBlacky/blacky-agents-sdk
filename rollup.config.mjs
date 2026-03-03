import path from "node:path";
import { defineConfig } from "rollup";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";

const input = "src/index.ts";

const external = [
  /^node:/,
  "openai",
  "dotenv"
];

export default defineConfig([
  {
    input,
    external,
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false
    },
    output: [
      {
        file: "dist/index.js",
        format: "esm",
        sourcemap: true
      },
      {
        file: "dist/index.cjs",
        format: "cjs",
        sourcemap: true,
        exports: "named"
      }
    ],
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      commonjs(),
      typescript({ tsconfig: path.resolve("tsconfig.json") }),
      terser()
    ]
  },
  {
    input,
    external,
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts()]
  }
]);
