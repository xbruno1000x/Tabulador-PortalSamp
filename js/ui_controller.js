class DOM_Element_Manager {
    constructor() {
        this.elements = {
            input_area: document.getElementById('input-area'),
            output_area: document.getElementById('output-area'),
            analyze_btn: document.getElementById('analyze-btn'),
            clear_btn: document.getElementById('clear-btn'),
            copy_btn: document.getElementById('copy-btn'),
            download_btn: document.getElementById('download-btn'),
            theme_toggle: document.getElementById('theme-toggle'),
            lang_select: document.getElementById('lang-select'),
            progress_fill: document.getElementById('progress-fill'),
            progress_text: document.getElementById('progress-text'),
            input_status: document.getElementById('input-status'),
            input_line_numbers: document.getElementById('input-line-numbers'),
            output_line_numbers: document.getElementById('output-line-numbers'),
        };

        this.#Validate_Elements();
    }

    #Validate_Elements() {
        const missing = Object.entries(this.elements).filter(([, el]) => !el).map(([name]) => name);

        if (missing.length > 0)
            throw new Error(`Required UI elements not found: ${missing.join(', ')}`);
    }

    Get(name) {
        return this.elements[name];
    }
}


class Textarea_Manager {
    #elements;
    translator;

    constructor(elements, translator) {
        this.#elements = elements;
        this.translator = translator;
        this.#Setup_Event_Listeners();
    }

    #Setup_Event_Listeners() {
        const _input_area = this.#elements.Get('input_area');
        const _output_area = this.#elements.Get('output_area');

        _input_area.addEventListener('scroll', () => this.#Sync_Scroll('input'));
        _output_area.addEventListener('scroll', () => this.#Sync_Scroll('output'));
        _input_area.addEventListener('input', () => this.Update_Line_Numbers('input'));
        _output_area.addEventListener('input', () => this.Update_Line_Numbers('output'));
        window.addEventListener('resize', () => this.Update_Line_Numbers('both'));
    }

    Get_Input_Code = () => this.#elements.Get('input_area').value;

    Set_Output_Code = (code) => {
        this.#elements.Get('output_area').value = code;
        this.Update_Line_Numbers('output');
    };

    Append_Output_Line(line) {
        const _output_area = this.#elements.Get('output_area');
        _output_area.value += (_output_area.value ? '\n' : '') + line;
    }

    Clear_All() {
        this.#elements.Get('input_area').value = '';
        this.#elements.Get('output_area').value = '';
        
        this.Update_Line_Numbers('both');
        this.Update_Input_Status();
    }

    Update_Input_Status() {
        if (!this.translator)
            return;

        const code = this.Get_Input_Code();
        const line_count = code.split('\n').length;
        const status_el = this.#elements.Get('input_status');
        const icon = status_el.querySelector('i');
        const span = status_el.querySelector('span');

        if (code.trim().length === 0) {
            icon.className = 'fas fa-info-circle';
            span.textContent = this.translator.t('paste_prompt');
        }
        else {
            icon.className = 'fas fa-code';
            const line_count_text = line_count === 1 ? this.translator.t('line_count_singular') : this.translator.t('line_count_plural');
            span.textContent = `${line_count} ${line_count_text}`;
        }
    }

    Update_Line_Numbers(target = 'both') {
        if (target === 'input' || target === 'both')
            this.#Render_Line_Numbers(this.#elements.Get('input_area'), this.#elements.Get('input_line_numbers'));

        if (target === 'output' || target === 'both')
            this.#Render_Line_Numbers(this.#elements.Get('output_area'), this.#elements.Get('output_line_numbers'));
    }

    #Render_Line_Numbers(textarea, line_numbers_el) {
        line_numbers_el.innerHTML = Array.from({ length: textarea.value.split('\n').length }, (_, i) => `<div class="line-number">${i + 1}</div>`).join('');
        line_numbers_el.scrollTop = textarea.scrollTop;
    }

    #Sync_Scroll(source) {
        const _input_area = this.#elements.Get('input_area');
        const _output_area = this.#elements.Get('output_area');

        if (source === 'input') {
            this.#elements.Get('input_line_numbers').scrollTop = _input_area.scrollTop;

            if (document.activeElement !== _output_area)
                _output_area.scrollTop = _input_area.scrollTop;
        }
        else
            this.#elements.Get('output_line_numbers').scrollTop = _output_area.scrollTop;
    }

    Set_Disabled(is_disabled) {
        this.#elements.Get('input_area').disabled = is_disabled;
    }
}

class Button_Manager {
    #elements;

    constructor(elements) {
        this.#elements = elements;
    }

