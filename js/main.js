import { Translator } from './translator.js';
import { UI_Controller } from './ui_controller.js';
import { Code_Analyzer } from './code_analyzer.js';
import { Theme } from './theme.js';

class App_Event_Handler {
    constructor(app, ui_controller) {
        this.app = app;
        this.ui_controller = ui_controller;
    }

    Attach_All() {
        this.ui_controller.Set_Analyze_Button_Handler(() => this.app.Handle_Analyze());
        this.ui_controller.Set_Clear_Button_Handler(() => this.app.Handle_Clear());
        this.ui_controller.Set_Copy_Button_Handler(() => this.app.Handle_Copy());
        this.ui_controller.Set_Download_Button_Handler(() => this.app.Handle_Download());
        this.ui_controller.Set_Theme_Toggle_Handler(() => this.app.Handle_Theme_Toggle());

        document.addEventListener('keydown', (e) => this.Handle_Keyboard_Shortcuts(e));
    }

    Handle_Keyboard_Shortcuts(event) {
        const is_ctrl_or_cmd = event.ctrlKey || event.metaKey;

        if (is_ctrl_or_cmd && event.key === 'Enter') {
            event.preventDefault();

            if (!this.app.is_processing)
                this.app.Handle_Analyze();
        }

        if (is_ctrl_or_cmd && event.key === 'k') {
            event.preventDefault();

            if (!this.app.is_processing)
                this.app.Handle_Clear();
        }
    }
}

class App {
    constructor() {
        this.translator = null;
        this.theme = new Theme();
        this.code_analyzer = new Code_Analyzer();
        this.ui_controller = new UI_Controller(this.translator);
        this.event_handler = new App_Event_Handler(this, this.ui_controller);
        this.is_processing = false;
    }

    static async Create_And_Initialize() {
        const app = new App();

        try {
            app.translator = await Translator.Create_And_Initialize();
            app.ui_controller.translator = app.translator;
            app.ui_controller.theme = app.theme;

            app.Initialize_App();
        }
        catch (error) {
            console.error('Failed to initialize the application:', error);

            app.Show_Initialization_Error();
        }
    }

    Initialize_App() {
        this.event_handler.Attach_All();
        this.ui_controller.Update_Button_States();
        this.ui_controller.Update_Line_Numbers();
        this.ui_controller.Update_Initial_Status();
        this.ui_controller.Apply_Static_Translations();
    }

    async Handle_Analyze() {
        if (this.is_processing)
            return;

        const code = this.ui_controller.Get_Input_Code();

        if (!code.trim()) {
            this.ui_controller.Show_Temporary_Status(this.translator.t('empty_input'), 'warning');

            return;
        }

        this.is_processing = true;
        this.ui_controller.Set_Processing_State(true);
        this.ui_controller.Set_Output_Code('');

        try {
            await this.Process_Code_Dynamically(code);
        }
        catch (error) {
            console.error(this.translator.t('analysis_fail'), error);

            this.ui_controller.Show_Error('error_title', 'processing_error');
        }
        finally {
            this.is_processing = false;
            this.ui_controller.Set_Processing_State(false);
        }
    }

    Handle_Clear() {
        if (this.is_processing)
            return;

        this.ui_controller.Clear_Input_And_Output();
        this.ui_controller.Show_Temporary_Status(this.translator.t('cleared'), 'info');
    }

    async Handle_Copy() {
        if (this.is_processing)
            return;

        const success = await this.ui_controller.Copy_Output_To_Clipboard();
        const message_key = success ? 'copying' : 'copy_error';
        const statusType = success ? 'success' : 'error';

        this.ui_controller.Show_Temporary_Status(this.translator.t(message_key), statusType);
    }

    Handle_Download() {
        if (this.is_processing)
            return;

        this.ui_controller.Download_Output();
        this.ui_controller.Show_Temporary_Status(this.translator.t('downloaded'), 'success');
    }

    Handle_Theme_Toggle() {
        this.theme.Toggle_Theme();

        const themeName = this.theme.Get_Current_Theme() === 'light' ? this.translator.t('theme_light') : this.translator.t('theme_dark');

        this.ui_controller.Show_Temporary_Status(themeName, 'info', 1000);
    }

    async Process_Code_Dynamically(code) {
        const analysis_result = this.code_analyzer.Analyze(code);
        const formatted_lines = analysis_result.formatted_code.split('\n');
        const total_lines = formatted_lines.length;

        const LARGE_CODE_THRESHOLD = 1000;
        const CHUNK_SIZE_SMALL = 1;
        const CHUNK_SIZE_LARGE = 25;
        
        const chunk_size = total_lines > LARGE_CODE_THRESHOLD ? CHUNK_SIZE_LARGE : CHUNK_SIZE_SMALL;
        let current_index = 0;

        return new Promise(resolve => {
            const Render_Step = () => {
                const lines_in_this_frame = Math.min(current_index + chunk_size, total_lines);
                let line_buffer = '';

                for (let i = current_index; i < lines_in_this_frame; i++)
                    line_buffer += (i > 0 ? '\n' : '') + formatted_lines[i];

                if (line_buffer)
                    this.ui_controller.Append_Output_Line(line_buffer.substring(current_index > 0 ? 1 : 0));
                
                current_index = lines_in_this_frame;
                
                this.ui_controller.Update_Progress(current_index, total_lines);

                if (current_index < total_lines)
                    requestAnimationFrame(Render_Step);
                else {
                    this.Handle_Analysis_Result(analysis_result);

                    resolve();
                }
            };
            
            requestAnimationFrame(Render_Step);
        });
    }

    Handle_Analysis_Result(result) {
        if (!result)
            return;

        if (result.error)
            this.Handle_Analysis_Error(result.error);
        else {
            const line_count_text = result.stats.lines === 1 ? this.translator.t('line_count_singular') : this.translator.t('line_count_plural');
            const message = `${this.translator.t('finished')} (${result.stats.lines} ${line_count_text})`;

            this.ui_controller.Show_Temporary_Status(message, 'success');
        }
    }

    Handle_Analysis_Error(error) {
        switch (error.type) {
            case 'tooManyOpen':
                this.ui_controller.Show_Error('error_title', 'error_too_many_open', error.count);
                break;
            case 'tooManyClose':
                this.ui_controller.Show_Error_With_Line(
                    'error_title',
                    'error_too_many_close',
                    'error_found_before_line',
                    error.line
                );
                break;
            default:
                this.ui_controller.Show_Error('error_title', 'processing_error');
        }
    }

    Show_Initialization_Error() {
        document.body.innerHTML = `
            <div style="text-align: center; padding: 20px; font-family: sans-serif;">
                <h1>Critical Error</h1>
                <p>The application could not be loaded. Please try reloading the page.</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    App.Create_And_Initialize();
});