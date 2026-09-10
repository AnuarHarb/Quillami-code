import { stdout } from "node:process";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const LABELS = [
  "Pensando…",
  "Un momentico…",
  "Ajá, déjame ver…",
  "Cocinando esto…",
];

export function startSpinner(label?: string): () => void {
  if (!stdout.isTTY) {
    return () => {};
  }

  const text = label ?? LABELS[Math.floor(Math.random() * LABELS.length)];
  let frame = 0;
  let stopped = false;

  const draw = (): void => {
    const tick = FRAMES[frame % FRAMES.length];
    stdout.write(`\r\x1b[2K  \x1b[36m${tick}\x1b[0m \x1b[2;37m${text}\x1b[0m`);
    frame += 1;
  };

  stdout.write("\x1b[?25l");
  draw();
  const timer = setInterval(draw, 80);

  return () => {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    stdout.write("\r\x1b[2K\x1b[?25h");
  };
}