    Update_All_States(input_has_content, output_has_content) {
        this.#Set_Button_State(this.#elements.Get('analyze_btn'), input_has_content);
        this.#Set_Button_State(this.#elements.Get('clear_btn'), input_has_content || output_has_content);
        this.#Set_Button_State(this.#elements.Get('copy_btn'), output_has_content);
        this.#Set_Button_State(this.#elements.Get('download_btn'), output_has_content);
    }

    async Animate_Copy_Button(success, translator) {
        const copy_btn = this.#elements.Get('copy_btn');
        const original_html = copy_btn.innerHTML;
        const icon = success ? 'fa-check' : 'fa-times';
        const text = success ? translator.t('copied') : translator.t('copy_error');

        copy_btn.innerHTML = `<i class="fas ${icon}"></i><span>${text}</span>`;
        copy_btn.classList.toggle('btn-success', success);
        copy_btn.classList.toggle('btn-error', !success);
        copy_btn.disabled = true;

        return new Promise(resolve => {
            setTimeout(() => {
                copy_btn.innerHTML = original_html;
                copy_btn.classList.remove('btn-success', 'btn-error');
                
                resolve();
            }, 2000);
        });
    }

    #Set_Button_State(button, enabled) {
        button.disabled = !enabled;
        button.classList.toggle('disabled', !enabled);
    }
}

class Action_Manager {
    #elements;
    translator;

    constructor(elements, translator) {
        this.#elements = elements;
        this.translator = translator;
    }

    async Copy_Output_To_Clipboard() {
        const _output_area = this.#elements.Get('output_area');
        const text = _output_area.value;

        if (!text.trim())
            return false;

        try {
            await navigator.clipboard.writeText(text);

            return true;
        }
        catch (error) {
            console.error(this.translator.t('copy_fail'), error);

            try {
                _output_area.select();

                return document.execCommand('copy');
            }
            catch (fallbackError) {
                console.error(this.translator.t('copy_fallback_fail'), fallbackError);

                return false;
            }
        }
    }

    Download_Output() {
        const code = this.#elements.Get('output_area').value;

        if (!code.trim())
            return;

        const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        const filename_prefix = this.translator.t('download_filename_prefix');
        link.href = url;
        link.download = `${filename_prefix}-${new Date().toISOString().slice(0, 19).replace(/[:]/g, '-')}.txt`;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            URL.revokeObjectURL(url)
            document.body.removeChild(link);
        }, 100);
    }
}

class Notification_Manager {
    #elements;
    translator;
    theme;

    constructor(elements, translator) {
        this.#elements = elements;
        this.translator = translator;
        this.theme = null;
    }

    #Get_Swal_Theme_Config() {
        const is_dark = !this.theme || this.theme.Get_Current_Theme() === 'dark';
        
        return {
            background: is_dark ? '#000000ff' : '#ffffff',
            color: is_dark ? '#e6eef6' : '#333333',
            confirmButtonColor: is_dark ? '#1e90ff' : '#007bff',
            iconColor: is_dark ? '#ff6b6b' : '#dc3545'
        };
    }

    Show_Temporary_Status(message, type = 'info', duration = 2500) {
        const status_el = this.#elements.Get('input_status');
        const icon = status_el.querySelector('i');
        const span = status_el.querySelector('span');
        const icon_map = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        const original_icon = icon.className;
        const original_text = span.textContent;

        icon.className = `fas ${icon_map[type] || icon_map.info}`;
        span.textContent = message;
        status_el.style.animation = 'fadeInScale 0.3s ease';

        setTimeout(() => {
            icon.className = original_icon;
            span.textContent = original_text;
            status_el.style.animation = '';
        }, duration);
    }

    Show_Error(title_key, message_key, ...args) {
        if (!this.translator)
            return;

        const theme_config = this.#Get_Swal_Theme_Config();

        Swal.fire({
            icon: 'error',
            title: this.translator.t(title_key),
            text: this.translator.t(message_key, ...args),
            background: theme_config.background,
            color: theme_config.color,
            confirmButtonColor: theme_config.confirmButtonColor,
            iconColor: theme_config.iconColor
        });
    }

    Show_Error_With_Line(title_key, message_key_1, message_key_2, line_number) {
        if (!this.translator)
            return;

        const combinedMessage = `${this.translator.t(message_key_1)}\n\n${this.translator.t(message_key_2, line_number)}`;
        const theme_config = this.#Get_Swal_Theme_Config();

        Swal.fire({
            icon: 'error',
            title: this.translator.t(title_key),
            text: combinedMessage,
            background: theme_config.background,
            color: theme_config.color,
            confirmButtonColor: theme_config.confirmButtonColor,
            iconColor: theme_config.iconColor
        });
    }
}

export class UI_Controller {
    #elements;
    #translator;
    #textareas;
    #buttons;
    #actions;
    #notifications;

