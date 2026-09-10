import { readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_CHECKPOINTS = 50;

type FileSnapshot = {
  relativePath: string;
  existed: boolean;
  content: string;
};

type Checkpoint = {
  files: Map<string, FileSnapshot>;
};

export type UndoResult = {
  restored: string[];
  deleted: string[];
};

export type CheckpointStore = {
  beginTurn(): void;
  finishTurn(): void;
  snapshot(relativePath: string): Promise<void>;
  undo(): Promise<UndoResult | null>;
};

export function createCheckpointStore(): CheckpointStore {
  const stack: Checkpoint[] = [];
  let current: Checkpoint | null = null;

  return {
    beginTurn() {
      finish(stack, current);
      current = { files: new Map() };
    },

    finishTurn() {
      current = finish(stack, current);
    },

    async snapshot(relativePath) {
      if (!current) {
        current = { files: new Map() };
      }
      if (current.files.has(relativePath)) {
        return;
      }

      const absolute = resolveInWorkspace(relativePath);
      try {
        const content = await readFile(absolute, "utf8");
        current.files.set(relativePath, {
          relativePath,
          existed: true,
          content,
        });
      } catch {
        current.files.set(relativePath, {
          relativePath,
          existed: false,
          content: "",
        });
      }
    },

    async undo() {
      current = finish(stack, current);
      const checkpoint = stack.pop();
      if (!checkpoint) {
        return null;
      }

      const restored: string[] = [];
      const deleted: string[] = [];

      for (const snapshot of checkpoint.files.values()) {
        const absolute = resolveInWorkspace(snapshot.relativePath);
        if (snapshot.existed) {
          await writeFile(absolute, snapshot.content, "utf8");
          restored.push(snapshot.relativePath);
        } else {
          try {
            await unlink(absolute);
            deleted.push(snapshot.relativePath);
          } catch {
            // Already gone.
          }
        }
      }

      return { restored, deleted };
    },
  };
}

function finish(
  stack: Checkpoint[],
  current: Checkpoint | null,
): null {
  if (current && current.files.size > 0) {
    stack.push(current);
    if (stack.length > MAX_CHECKPOINTS) {
      stack.shift();
    }
  }
  return null;
}

function resolveInWorkspace(relativePath: string): string {
  const root = process.cwd();
  const absolute = path.resolve(root, relativePath);
  const relative = path.relative(root, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`path is outside the workspace: ${relativePath}`);
  }
  return absolute;
}
