// Batería de pruebas del hook confirmar-git.mjs (DECISIONS.md, 0023).
// Repetirla siempre que se cambie el hook:  node .claude/hooks/confirmar-git.test.mjs
// Los casos "debe preguntar" incluyen los dos incidentes reales que motivaron el hook.

import { execFileSync } from 'node:child_process';
const HOOK = new URL('./confirmar-git.mjs', import.meta.url).pathname;
const { verbosPeligrosos } = await import(HOOK);

// [descripción, comando, ¿debe preguntar?]
const casos = [
  ['incidente 1: git stash directo', 'git stash && git stash pop', true],
  ['incidente 2: git rm tras heredoc de python', "python3 - <<'EOF'\nprint('x')\nEOF\ngit rm -q --cached a.css 2>/dev/null; echo hecho", true],
  ['git dentro de heredoc', "python3 - <<'EOF'\nimport os\nos.system('git push')\nEOF", true],
  ['subprocess con lista', "python3 -c \"import subprocess; subprocess.run(['git', 'rm', 'x'])\"", true],
  ['node execSync', `node -e "require('child_process').execSync('git stash list')"`, true],
  ['comillas escapadas', 'python3 -c "subprocess.run([\\"git\\", \\"add\\", \\"x\\"])"', true],
  ['git -C ruta commit', 'git -C /repo commit -m "x"', true],
  ['git -c clave=valor push', 'git -c core.pager=cat push', true],
  ['ruta absoluta /usr/bin/git', '/usr/bin/git reset --hard', true],
  ['git apply', 'git apply --cached parche.patch', true],
  ['tras && en cadena', 'cd repo && npm test && git add a.js', true],
  ['git fetch (cambia refs)', 'git fetch origin', true],
  ['verbo desconocido', 'git frobnicate', true],
  ['texto en echo (falso positivo aceptado)', 'echo "luego haz git push"', true],
  ['solo lectura: status', 'git status --short', false],
  ['solo lectura: log -C', 'git -C /repo log --oneline -3', false],
  ['solo lectura en python', "python3 -c \"import subprocess; subprocess.run(['git','status'])\"", false],
  ['solo lectura: diff --cached', 'git diff --cached --stat', false],
  ['git --version', 'git --version', false],
  ['.git/ no es git', 'ls .git/hooks', false],
  ['.gitignore no es git', 'cat .gitignore', false],
  ['github.com no es git', 'curl https://github.com/x', false],
  ['nombre con git-', 'cat memory/git-solo-en-comandos-propios.md', false],
  ['gh no es git', 'gh api repos/x/y', false],
  ['sin git', 'npm run build', false],
];

let fallos = 0;
for (const [desc, cmd, debe] of casos) {
  const verbos = verbosPeligrosos(cmd);
  const pregunta = verbos.length > 0;
  const ok = pregunta === debe;
  if (!ok) fallos++;
  console.log(`${ok ? 'OK  ' : 'FALLO'} ${pregunta ? 'pregunta' : 'pasa    '} ${desc}${verbos.length ? ` [${verbos.join(', ')}]` : ''}`);
}

// De punta a punta: como lo llama Claude Code.
const hook = (entrada) => execFileSync('node', [HOOK], { input: entrada, encoding: 'utf8' });
const salidaAsk = hook(JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'git push' } }));
const decision = JSON.parse(salidaAsk).hookSpecificOutput.permissionDecision;
console.log(`${decision === 'ask' ? 'OK  ' : 'FALLO'} punta a punta git push → ${decision}`);
if (decision !== 'ask') fallos++;
const salidaVacia = hook(JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'git status' } }));
console.log(`${salidaVacia === '' ? 'OK  ' : 'FALLO'} punta a punta git status → sin salida (pasa)`);
if (salidaVacia !== '') fallos++;
const salidaRota = hook('esto no es json');
const decRota = JSON.parse(salidaRota).hookSpecificOutput.permissionDecision;
console.log(`${decRota === 'ask' ? 'OK  ' : 'FALLO'} entrada rota → ${decRota}`);
if (decRota !== 'ask') fallos++;

console.log(`\n${fallos === 0 ? 'TODO CORRECTO' : `${fallos} FALLOS`} (${casos.length + 3} pruebas)`);
