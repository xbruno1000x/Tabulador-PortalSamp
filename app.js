const input = document.getElementById('inputArea');
const output = document.getElementById('outputArea');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const status = document.getElementById('status');
const canvas = document.getElementById('progressCanvas');
const ctx = canvas.getContext('2d');
const progressText = document.getElementById('progressText');
const downloadBtn = document.getElementById('downloadBtn');

function drawProgress(value, max) {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a2433';
    ctx.fillRect(0, 0, w, h);
    const pct = max ? value / max : 0;
    ctx.fillStyle = '#28a745';
    ctx.fillRect(0, 0, Math.max(2, Math.round(w * pct)), h);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.strokeRect(0, 0, w, h);
    progressText.textContent = value + ' / ' + max;
}

function formatCode(text, onProgress) {
    const lines = text.replace(/\r/g, '').split('\n');
    let out = [];
    let indent = 0;
    let total = lines.length;
    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        let line = raw;

        const firstNonWS = line.search(/\S|$/);
        const trimmedStart = line.slice(firstNonWS);


        const leadingClosesMatch = trimmedStart.match(/^}+/);
        const leadingCloses = leadingClosesMatch ? leadingClosesMatch[0].length : 0;
        if (leadingCloses) {
            indent = Math.max(0, indent - leadingCloses);
        }


        const indented = '\t'.repeat(indent) + trimmedStart;
        out.push(indented);

        let inSingleQuote = false, inDouble = false, inLineComment = false;
        for (let k = leadingCloses; k < trimmedStart.length; k++) {
            const ch = trimmedStart[k];
            const next2 = trimmedStart.slice(k, k + 2);
            if (inLineComment) break;
            if (next2 === '//') { inLineComment = true; break; }
            if (ch === "'" && !inDouble) inSingleQuote = !inSingleQuote;
            if (ch === '"' && !inSingleQuote) inDouble = !inDouble;
            if (inSingleQuote || inDouble) continue;
            if (ch == '{') indent++;
            if (ch == '}') indent = Math.max(0, indent - 1);
        }

        if (onProgress) onProgress(i + 1, total);
    }

    const resultText = out.join('\n');

    const adjusted = adjustReturnAlignment(resultText);
    return { text: adjusted, unmatched: indent };
}

function adjustReturnAlignment(text) {
    const lines = text.split('\n');
    let nesting = 0;
    const out = [];
    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const firstNonWS = raw.search(/\S|$/);
        const trimmed = raw.slice(firstNonWS);


        const leadingClosesMatch = trimmed.match(/^}+/);
        const leadingCloses = leadingClosesMatch ? leadingClosesMatch[0].length : 0;
        if (leadingCloses) nesting = Math.max(0, nesting - leadingCloses);


        if (trimmed.startsWith('return') && nesting > 0) {
            out.push('\t'.repeat(nesting) + trimmed);
        } else {
            out.push(raw);
        }

        let inSingle = false, inDouble = false, inLine = false;
        for (let k = leadingCloses; k < trimmed.length; k++) {
            const ch = trimmed[k];
            const next2 = trimmed.slice(k, k + 2);
            if (inLine) break;
            if (next2 === '//') { inLine = true; break; }
            if (ch === "'" && !inDouble) inSingle = !inSingle;
            if (ch === '"' && !inSingle) inDouble = !inDouble;
            if (inSingle || inDouble) continue;
            if (ch == '{') nesting++;
            if (ch == '}') nesting = Math.max(0, nesting - 1);
        }
    }
    return out.join('\n');
}



function analyze() {
    const code = input.value || '';
    if (!code) {
        status.textContent = 'Cole algum código antes de analisar.';
        return;
    }


    status.textContent = 'Processando...';
    output.value = '';
    const linha = code.replace(/\r/g, '').split('\n');
    const total = linha.length;
    drawProgress(0, total);


    let i = 0;
    let filtro = " \t\n\r\f";
    let impressaofinal = "";
    let bck = 0;
    let ultimobrack = 0;

    function terminarOrig(bckVal) {
        function finish() {
            output.value = impressaofinal;
            status.textContent = 'Finalizado !!';
        }

        if (bckVal) {
            // show the main error, then attempt to show the approximate line where it occurred,
            // then finish (this mirrors the blocking alert() behavior using promise chaining)
            Swal.fire({ icon: 'error', title: 'Erro', text: 'Existem { demais no código' })
                .then(() => {
                    try {
                        return Swal.fire({ icon: 'error', title: 'Erro', text: 'O erro foi encontrado antes da linha ' + (ultimobrack - 1) });
                    } catch (e) { return null; }
                })
                .then(finish);
        } else {
            finish();
        }
    }

    function processarOrig() {

        drawProgress(i + 1, total);
        status.textContent = 'Processando: linha ' + (i + 1) + ' de ' + total;

        let j = 0;
        while (filtro.indexOf(linha[i][j]) != -1) { j++; }
        let f = j;
        impressaofinal += '\n';

        let b = 0;
        for (; linha[i][j]; j++) {
            const ch = linha[i][j];

            if (ch == '{') {
                bck++;
                ultimobrack = i;
                if (j == f) { f = -1; }
            }

            if (ch == '}') {
                bck--;
            }

            if (bck < 0) {
                // combine the messages into a single modal and when dismissed, terminate the process
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: 'Existem } demais no código\nO processo foi parado próximo à linha que houve o erro'
                }).then(() => {
                    terminarOrig(0);
                });
                return;
            }

            if (!b && bck) {
                const tabs = (f == -1 ? bck - 1 : bck);
                for (let x = 0; x < tabs; x++) impressaofinal += '\t';
            }

            impressaofinal += ch;
            b = 1;

            if (f == -1 && linha[i].length > 1) {
                impressaofinal += '\n';
                for (let x = 0; x < bck; x++) impressaofinal += '\t';
                f--;
            }
        }

        if (i < linha.length - 1) {
            i++;
            setTimeout(processarOrig, 2);
        } else {
            terminarOrig(bck);
        }
    }

    // start
    setTimeout(processarOrig, 10);
}

analyzeBtn.addEventListener('click', analyze);
clearBtn.addEventListener('click', () => { input.value = ''; output.value = ''; status.textContent = 'Campo limpo.'; drawProgress(0, 1); });
const copyBtn = document.getElementById('copyBtn');
copyBtn.addEventListener('click', async () => {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(output.value);
        } else {
            // fallback
            output.select();
            document.execCommand('copy');
            window.getSelection().removeAllRanges();
        }
        status.textContent = 'Resultado copiado para a área de transferência.';
    } catch (e) {
        status.textContent = 'Erro ao copiar: ' + (e.message || e);
    }
    setTimeout(() => { status.textContent = ''; }, 2500);
});

downloadBtn.addEventListener('click', () => {
    const blob = new Blob([output.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'codigo-identado.txt'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

// initialize canvas
drawProgress(0, 1);