    constructor(translator) {
        this.#translator = translator;

        this.#elements = new DOM_Element_Manager();
        this.#textareas = new Textarea_Manager(this.#elements, this.#translator);
        this.#buttons = new Button_Manager(this.#elements);
        this.#actions = new Action_Manager(this.#elements, this.#translator);
        this.#notifications = new Notification_Manager(this.#elements, this.#translator);

        this.#elements.Get('input_area').addEventListener('input', () => {
            this.Update_Button_States();
            this.#textareas.Update_Input_Status();
        });

        this.Update_Button_States();
        this.Update_Line_Numbers();
        this.Initialize_Progress();
    }

    set translator(new_translator) {
        this.#translator = new_translator;
        this.#textareas.translator = new_translator;
        this.#notifications.translator = new_translator;
        this.#actions.translator = new_translator;
    }

    set theme(theme_instance) {
        this.#notifications.theme = theme_instance;
    }

    Apply_Static_Translations() {
        if (!this.#translator)
            return;

        document.querySelector('meta[name="description"]').setAttribute('content', this.#translator.t('meta_description'));

        this.#elements.Get('lang_select').setAttribute('aria-label', this.#translator.t('lang_select_label'));
        this.#elements.Get('theme_toggle').setAttribute('aria-label', this.#translator.t('theme_toggle_label'));
        
        const logo = document.querySelector('.site-logo');

        if (logo)
            logo.setAttribute('alt', this.#translator.t('logo_alt'));
    }

    Update_Initial_Status() {
        this.#textareas.Update_Input_Status();
    }

    Set_Analyze_Button_Handler = (handler) => this.#elements.Get('analyze_btn').addEventListener('click', handler);
    Set_Clear_Button_Handler = (handler) => this.#elements.Get('clear_btn').addEventListener('click', handler);
    Set_Copy_Button_Handler = (handler) => this.#elements.Get('copy_btn').addEventListener('click', handler);
    Set_Download_Button_Handler = (handler) => this.#elements.Get('download_btn').addEventListener('click', handler);
    Set_Theme_Toggle_Handler = (handler) => this.#elements.Get('theme_toggle').addEventListener('click', handler);
    Get_Input_Code = () => this.#textareas.Get_Input_Code();

    Set_Output_Code = (code) => {
        this.#textareas.Set_Output_Code(code);
    };
    
    Append_Output_Line = (line) => {
        this.#textareas.Append_Output_Line(line);
    };
    
    Clear_Input_And_Output = () => {
        this.#textareas.Clear_All();
        this.Initialize_Progress();
        this.Update_Button_States();
    };

    async Copy_Output_To_Clipboard() {
        const success = await this.#actions.Copy_Output_To_Clipboard()

        await this.#buttons.Animate_Copy_Button(success, this.#translator);
        this.Update_Button_States();

        return success;
    }
    
    Download_Output = () => this.#actions.Download_Output();
    
    Set_Processing_State = (is_processing) => {
        this.#textareas.Set_Disabled(is_processing);

        const analyze_btn = this.#elements.Get('analyze_btn');
        const icon = analyze_btn.querySelector('i');
        const span = analyze_btn.querySelector('span');

        if (is_processing) {
            this.#elements.Get('analyze_btn').disabled = true;
            this.#elements.Get('clear_btn').disabled = true;
            this.#elements.Get('copy_btn').disabled = true;
            this.#elements.Get('download_btn').disabled = true;
            
            if (this.#translator && span) {
                span.textContent = this.#translator.t('processing');

                if (icon)
                    icon.className = 'fas fa-spinner fa-spin';
            }
        }
        else {
            if (this.#translator && span) {
                span.textContent = this.#translator.t('analyze');

                if (icon)
                    icon.className = 'fas fa-play';
            }

            this.Update_Button_States();
        }
    };

    Update_Button_States = () => {
        const input_has_content = this.Get_Input_Code().trim().length > 0;
        const output_has_content = this.#elements.Get('output_area').value.trim().length > 0;

        this.#buttons.Update_All_States(input_has_content, output_has_content);
    };
    
    Update_Line_Numbers = (target = 'both') => this.#textareas.Update_Line_Numbers(target);
    Show_Temporary_Status = (...args) => this.#notifications.Show_Temporary_Status(...args);
    Show_Error = (...args) => this.#notifications.Show_Error(...args);
    Show_Error_With_Line = (...args) => this.#notifications.Show_Error_With_Line(...args);
    
    Update_Progress(current, total) {
        const percentage = total > 0 ? (current / total) * 100 : 0;
        const progress_fill = this.#elements.Get('progress_fill');
        const progress_text = this.#elements.Get('progress_text');
        
        progress_fill.style.width = `${percentage}%`;
        progress_text.textContent = `${current} / ${total}`;
        
        this.Update_Line_Numbers('output');
        this.#elements.Get('output_area').scrollTop = this.#elements.Get('output_area').scrollHeight;
    }

    Initialize_Progress = () => this.Update_Progress(0, 0);
}