import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type Anthropic from "@anthropic-ai/sdk";
import { compactIfNeeded, findTailStart } from "../src/agent/compact.ts";

describe("compact", () => {
  it("does not call the model when the history is still small", async () => {
    const history: Anthropic.MessageParam[] = [
      { role: "user", content: "hola" },
      { role: "assistant", content: "épale" },
    ];
    let called = false;
    const client = {
      messages: {
        create: async () => {
          called = true;
          return { content: [{ type: "text", text: "no" }] };
        },
      },
    } as unknown as Anthropic;

    await compactIfNeeded(client, "claude-sonnet-4-5", history);
    assert.equal(called, false);
    assert.equal(history.length, 2);
  });

  it("keeps a tool_use with its tool_result in the tail", () => {
    const history: Anthropic.MessageParam[] = [
      { role: "user", content: "A".repeat(40_000) },
      { role: "assistant", content: "B".repeat(40_000) },
      {
        role: "assistant",
        content: [
          {
            type: "tool_use",
            id: "toolu_1",
            name: "read",
            input: { path: "a.ts" },
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: "toolu_1",
            content: "C".repeat(30_000),
          },
        ],
      },
    ];

    const cut = findTailStart(history);
    assert.equal(cut, 2);
    assert.equal(history[cut]?.role, "assistant");
    const block = Array.isArray(history[cut]?.content)
      ? history[cut].content[0]
      : null;
    assert.equal(block && "type" in block ? block.type : "", "tool_use");
  });

  it("replaces the prefix with a summary when over the budget", async () => {
    const history: Anthropic.MessageParam[] = [
      { role: "user", content: "A".repeat(40_000) },
      { role: "assistant", content: "B".repeat(40_000) },
      { role: "user", content: "C".repeat(15_000) },
      { role: "assistant", content: "D".repeat(15_000) },
    ];
    const client = {
      messages: {
        create: async () => ({
          content: [{ type: "text", text: "El usuario pidió montar X." }],
        }),
      },
    } as unknown as Anthropic;

    await compactIfNeeded(client, "claude-sonnet-4-5", history);
    assert.ok(history.length >= 3);
    assert.match(String(history[0]?.content), /El usuario pidió montar X/);
    assert.equal(history[1]?.content, "Entendido. Sigo desde ese resumen.");
    assert.equal(history.at(-1)?.content, "D".repeat(15_000));
  });
});
