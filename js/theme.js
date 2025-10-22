class Theme_Storage {
    constructor(key = 'theme') {
        this.key = key;
    }

    Get_Theme() {
        try {
            return localStorage.getItem(this.key);
        }
        catch (error) {
            console.warn('Failed to read theme preference:', error);
            
            return null;
        }
    }

    Set_Theme(theme) {
        try {
            localStorage.setItem(this.key, theme);
        }
        catch (error) {
            console.warn('Failed to save theme preference:', error);
        }
    }
}

class Theme_DOM {
    constructor(options = {}) {
        this.root = document.documentElement;
        this.toggle_button = document.getElementById('theme-toggle');
        this.light_theme_class = options.light_theme_class || 'light-theme';
        this.transition_duration = options.transition_duration || 300;
    }

    Apply_Theme_Class(theme) {
        this.root.style.transition = `background-color ${this.transition_duration}ms ease, color ${this.transition_duration}ms ease`;

        if (theme === 'light')
            this.root.classList.add(this.light_theme_class);
        else
            this.root.classList.remove(this.light_theme_class);

        setTimeout(() => {
            this.root.style.transition = '';
        }, this.transition_duration);
    }

    Update_Toggle_Icon(theme) {
        if (!this.toggle_button)
            return;

        const icon_dark = this.toggle_button.querySelector('.icon-dark');
        const icon_light = this.toggle_button.querySelector('.icon-light');

        if (theme === 'light') {
            if (icon_dark)
                icon_dark.style.display = 'none';

            if (icon_light)
                icon_light.style.display = 'inline-block';
        }
        else {
            if (icon_dark)
                icon_dark.style.display = 'inline-block';

            if (icon_light)
                icon_light.style.display = 'none';
        }
    }

    Animate_Toggle_Button() {
        if (!this.toggle_button)
            return;

        this.toggle_button.style.transform = 'rotate(360deg)';
        this.toggle_button.style.transition = 'transform 0.5s ease';

        setTimeout(() => {
            this.toggle_button.style.transform = '';
            this.toggle_button.style.transition = '';
        }, 500);
    }
}

class Theme_System {
    Get_Preference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches)
            return 'light';

        return 'dark';
    }

    Watch(callback) {
        if (!window.matchMedia)
            return;

        const media_query = window.matchMedia('(prefers-color-scheme: light)');
        
        const Handle_Change = (e) => {
            const new_theme = e.matches ? 'light' : 'dark';
            callback(new_theme);
        };

        if (media_query.addEventListener)
            media_query.addEventListener('change', Handle_Change);
        else if (media_query.addListener)
            media_query.addListener(Handle_Change);
    }
}

export class Theme {
    constructor() {
        this.storage = new Theme_Storage('theme');
        this.dom = new Theme_DOM();
        this.system = new Theme_System();
        
        this.current_theme = this.Get_Initial_Theme();
        this.Apply_Theme(this.current_theme, false);
        this.Watch_System_Preference();
    }

    Get_Initial_Theme() {
        const saved_theme = this.storage.Get_Theme();

        return saved_theme || this.system.Get_Preference();
    }

    Get_Current_Theme() {
        return this.current_theme;
    }

    Apply_Theme(theme, save = true) {
        this.current_theme = theme;
        
        this.dom.Apply_Theme_Class(theme);
        this.dom.Update_Toggle_Icon(theme);

        if (save)
            this.storage.Set_Theme(theme);
    }

    Toggle_Theme() {
        const new_theme = this.current_theme === 'light' ? 'dark' : 'light';

        this.Apply_Theme(new_theme, true);
        this.dom.Animate_Toggle_Button();
    }

    Watch_System_Preference() {
        this.system.Watch((new_theme) => {
            if (!this.storage.Get_Theme())
                this.Apply_Theme(new_theme, false);
        });
    }
}