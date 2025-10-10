const input = document.getElementById('inputArea');
const output = document.getElementById('outputArea');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const status = document.getElementById('status');
const canvas = document.getElementById('progressCanvas');
const ctx = canvas.getContext('2d');
const progressText = document.getElementById('progressText');
const downloadBtn = document.getElementById('downloadBtn');

const langSelect = document.getElementById('langSelect');

// Simple translations object
const translations = {
    pt: {
        pastePrompt: 'Cole seu código à esquerda e clique em Analisar',
        inputPlaceholder: 'Cole seu código aqui... Suporta PAWN / C / JavaScript — identa por chaves {}',
        copying: 'Resultado copiado para a área de transferência.',
        emptyInput: 'Cole algum código antes de analisar.',
        processing: 'Processando...',
        processingLine: (i, total) => `Processando: linha ${i} de ${total}`,
        finished: 'Finalizado !!',
        cleared: 'Campo limpo.',
        error_too_many_open: 'Existem { demais no código',
        error_too_many_close: 'Existem } demais no código\nO processo foi parado próximo à linha que houve o erro',
        error_found_before_line: (n) => 'O erro foi encontrado antes da linha ' + n,
        errorTitle: 'Erro',
        copyErrorPrefix: 'Erro ao copiar: ',
        analyze: 'Analisar',
        clear: 'Limpar',
        copy: 'Copiar',
        download: 'Baixar'
        ,
        outputPlaceholder: 'Código identado aparecerá aqui...',
        note: 'Detecta chaves { e } e tenta indentar corretamente. Exibe erros com a linha responsável.',
        footer_prefix: 'Por ',
        footer_suffix: ' Portal SAMP — baseado em Tabulador iPs Team'
    },
    en: {
        pastePrompt: 'Paste your code on the left and click Analyze',
        inputPlaceholder: 'Paste your code here... Supports PAWN / C / JavaScript — indents by {}',
        copying: 'Result copied to clipboard.',
        emptyInput: 'Paste some code before analyzing.',
        processing: 'Processing...',
        processingLine: (i, total) => `Processing: line ${i} of ${total}`,
        finished: 'Finished !!',
        cleared: 'Field cleared.',
        error_too_many_open: 'There are too many { in the code',
        error_too_many_close: 'There are too many } in the code\nThe process stopped near the line where the error occurred',
        error_found_before_line: (n) => 'The error was found before line ' + n,
        errorTitle: 'Error',
        copyErrorPrefix: 'Copy error: ',
        analyze: 'Analyze',
        clear: 'Clear',
        copy: 'Copy',
        download: 'Download'
        ,
        outputPlaceholder: 'Indented code will appear here...',
        note: 'Detects { and } and attempts to indent correctly. Shows errors with the responsible line.',
        footer_prefix: 'By ',
        footer_suffix: ' Portal SAMP — based on Tabulador iPs Team'
    },
    es: {
        pastePrompt: 'Pegue su código a la izquierda y haga clic en Analizar',
        inputPlaceholder: 'Pegue su código aquí... Soporta PAWN / C / JavaScript — indenta por {}',
        copying: 'Resultado copiado al portapapeles.',
        emptyInput: 'Pegue algún código antes de analizar.',
        processing: 'Procesando...',
        processingLine: (i, total) => `Procesando: línea ${i} de ${total}`,
        finished: 'Finalizado !!',
        cleared: 'Campo limpiado.',
        error_too_many_open: 'Hay demasiados { en el código',
        error_too_many_close: 'Hay demasiados } en el código\nEl proceso se detuvo cerca de la línea donde ocurrió el error',
        error_found_before_line: (n) => 'El error se encontró antes de la línea ' + n,
        errorTitle: 'Error',
        copyErrorPrefix: 'Error al copiar: ',
        analyze: 'Analizar',
        clear: 'Limpiar',
        copy: 'Copiar',
        download: 'Descargar'
        ,
        outputPlaceholder: 'Código indentado aparecerá aquí...',
        note: 'Detecta llaves { y } e intenta indentar correctamente. Muestra errores con la línea responsable.',
        footer_prefix: 'Por ',
        footer_suffix: ' Portal SAMP — basado en Tabulador iPs Team'
    }
};

let currentLang = localStorage.getItem('site_lang') || 'pt';

function t(key, ...args) {
    const v = translations[currentLang] && translations[currentLang][key];
    if (!v) return key;
    return typeof v === 'function' ? v(...args) : v;
}

function applyTranslations() {
    // UI elements
    status.textContent = t('pastePrompt');
    input.placeholder = t('inputPlaceholder');
    analyzeBtn.textContent = t('analyze');
    clearBtn.textContent = t('clear');
    const copyBtnEl = document.getElementById('copyBtn');
    if (copyBtnEl) copyBtnEl.textContent = t('copy');
    const downloadBtnEl = document.getElementById('downloadBtn');
    if (downloadBtnEl) downloadBtnEl.textContent = t('download');
    // output placeholder
    const outputEl = document.getElementById('outputArea');
    if (outputEl && outputEl.dataset && outputEl.dataset.i18nPlaceholder) {
        outputEl.placeholder = t(outputEl.dataset.i18nPlaceholder);
    }
    // generic data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = t(key);
        if (val) el.textContent = val;
    });
    // subtitle element (data-i18n)
    const sub = document.querySelector('[data-i18n="subtitle"]');
    if (sub) {
        if (currentLang === 'pt') sub.textContent = 'Tabulador e Analisador de Códigos — Portal SAMP';
        if (currentLang === 'en') sub.textContent = 'Code Indenter & Analyzer — Portal SAMP';
        if (currentLang === 'es') sub.textContent = 'Indentador y Analizador de Código — Portal SAMP';
    }
    // set selector
    if (langSelect) langSelect.value = currentLang;
    // set document language
    try { document.documentElement.lang = currentLang === 'pt' ? 'pt-BR' : currentLang; } catch (e) { }
}

// initialize translations on load
currentLang = localStorage.getItem('site_lang') || currentLang;

// apply translations immediately (script is loaded at end of body)
applyTranslations();

if (langSelect) {
    langSelect.addEventListener('change', (e) => {
        currentLang = e.target.value;
        localStorage.setItem('site_lang', currentLang);
        applyTranslations();
    });
}

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
        status.textContent = t('emptyInput');
        return;
    }


            status.textContent = t('processing');
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
            status.textContent = t('finished');
        }

        if (bckVal) {
            // show the main error, then attempt to show the approximate line where it occurred,
            // then finish (this mirrors the blocking alert() behavior using promise chaining)
            Swal.fire({ icon: 'error', title: t('errorTitle'), text: t('error_too_many_open') })
                .then(() => {
                    try {
                        return Swal.fire({ icon: 'error', title: t('errorTitle'), text: t('error_found_before_line', (ultimobrack - 1)) });
                    } catch (e) { return null; }
                })
                .then(finish);
        } else {
            finish();
        }
    }

    function processarOrig() {

    drawProgress(i + 1, total);
    status.textContent = t('processingLine', (i + 1), total);

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
                    title: t('errorTitle'),
                    text: t('error_too_many_close')
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
clearBtn.addEventListener('click', () => { input.value = ''; output.value = ''; status.textContent = t('cleared'); drawProgress(0, 1); });
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
                status.textContent = t('copying');
    } catch (e) {
                status.textContent = t('copyErrorPrefix') + (e.message || e);
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
