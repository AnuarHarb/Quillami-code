# Killami Code

Un agente de código que corre en tu terminal. Nace en el **Caribe colombiano**: se abre con sol, palma y mar, te suelta una frase costeña y se pone a programar en el repo donde estés.

No es un chatbot. Es un loop. Tú le das una tarea, el modelo pide herramientas, Killami las ejecuta (con tu permiso cuando toca el disco) y le devuelve el resultado hasta que termina.

Este repo es el agente y, a la vez, un lugar para **armar un agente de código desde aquí**: loop, tools, permisos, memoria, compactación, modelos. Sin frameworks de orquestación. TypeScript, claro, y MIT.

## Qué hace

- Lee, busca y lista archivos del workspace
- Edita y escribe código
- Corre comandos en la carpeta actual
- Pregunta antes de `write`, `edit` o `bash`
- Recuerda el proyecto si existe un `KILLAMI.md` o un `AGENTS.md`
- Compacta el historial cuando la sesión se pone pesada
- Cambia de modelo al vuelo (`sonnet`, `opus`, `fable`, `haiku`)

El workspace es el directorio desde el que lanzas `killami`, no la carpeta de este repo.

## Requisitos

- Node 22 o más
- Una API key de [Anthropic](https://console.anthropic.com/)

## Arranque

```bash
git clone https://github.com/AnuarHarb/killa-code.git
cd killa-code
npm install
cp .env.example .env
```

Pega tu key en `.env` o, para usarlo desde cualquier carpeta, en `~/.killami/.env`:

```bash
mkdir -p ~/.killami
cp .env ~/.killami/.env
```

Instala el comando y ábrelo donde vayas a trabajar:

```bash
npm link
cd ~/tu-proyecto
killami
```

En este repo, para desarrollar sin compilar: `npm start`.

Si cambias el código, `npm run build` actualiza el bin de `killami`.

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

## Modelos

Hoy todos son de Anthropic. Default: Sonnet 4.5.

```bash
killami --model haiku
killami -m fable
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

También puedes poner `KILLAMI_MODEL=sonnet` en el `.env`. Prioridad: `--model` → `KILLAMI_MODEL` → `ANTHROPIC_MODEL` → Sonnet 4.5.

## Memoria del proyecto

En la raíz del repo que estés editando, crea un `KILLAMI.md` (o un `AGENTS.md`). Killami lo lee cada vez que piensa: cómo está armado el código, qué no tocar, convenciones.

Si le pides que se acuerde de algo, lo anota ahí (y te pide permiso para escribirlo). Eso es memoria del repo. El historial de la charla es otra cosa: si se pone largo, se compacta solo.

## Cómo está armado

```text
src/index.ts            CLI, banner, /model
src/agent/loop.ts       modelo → tools → resultado → repeat
src/agent/compact.ts    resume lo viejo, deja la cola
src/tools.ts            read write edit bash grep glob ls
src/permissions.ts      s / n / a
src/memory.ts           KILLAMI.md y AGENTS.md
src/models.ts           catálogo y alias
src/banner.ts           el dibujo de la costa
src/spinner.ts          “está pensando”
test/                   tests del harness
```

El núcleo cabe en el loop. Lo demás es el harness: que no se escape del workspace, que pregunte antes de romper algo, que no se ahogue de tokens.

## Tests

Prueban el harness, no al modelo. No gastan API key.

```bash
npm test
```

Cubren tools, permisos, modelos, memoria y compactación.

Los evals del agente (¿arregló el archivo que le pediste?) son el siguiente piso. Aún no están.

## Licencia

[MIT](LICENSE) © Anuar Harb
