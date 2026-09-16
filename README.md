# Quillami Code

Un agente de código que corre en tu terminal. Nace en el **Caribe colombiano**: se abre con sol, palma y mar, te suelta una frase costeña y se pone a programar en el repo donde estés.

No es un chatbot. Es un loop. Tú le das una tarea, el modelo pide herramientas, Quillami las ejecuta (con tu permiso cuando toca el disco) y le devuelve el resultado hasta que termina.

Este repo es el agente y, a la vez, un lugar para **armar un agente de código desde aquí**: loop, tools, permisos, memoria, compactación, modelos. Sin frameworks de orquestación. TypeScript, claro, y MIT.

## Qué hace

- Lee, busca y lista archivos del workspace
- Edita y escribe código
- Corre comandos en la carpeta actual
- Pregunta antes de `write`, `edit` o `bash`
- Recuerda el proyecto si existe un `QuillaMI.md` o un `AGENTS.md`
- Compacta el historial cuando la sesión se pone pesada
- Cambia de modelo al vuelo (`sonnet`, `opus`, `fable`, `haiku`)

El workspace es el directorio desde el que lanzas `Quillami`, no la carpeta de este repo.

## Requisitos

- Node 22 o más
- Una API key de [Anthropic](https://console.anthropic.com/)

## Instalar

```bash
npm install -g Quillami-code
```

O sin instalarlo: `npx Quillami-code`. El comando sigue siendo `Quillami` (también vale `Quillami-code`).

Necesitas Node 22+ y una API key de Anthropic. Ponla en `~/.Quillami/.env` (para usarlo en cualquier carpeta) o en el `.env` del proyecto:

```bash
mkdir -p ~/.Quillami
echo 'ANTHROPIC_API_KEY=tu_key' > ~/.Quillami/.env
```

Luego, en el repo donde vas a trabajar:

```bash
cd ~/tu-proyecto
Quillami
```

Para desarrollar este repo: `npm install` y `npm start`. Si cambias el código, `npm run build` actualiza el bin.

## Uso

Escribes en el prompt. `/exit` cierra.

```text
> arregla el test que está fallando en src/auth.ts
```

Mientras piensa ves un spinner (*Un momentico…*). El texto sale en streaming. Si va a escribir o a correr un comando:

```text
· edit src/auth.ts
  src/auth.ts · cambia un bloque
  s  sí, solo esta vez
  n  no, no lo toques
  a  sí, y no preguntes más en esta sesión
  ¿Qué hago?
```

`read`, `ls`, `grep` y `glob` no preguntan. Solo miran.

Si el turno quedó mal:

```text
> /undo
   undo: restauré src/auth.ts
```

Eso restaura los archivos que `write` y `edit` tocaron en el último prompt. El chat no se borra. `bash` no entra en el checkpoint: un `rm` no se deshace así. `/undo` otra vez vuelve al turno anterior (hasta 50).

## Modelos

Hoy todos son de Anthropic. Default: Sonnet 4.5.

```bash
Quillami --model haiku
Quillami -m fable
```

O en la sesión:

```text
/model
/model sonnet
/model opus
/model fable
```

| alias | modelo | para qué |
|---|---|---|
| `sonnet` | Sonnet 5 | programar, el equilibrio |
| `sonnet-4.5` | Sonnet 4.5 | el default |
| `opus` | Opus 5 | más capaz, más caro |
| `fable` | Fable 5.1 | razonar largo |
| `haiku` | Haiku 4.5 | rápido y barato |

También puedes poner `QuillaMI_MODEL=sonnet` en el `.env`. Prioridad: `--model` → `QuillaMI_MODEL` → `ANTHROPIC_MODEL` → Sonnet 4.5.

## Memoria del proyecto

En la raíz del repo que estés editando, crea un `QuillaMI.md` (o un `AGENTS.md`). Quillami lo lee cada vez que piensa: cómo está armado el código, qué no tocar, convenciones.

Si le pides que se acuerde de algo, lo anota ahí (y te pide permiso para escribirlo). Eso es memoria del repo. El historial de la charla es otra cosa: si pasa de ~20k tokens, se compacta solo.

## Tokens y gasto

Después de cada turno ves cuántos tokens entraron y salieron, lo de la sesión y un estimado en dólares (precios de lista de Anthropic). `/usage` muestra el desglose. El total se guarda en `~/.Quillami/usage.json`.

## Cómo está armado

```text
src/index.ts            CLI, banner, /model, /undo, /usage
src/agent/loop.ts       modelo → tools → resultado → repeat
src/agent/compact.ts    resume lo viejo (~20k tokens)
src/usage.ts            tokens y estimado en dólares
src/checkpoint.ts       fotos de write/edit por turno
src/tools.ts            read write edit bash grep glob ls
src/permissions.ts      s / n / a
src/memory.ts           QuillaMI.md y AGENTS.md
src/models.ts           catálogo y alias
src/banner.ts           el dibujo de la costa
src/spinner.ts          “está pensando”
test/                   tests del harness
evals/                  tareas reales contra el modelo
```

El núcleo cabe en el loop. Lo demás es el harness: que no se escape del workspace, que pregunte antes de romper algo, que no se ahogue de tokens.

## Tests y evals

Los tests prueban el harness. No gastan API key.

```bash
npm test
```

Los evals sí llaman al modelo: un repo temporal, una tarea, ¿el archivo quedó como se pedía?

```bash
npm run eval
```

Hay cuatro: cambiar un greeting, crear `sum`, arreglar `double`, y respetar un `QuillaMI.md` que bloquea un archivo. Usan `QuillaMI_EVAL_MODEL` (default: haiku).

## CI

En cada push y pull request, GitHub Actions corre typecheck, tests y build.

Si el repo tiene el secret `ANTHROPIC_API_KEY`, el job de evals también corre. Sin el secret, ese job se omite (sale “Evals omitidos”) y el CI no se pone rojo.

## Licencia

[MIT](LICENSE) © Anuar Harb

English ------

# Quillami Code

A coding agent that runs in your terminal. Born on the **Colombian Caribbean coast**: it opens with sun, palm trees and sea, drops a line in coastal Spanish, and gets to work in whatever repo you are in.

It is not a chatbot. It is a loop. You give it a task, the model asks for tools, Quillami runs them (with your permission when disk is involved) and hands the results back until the job is done.

This repo is both the agent and a place to **build a coding agent from scratch**: loop, tools, permissions, memory, compaction, models. No orchestration frameworks. TypeScript, of course, and MIT.

*[Español](README.es.md)*

## What it does

- Reads, searches and lists files in the workspace
- Edits and writes code
- Runs commands in the current folder
- Asks before `write`, `edit` or `bash`
- Remembers the project if there is a `QuillaMI.md` or an `AGENTS.md`
- Compacts history when the session gets heavy
- Switches models on the fly (`sonnet`, `opus`, `fable`, `haiku`)

The workspace is the directory you launch `Quillami` from, not this repo's folder.

## Requirements

- Node 22 or newer
- An [Anthropic](https://console.anthropic.com/) API key

## Install

```bash
npm install -g Quillami-code
```

Or without installing: `npx Quillami-code`. The command is still `Quillami` (`Quillami-code` works too).

Put your key in `~/.Quillami/.env` (to use it from any folder) or in the project's `.env`:

```bash
mkdir -p ~/.Quillami
echo 'ANTHROPIC_API_KEY=your_key' > ~/.Quillami/.env
```

Then, in the repo you want to work in:

```bash
cd ~/your-project
Quillami
```

To develop this repo: `npm install` and `npm start`. If you change the code, `npm run build` updates the bin.

## Usage

You type at the prompt. `/exit` closes it.

```text
> fix the failing test in src/auth.ts
```

While it thinks you get a spinner (*Un momentico…*). Text streams in. If it is about to write or run a command:

```text
· edit src/auth.ts
  src/auth.ts · changes one block
  s  yes, just this once
  n  no, do not touch it
  a  yes, and stop asking this session
  What should I do?
```

`read`, `ls`, `grep` and `glob` never ask. They only look.

If the turn went wrong:

```text
> /undo
   undo: restored src/auth.ts
```

That restores the files `write` and `edit` touched in the last prompt. The chat stays. `bash` is not checkpointed: an `rm` does not come back this way. Run `/undo` again to step back another turn (up to 50).

## Models

All Anthropic today. Default: Sonnet 4.5.

```bash
Quillami --model haiku
Quillami -m fable
```

Or inside the session:

```text
/model
/model sonnet
/model opus
/model fable
```

| alias | model | what for |
|---|---|---|
| `sonnet` | Sonnet 5 | coding, the balanced one |
| `sonnet-4.5` | Sonnet 4.5 | the default |
| `opus` | Opus 5 | more capable, more expensive |
| `fable` | Fable 5.1 | long reasoning |
| `haiku` | Haiku 4.5 | fast and cheap |

You can also set `QuillaMI_MODEL=sonnet` in the `.env`. Priority: `--model` → `QuillaMI_MODEL` → `ANTHROPIC_MODEL` → Sonnet 4.5.

## Project memory

In the root of the repo you are editing, create a `QuillaMI.md` (or an `AGENTS.md`). Quillami reads it every time it thinks: how the code is laid out, what not to touch, conventions.

Ask it to remember something and it writes it there (asking your permission first). That is repo memory. Chat history is a different thing: past ~20k tokens, it compacts itself.

## Tokens and spend

After every turn you see tokens in, tokens out, the session total and a dollar estimate (Anthropic list prices). `/usage` shows the breakdown. The running total lives in `~/.Quillami/usage.json`.

## How it is built

```text
src/index.ts            CLI, banner, /model, /undo, /usage
src/agent/loop.ts       model → tools → result → repeat
src/agent/compact.ts    summarizes the old part (~20k tokens)
src/usage.ts            tokens and dollar estimate
src/checkpoint.ts       snapshots of write/edit per turn
src/tools.ts            read write edit bash grep glob ls
src/permissions.ts      s / n / a
src/memory.ts           QuillaMI.md and AGENTS.md
src/models.ts           catalog and aliases
src/banner.ts           the drawing of the coast
src/spinner.ts          "it is thinking"
test/                   harness tests
evals/                  real tasks against the model
```

The core fits in the loop. Everything else is the harness: keeping it inside the workspace, making it ask before breaking something, keeping it from drowning in tokens.

## Tests and evals

Tests cover the harness. They spend no API key.

```bash
npm test
```

Evals do call the model: a temporary repo, a task, and did the file end up how it was asked?

```bash
npm run eval
```

There are four: change a greeting, create `sum`, fix `double`, and respect a `QuillaMI.md` that blocks a file. They use `QuillaMI_EVAL_MODEL` (default: haiku).

## CI

On every push and pull request, GitHub Actions runs typecheck, tests and build.

If the repo has the `ANTHROPIC_API_KEY` secret, the evals job runs too. Without the secret that job is skipped ("Evals omitidos") and CI does not go red.

## Roadmap

Honest list of what is not here yet, roughly in the order I want to build it:

- **Prompt caching.** Reuse the cached prefix across loop iterations. The interesting part is the trade-off: compaction rewrites the prefix, which is exactly what invalidates the cache.
- **Firecracker sandboxing.** Permissions are consent, not isolation: an approved `bash` can still do anything your shell can. Real isolation means running commands inside a disposable microVM.
- **MCP client.** Connect Quillami to any Model Context Protocol server, so the tool list stops being just the seven built in.
- **Subagents.** The loop is already there; spawning child loops with scoped context is the next architectural step.
- **Retries and backoff.** A 429 or an overloaded response mid-loop should not kill the turn.
- **Token-based compaction.** Today the threshold is measured in characters; the API already returns real `usage`.
- **Bigger eval suite.** Run each case N times and report pass rates per model, since agents are stochastic and four cases are a seed, not a benchmark.
- **Session persistence.** A `--continue` flag to pick up where you left off.

Issues and pull requests welcome. Especially from the Caribbean.

## License

[MIT](LICENSE) © Anuar Harb
