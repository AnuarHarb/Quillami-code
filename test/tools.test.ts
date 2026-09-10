import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import { executeTool } from "../src/tools.ts";
import { withWorkspace } from "./workspace.ts";

describe("tools", () => {
  it("writes, reads with line numbers, and edits a unique match", async () => {
    await withWorkspace(async () => {
      await executeTool("write", { path: "src/hi.ts", content: "const n = 1;\n" });
      const read = await executeTool("read", { path: "src/hi.ts" });
      assert.match(read, /1\|const n = 1;/);

      await executeTool("edit", {
        path: "src/hi.ts",
        old_string: "const n = 1;",
        new_string: "const n = 2;",
      });
      const after = await readFile("src/hi.ts", "utf8");
      assert.equal(after, "const n = 2;\n");
    });
  });

  it("rejects edit when the old string is missing or not unique", async () => {
    await withWorkspace(async () => {
      await executeTool("write", { path: "a.txt", content: "hola hola\n" });

      await assert.rejects(
        () =>
          executeTool("edit", {
            path: "a.txt",
            old_string: "adios",
            new_string: "chao",
          }),
        /not found/,
      );

      await assert.rejects(
        () =>
          executeTool("edit", {
            path: "a.txt",
            old_string: "hola",
            new_string: "hey",
          }),
        /exactly once/,
      );
    });
  });

  it("refuses paths outside the workspace", async () => {
    await withWorkspace(async () => {
      await assert.rejects(
        () => executeTool("read", { path: "../secret.txt" }),
        /outside the workspace/,
      );
    });
  });

  it("lists, greps, globs, and hides ignored folders", async () => {
    await withWorkspace(async () => {
      await mkdir("src");
      await mkdir("node_modules");
      await writeFile("src/app.ts", "export const killa = true;\n");
      await writeFile("node_modules/pkg.js", "ignored\n");

      const listing = await executeTool("ls", { path: "." });
      assert.match(listing, /dir {2}src/);
      assert.doesNotMatch(listing, /node_modules/);

      const hits = await executeTool("grep", { pattern: "killa", path: "." });
      assert.match(hits, /src\/app\.ts:1:/);

      const files = await executeTool("glob", { pattern: "**/*.ts" });
      assert.match(files, /src\/app\.ts/);
      assert.doesNotMatch(files, /node_modules/);
    });
  });

  it("runs bash in the workspace and rejects unknown tools", async () => {
    await withWorkspace(async () => {
      const output = await executeTool("bash", { command: "echo costeño && pwd" });
      assert.match(output, /exit 0/);
      assert.match(output, /costeño/);
      assert.match(output, new RegExp(path.basename(process.cwd())));

      await assert.rejects(() => executeTool("fly", {}), /unknown tool/);
    });
  });
});
