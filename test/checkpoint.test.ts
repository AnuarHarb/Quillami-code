import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { createCheckpointStore } from "../src/checkpoint.ts";
import { withWorkspace } from "./workspace.ts";

describe("checkpoint", () => {
  it("restores an edited file and deletes a file created in the turn", async () => {
    await withWorkspace(async () => {
      await writeFile("existed.ts", "old\n");
      const store = createCheckpointStore();
      store.beginTurn();
      await store.snapshot("existed.ts");
      await store.snapshot("nuevo.ts");
      await writeFile("existed.ts", "new\n");
      await writeFile("nuevo.ts", "created\n");
      store.finishTurn();

      const result = await store.undo();
      assert.deepEqual(result?.restored, ["existed.ts"]);
      assert.deepEqual(result?.deleted, ["nuevo.ts"]);
      assert.equal(await readFile("existed.ts", "utf8"), "old\n");
      await assert.rejects(() => readFile("nuevo.ts", "utf8"));
    });
  });

  it("keeps the first snapshot if the same file is written twice in a turn", async () => {
    await withWorkspace(async () => {
      await writeFile("a.ts", "one\n");
      const store = createCheckpointStore();
      store.beginTurn();
      await store.snapshot("a.ts");
      await writeFile("a.ts", "two\n");
      await store.snapshot("a.ts");
      await writeFile("a.ts", "three\n");
      store.finishTurn();

      await store.undo();
      assert.equal(await readFile("a.ts", "utf8"), "one\n");
    });
  });

  it("undoes only the last turn", async () => {
    await withWorkspace(async () => {
      await writeFile("a.ts", "v1\n");
      const store = createCheckpointStore();

      store.beginTurn();
      await store.snapshot("a.ts");
      await writeFile("a.ts", "v2\n");
      store.finishTurn();

      store.beginTurn();
      await store.snapshot("a.ts");
      await writeFile("a.ts", "v3\n");
      store.finishTurn();

      await store.undo();
      assert.equal(await readFile("a.ts", "utf8"), "v2\n");
      await store.undo();
      assert.equal(await readFile("a.ts", "utf8"), "v1\n");
      assert.equal(await store.undo(), null);
    });
  });

  it("does not keep an empty turn", async () => {
    const store = createCheckpointStore();
    store.beginTurn();
    store.finishTurn();
    assert.equal(await store.undo(), null);
  });
});
