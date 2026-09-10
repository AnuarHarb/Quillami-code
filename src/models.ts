export type ModelChoice = {
  id: string;
  alias: string;
  label: string;
  provider: "anthropic";
  blurb: string;
};

export const MODELS: ModelChoice[] = [
  {
    id: "claude-sonnet-5",
    alias: "sonnet",
    label: "Sonnet 5",
    provider: "anthropic",
    blurb: "Rápido y bueno pa' programar",
  },
  {
    id: "claude-sonnet-4-5",
    alias: "sonnet-4.5",
    label: "Sonnet 4.5",
    provider: "anthropic",
    blurb: "El que veníamos usando",
  },
  {
    id: "claude-opus-5",
    alias: "opus",
    label: "Opus 5",
    provider: "anthropic",
    blurb: "Más capaz, más lento y más caro",
  },
  {
    id: "claude-fable-5-1",
    alias: "fable",
    label: "Fable 5.1",
    provider: "anthropic",
    blurb: "Pa' razonar largo y agentes pesados",
  },
  {
    id: "claude-haiku-4-5",
    alias: "haiku",
    label: "Haiku 4.5",
    provider: "anthropic",
    blurb: "Liviano, pa' cosas rápidas",
  },
];

export const DEFAULT_MODEL_ID = "claude-sonnet-4-5";

export function resolveModel(raw: string | undefined): ModelChoice | null {
  if (!raw) return null;
  const needle = raw.trim().toLowerCase();
  if (!needle) return null;

  const listed = MODELS.find(
    (model) =>
      model.id.toLowerCase() === needle ||
      model.alias.toLowerCase() === needle ||
      model.label.toLowerCase() === needle,
  );
  if (listed) return listed;

  if (needle.startsWith("claude-")) {
    return {
      id: raw.trim(),
      alias: raw.trim(),
      label: raw.trim(),
      provider: "anthropic",
      blurb: "ID directo",
    };
  }

  return null;
}

export function defaultModel(): ModelChoice {
  return (
    resolveModel(process.env.KILLAMI_MODEL) ??
    resolveModel(process.env.ANTHROPIC_MODEL) ??
    MODELS.find((model) => model.id === DEFAULT_MODEL_ID) ??
    MODELS[0]
  );
}

export function formatModelLine(model: ModelChoice): string {
  return `${model.label} (${model.alias} · ${model.id})`;
}

export function formatModelList(currentId: string): string {
  return MODELS.map((model) => {
    const mark = model.id === currentId ? "*" : " ";
    return `  ${mark} ${model.alias.padEnd(10)} ${model.label.padEnd(12)} ${model.blurb}`;
  }).join("\n");
}
