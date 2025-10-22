class Language_Storage {
    constructor(key = 'site_lang') {
        this.key = key;
    }

    Get_Language() {
        try {
            return localStorage.getItem(this.key);
        }
        catch (error) {
            console.warn('Failed to read saved language:', error);

            return null;
        }
    }

    Save_Language(lang) {
        try {
            localStorage.setItem(this.key, lang);
        }
        catch (error) {
            console.warn('Failed to save language preference:', error);
        }
    }
}

class Translation_Loader {
    constructor(base_path = './translations', fallback_lang = 'en') {
        this.base_path = base_path;
        this.fallback_lang = fallback_lang;
    }

    async Load(lang) {
        try {
            const response = await fetch(`${this.base_path}/${lang}.json`);

            if (!response.ok)
                throw new Error(`HTTP error! status: ${response.status}`);

            return await response.json();
        }
        catch (error) {
            console.warn(`Failed to load translations for ${lang}:`, error);

            if (lang !== this.fallback_lang) {
                console.warn(`Trying fallback to ${this.fallback_lang}`);

                return this.Load(this.fallback_lang);
            }

            return {
                "paste_prompt": "Paste your code and click Analyze",
                "input_placeholder": "Paste your code here... Supports PAWN / C / JavaScript — indents by {}",
                "output_placeholder": "Formatted code will appear here...",
                "input_title": "Original Code",
                "output_title": "Formatted Code",
                "analyze": "Analyze",
                "clear": "Clear",
                "copy": "Copy",
                "download": "Download",
                "copied": "Copied!",
                "downloaded": "Downloaded!",
                "copying": "Code copied to clipboard!",
                "empty_input": "Please paste some code before analyzing.",
                "processing": "Processing...",
                "finished": "Analysis complete!",
                "cleared": "Fields cleared.",
                "error_too_many_open": "There are too many opening braces { in the code",
                "error_too_many_close": "There are too many closing braces } in the code.",
                "error_found_before_line": "The error was found before line {0}",
                "error_title": "Error Detected",
                "processing_error": "An error occurred while processing the code.",
                "copy_error": "Copy error",
                "note": "Detects { and } braces and attempts to indent correctly. Shows errors with the responsible line.",
                "footer_prefix": "By ",
                "footer_suffix": " Portal SAMP — based on Tabulador iPs Team",
                "subtitle": "Code Indenter & Analyzer — Portal SAMP",
                "title": "Tabulator - Portal SAMP",
                "meta_description": "PAWN/C/JavaScript code analyzer and formatter with smart error detection.",
                "logo_alt": "Portal SAMP Logo",
                "lang_select_label": "Language Selector",
                "theme_toggle_label": "Toggle Theme",
                "theme_light": "Light Theme",
                "theme_dark": "Dark Theme",
                "line_count_singular": "line",
                "line_count_plural": "lines",
                "download_filename_prefix": "formatted-code",
                "critical_error_title": "Critical Error",
                "critical_error_message": "The application could not be loaded. Please try reloading the page."
            };
        }
    }
}

class Translation_DOM {
    constructor(lang_select_id = 'lang-select') {
        this.lang_select = document.getElementById(lang_select_id);
    }

    Apply_Translations(translator_func) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = translator_func(key);
            const target_span = el.querySelector('span');

            if (target_span)
                target_span.textContent = translation;
            else
                el.textContent = translation;
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = translator_func(key);
        });
    }

    Update_Document_Language(lang) {
        const lang_map = { 'pt': 'pt-BR', 'en': 'en', 'es': 'es' };

        document.documentElement.lang = lang_map[lang] || lang;
    }
    
    Setup_Selector_Listener(callback) {
        if (!this.lang_select)
            return;

        this.lang_select.addEventListener('change', (e) => callback(e.target.value));
    }

    Set_Selector_State(lang, disabled = false) {
        if (!this.lang_select)
            return;

        this.lang_select.value = lang;
        this.lang_select.disabled = disabled;
    }
}

export class Translator {
    constructor() {
        this.storage = new Language_Storage();
        this.loader = new Translation_Loader();
        this.dom = new Translation_DOM();
        this.translations = {};
        this.current_lang = this.Get_Initial_Language();
    }

    static async Create_And_Initialize() {
        const translator = new Translator();

        await translator.Initialize();

        return translator;
    }

    async Initialize() {
        this.dom.Setup_Selector_Listener((new_lang) => this.Change_Language(new_lang));

        await this.Load_And_Apply_Translations(this.current_lang);
    }

    static Detect_Browser_Language() {
        const lang = navigator.language || navigator.userLanguage;
        
        if (lang.startsWith('pt'))
            return 'pt';

        if (lang.startsWith('es'))
            return 'es';

        return 'en';
    }

    Get_Initial_Language() {
        return this.storage.Get_Language() || Translator.Detect_Browser_Language();
    }
    
    async Change_Language(new_lang) {
        if (new_lang === this.current_lang)
            return;

        this.dom.Set_Selector_State(new_lang, true);

        try {
            await this.Load_And_Apply_Translations(new_lang);

            this.storage.Save_Language(new_lang);
        }
        catch (error) {
            console.error('Failed to change language:', error);

            this.dom.Set_Selector_State(this.current_lang, false);
        }
    }
    
    async Load_And_Apply_Translations(lang) {
        this.translations = await this.loader.Load(lang);
        this.current_lang = lang;

        this.dom.Apply_Translations((key) => this.t(key));
        this.dom.Update_Document_Language(this.current_lang);
        this.dom.Set_Selector_State(this.current_lang, false);
    }

    t(key, ...args) {
        let value = this.translations[key];

        if (value === undefined) {
            console.warn(`Translation not found for key: ${key}`);

            return key;
        }

        if (args.length > 0) {
            args.forEach((arg, index) => {
                value = value.replace(`{${index}}`, arg);
            });
        }

        return value;
    }
}