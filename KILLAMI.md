# Killami Code

Agente de código en TypeScript. Se lanza con `killami` (usa `dist/`) o `npm start`.

- Entrada: `src/index.ts`
- Loop: `src/agent/loop.ts`
- Compactación: `src/agent/compact.ts` — si el historial pasa ~80k caracteres, resume lo viejo y deja la cola reciente
- Tools: `src/tools.ts` (`read`, `write`, `edit`, `bash`, `grep`, `glob`, `ls`)
- Permisos: `src/permissions.ts` — `write`, `edit` y `bash` preguntan s/n/a
- Banner: `src/banner.ts`
- Spinner: `src/spinner.ts`

Después de cambiar el código, corre `npm run build` para que el comando `killami` se actualice.

No commitear `.env`. La API key puede vivir en `.env` del proyecto o en `~/.killami/.env`.
