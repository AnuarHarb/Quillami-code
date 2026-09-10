# Killami Code

Agente de código en TypeScript. Los usuarios lo instalan con `npm install -g killami-code`. El comando es `killami` (o `killami-code`). Aquí también vale `npm start`.

- Entrada: `src/index.ts`
- Loop: `src/agent/loop.ts`
- Compactación: `src/agent/compact.ts` — si el historial pasa ~80k caracteres, resume lo viejo y deja la cola reciente
- Modelos: `src/models.ts` — `killami --model haiku` o `/model` en la sesión
- Tools: `src/tools.ts` (`read`, `write`, `edit`, `bash`, `grep`, `glob`, `ls`)
- Permisos: `src/permissions.ts` — `write`, `edit` y `bash` preguntan s/n/a
- Checkpoints: `src/checkpoint.ts` — foto de `write`/`edit` por turno; `/undo` restaura. `bash` no se deshace.
- Banner: `src/banner.ts`
- Spinner: `src/spinner.ts`

Los tests del harness: `npm test`. Los evals del agente: `npm run eval` (necesitan API key). CI en `.github/workflows/ci.yml`. Después de cambiar el código, corre `npm run build` para que el comando `killami` se actualice.

No commitear `.env`. La API key puede vivir en `.env` del proyecto o en `~/.killami/.env`.
