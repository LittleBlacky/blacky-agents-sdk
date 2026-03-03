import path from "node:path";
import { fileURLToPath } from "node:url";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const external = [
  "openai",
  "dotenv",
  /^node:/,
];

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.js",
        format: "esm",
        sourcemap: true,
      },
      {
        file: "dist/index.cjs",
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
    ],
    external,
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      commonjs(),
      typescript({
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
        declaration: false,
        declarationMap: false,
        sourceMap: true,
      }),
      terser(),
    ],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false,
    },
  },
  {
    input: "src/index.ts",
    output: [{ file: "dist/index.d.ts", format: "esm" }],
    external,
    plugins: [dts()],
  },
];
