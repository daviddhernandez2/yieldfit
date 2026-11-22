// Hook PreToolUse de Claude Code: pide confirmación a David antes de cualquier comando
// Bash que contenga un git que pueda modificar el repo, AUNQUE vaya dentro de otro programa
// (heredoc de Python, `node -e`, un script…). Ver DECISIONS.md, 0023.
//
// Por qué existe: las reglas "ask" de settings.json solo miran cómo EMPIEZA el comando.
// `python3 - <<EOF … git rm … EOF` empieza por python3 y pasaba sin preguntar.
//
// Cómo funciona:
//   1. Claude Code le pasa por la entrada estándar un JSON con el comando completo.
//   2. Busca cada palabra `git` suelta en el texto y mira el verbo que la sigue,
//      saltándose opciones como `-C ruta` y separadores como comillas o comas.
//   3. Si el verbo NO está en la lista de solo lectura, responde "ask": Claude Code
//      enseña el comando a David y espera su respuesta.
//
// Lista de permitidos (y no de prohibidos) a propósito: si falta un verbo, lo peor que
// pasa es una pregunta de más, nunca un git sin confirmar. Por lo mismo, si este script
// falla, también pregunta.
//
// Límites: no ve un git construido a trozos ("g" + "it") o guardado en una variable.
// Protege frente a descuidos, no frente a alguien que quiera saltárselo.

// Verbos que solo leen: no cambian el índice, el árbol de trabajo, las refs ni el remoto.
const SOLO_LECTURA = new Set([
  'status', 'diff', 'log', 'show', 'ls-files', 'ls-tree', 'rev-parse', 'rev-list',
  'blame', 'grep', 'describe', 'shortlog', 'cat-file', 'check-ignore', 'help', 'version',
]);

// Opciones de git que llevan un valor detrás (`git -C ruta status`): hay que saltarse
// también ese valor para llegar al verbo.
const OPCIONES_CON_VALOR = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace']);

// `git` como palabra suelta: delante, inicio, espacio, comilla, barra (/usr/bin/git) o un
// signo de código; detrás, espacio, comilla o coma. Así no cuenta `.git/`, `.gitignore`,
// `github.com` ni `git-solo-en…`.
const PALABRA_GIT = /(^|[\s"'`(\[{;&|,/\\=])git(?=[\s"'`,\]\\])/g;

// Separadores entre palabras, incluidos los de código: comillas, comas, corchetes…
const SEPARADORES = /[\s"'`,\[\](){};&|\\]+/;

// Devuelve los verbos de git encontrados en el texto que NO son de solo lectura.
export const verbosPeligrosos = (texto) => {
  const encontrados = [];
  for (const coincidencia of texto.matchAll(PALABRA_GIT)) {
    const despues = texto.slice(coincidencia.index + coincidencia[0].length, coincidencia.index + 300);
    const palabras = despues.split(SEPARADORES).filter(Boolean);
    let verbo = null;
    for (let i = 0; i < palabras.length; i++) {
      const palabra = palabras[i];
      if (OPCIONES_CON_VALOR.has(palabra)) {
        i++; // salta también el valor
        continue;
      }
      if (palabra.startsWith('-')) continue; // otras opciones (--no-pager, -P…)
      verbo = palabra;
      break;
    }
    // `git` sin verbo (`git --version`) no hace nada.
    if (verbo !== null && !SOLO_LECTURA.has(verbo)) encontrados.push(verbo);
  }
  return encontrados;
};

const preguntar = (motivo) => {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: motivo,
      },
    })
  );
};

// Solo se ejecuta como hook; al importarlo desde las pruebas no lee la entrada.
if (import.meta.url === `file://${process.argv[1]}`) {
  let entrada = '';
  process.stdin.on('data', (trozo) => (entrada += trozo));
  process.stdin.on('end', () => {
    try {
      const comando = JSON.parse(entrada).tool_input?.command ?? '';
      const verbos = verbosPeligrosos(comando);
      if (verbos.length > 0) {
        preguntar(
          `El comando contiene git ${[...new Set(verbos)].join(', ')}, que puede modificar el ` +
            'repo (CLAUDE.md, regla 8). Confírmalo solo si es exactamente lo que has verificado.'
        );
      }
    } catch (error) {
      preguntar(`El hook de git ha fallado (${error.message}); por seguridad, confirma tú este comando.`);
    }
  });
}
