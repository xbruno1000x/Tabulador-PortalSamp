class Analysis_State {
    constructor() {
        this.Reset();
    }

    Reset() {
        this.brace_balance = 0;
        this.current_indent_level = 0;
        this.first_error_line = -1;
    }

    Update_Brace_Balance(open_braces, close_braces, line_number) {
        this.brace_balance += open_braces;
        this.brace_balance -= close_braces;

        if (this.brace_balance < 0 && this.first_error_line === -1)
            this.first_error_line = line_number;
    }

    Update_Indent_Level(open_braces, close_braces) {
        this.current_indent_level += open_braces - close_braces;
        this.current_indent_level = Math.max(0, this.current_indent_level);
    }
}

class Line_Parser {
    Analyze_Braces(line) {
        let open_braces = 0, close_braces = 0;
        let in_single_quote = false, in_double_quote = false, escaped = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (escaped) {
                escaped = false;

                continue;
            }

            if (char === '\\') {
                escaped = true;

                continue;
            }

            if (char === "'" && !in_double_quote)
                in_single_quote = !in_single_quote;

            if (char === '"' && !in_single_quote)
                in_double_quote = !in_double_quote;

            if (!in_single_quote && !in_double_quote) {
                if (char === '/' && line[i + 1] === '/')
                    break;

                if (char === '/' && line[i + 1] === '*') {
                    const end_comment = line.indexOf('*/', i + 2);

                    if (end_comment !== -1) {
                        i = end_comment + 1;

                        continue;
                    }

                    break;
                }

                if (char === '{')
                    open_braces++;
                else if (char === '}')
                    close_braces++;
            }
        }
        return {
            open_braces,
            close_braces
        };
    }

    Count_Leading_Close_Braces(line) {
        let count = 0;

        for (const char of line.trimStart()) {
            if (char === '}')
                count++;
            else
                break;
        }

        return count;
    }
}

export class Code_Analyzer {
    constructor() {
        this.state = new Analysis_State();
        this.parser = new Line_Parser();
    }

    Analyze(code) {
        if (!code || code.trim().length === 0) {
            return { 
                formatted_code: '', 
                error: { type: 'empty_input' },
                stats: {
                    lines: 0,
                    open_braces: 0,
                    close_braces: 0
                }
            };
        }

        this.state.Reset();
        
        const lines = this.Normalize_Line_Endings(code).split('\n');
        const formatted_lines = [];
        let total_open_braces = 0, total_close_braces = 0;

        for (let i = 0; i < lines.length; i++) {
            const original_line = lines[i];
            const trimmed_line = original_line.trimStart();

            if (trimmed_line.length === 0) {
                formatted_lines.push('');

                continue;
            }

            const line_analysis = this.parser.Analyze_Braces(trimmed_line);

            total_open_braces += line_analysis.open_braces;
            total_close_braces += line_analysis.close_braces;
            
            this.state.Update_Brace_Balance(line_analysis.open_braces, line_analysis.close_braces, i + 1);

            const leading_close_braces = this.parser.Count_Leading_Close_Braces(trimmed_line);
            const indent_level = Math.max(0, this.state.current_indent_level - leading_close_braces);
            
            formatted_lines.push('\t'.repeat(indent_level) + trimmed_line);
            
            this.state.Update_Indent_Level(line_analysis.open_braces, line_analysis.close_braces);
        }

        const formatted_code = formatted_lines.join('\n');
        const adjusted_code = this.Adjust_Return_Alignment(formatted_code);

        return {
            formatted_code: adjusted_code,
            error: this.Determine_Error(),
            stats: {
                lines: lines.length,
                open_braces: total_open_braces,
                close_braces: total_close_braces
            }
        };
    }

    Determine_Error() {
        if (this.state.brace_balance > 0)
            return {
                type: 'tooManyOpen',
                count: this.state.brace_balance
            };

        if (this.state.brace_balance < 0 || this.state.first_error_line > 0)
            return {
                type: 'tooManyClose',
                line: this.state.first_error_line
            };

        return null;
    }

    Normalize_Line_Endings(code) {
        return code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }

    Adjust_Return_Alignment(text) {
        const lines = text.split('\n');
        const adjusted_lines = [];
        let nesting_level = 0;

        for (const line of lines) {
            const trimmed = line.trimStart();
            
            if (trimmed.length === 0) {
                adjusted_lines.push('');

                continue;
            }

            const leading_close_braces = this.parser.Count_Leading_Close_Braces(trimmed);
            nesting_level = Math.max(0, nesting_level - leading_close_braces);

            if (trimmed.startsWith('return') && nesting_level > 0)
                adjusted_lines.push('\t'.repeat(nesting_level) + trimmed);
            else
                adjusted_lines.push(line);

            const brace_balance_in_line = this.parser.Analyze_Braces(trimmed);
            nesting_level += brace_balance_in_line.open_braces - brace_balance_in_line.close_braces;
            nesting_level = Math.max(0, nesting_level);
        }

        return adjusted_lines.join('\n');
    }
}