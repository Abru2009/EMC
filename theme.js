(function () {
    const keys = {
        mode: 'emc-color-mode',
        legacyMode: 'emc-color-theme',
        palette: 'emc-color-palette',
        grade: 'emc-selected-grade'
    };
    const valid = {
        mode: ['light', 'dark'],
        palette: ['warm', 'cool', 'abstract'],
        grade: ['10', '11', '12']
    };

    function read(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.warn('A saved appearance preference could not be read.', error);
            return null;
        }
    }

    function write(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn('An appearance preference could not be saved.', error);
        }
    }

    const savedMode = read(keys.mode) || read(keys.legacyMode);
    let mode = valid.mode.includes(savedMode)
        ? savedMode
        : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    let palette = read(keys.palette);
    if (!valid.palette.includes(palette)) palette = 'warm';
    let grade = read(keys.grade);
    if (!valid.grade.includes(grade)) grade = '10';
    const challengeSets = {
        '10': [
            ['A triangle has sides in ratio 3:4:5 and perimeter 36 cm. What is its longest side?', 'The scale factor is 3, so the sides are 9, 12, and 15 cm.'],
            ['A quadratic has roots 2 and 5. What is the sum of its roots?', '7. The sum of roots is −b/a.'],
            ['An AP starts 4, 7, 10, … What is its 10th term?', '31. Use aₙ = a + (n−1)d = 4 + 9×3.'],
            ['A fair die is rolled. What is the probability of getting a prime number?', '1/2. The prime faces are 2, 3, and 5.']
        ],
        '11': [
            ['If sin θ = 3/5 and θ is acute, what is cos θ?', '4/5, from sin²θ + cos²θ = 1.'],
            ['How many ways can you choose 2 students from a group of 5?', '10 ways: ⁵C₂ = 5×4/(2×1).'],
            ['What is the sum 1 + 2 + … + 20?', '210, using n(n+1)/2.'],
            ['If P is true and Q is false, is P ⇒ Q true or false?', 'False. An implication fails only for a true premise and a false conclusion.']
        ],
        '12': [
            ['What is the determinant of [[2, 1], [3, 4]]?', '5. For a 2×2 matrix, det = ad − bc = 8 − 3.'],
            ['What is the derivative of x³ at x = 2?', '12. The derivative is 3x².'],
            ['If a geometric series starts at 8 with ratio 1/2, what is its infinite sum?', '16, using a/(1−r) = 8/(1−1/2).'],
            ['What is the dot product of (1, 2, 3) and (2, 0, 1)?', '5: 1×2 + 2×0 + 3×1.']
        ]
    };
    let challengeIndex = Math.floor(Date.now() / 86400000) % 4;

    function updateChallenge() {
        const question = document.getElementById('dailyChallengeQuestion');
        const answer = document.getElementById('dailyChallengeAnswer');
        const reveal = document.getElementById('revealChallenge');
        if (!question || !answer || !reveal) return;
        const challenge = challengeSets[grade][challengeIndex % challengeSets[grade].length];
        question.textContent = challenge[0];
        answer.textContent = challenge[1];
        answer.hidden = true;
        reveal.textContent = 'Reveal answer';
        reveal.setAttribute('aria-expanded', 'false');
    }

    const routeGrade = document.body.dataset.gradePage
        || (location.pathname.includes('/grade-10/') ? '10' : '');
    if (valid.grade.includes(routeGrade)) {
        grade = routeGrade;
        write(keys.grade, grade);
    }

    function applyPreferences() {
        const root = document.documentElement;
        root.dataset.theme = mode;
        root.dataset.palette = palette;
        root.dataset.grade = grade;

        document.querySelectorAll('.theme-mode-button').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
        });
        document.querySelectorAll('.theme-palette-select').forEach(select => {
            select.value = palette;
        });
        document.querySelectorAll('.grade-select').forEach(select => {
            select.value = grade;
        });

        updateGradeContent();
        window.dispatchEvent(new Event('emc-preferences-change'));
    }

    function addSettings() {
        const revealChallenge = document.getElementById('revealChallenge');
        const challengeAnswer = document.getElementById('dailyChallengeAnswer');
        revealChallenge?.addEventListener('click', () => {
            const shouldReveal = challengeAnswer.hidden;
            challengeAnswer.hidden = !shouldReveal;
            revealChallenge.textContent = shouldReveal ? 'Hide answer' : 'Reveal answer';
            revealChallenge.setAttribute('aria-expanded', String(shouldReveal));
        });
        document.getElementById('nextChallenge')?.addEventListener('click', () => {
            challengeIndex++;
            updateChallenge();
        });

        const controls = document.createElement('div');
        controls.className = 'settings-controls';

        const openButton = document.createElement('button');
        openButton.className = 'settings-button';
        openButton.type = 'button';
        openButton.setAttribute('aria-label', 'Open settings');
        openButton.setAttribute('aria-haspopup', 'dialog');
        openButton.setAttribute('aria-expanded', 'false');
        openButton.innerHTML = '<span aria-hidden="true">⚙</span>';

        const panel = document.createElement('section');
        panel.className = 'settings-panel';
        panel.id = 'appearanceSettings';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Appearance and grade settings');
        panel.hidden = true;

        const title = document.createElement('h2');
        title.textContent = 'Settings';
        const closeButton = document.createElement('button');
        closeButton.className = 'settings-close';
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', 'Close settings');
        closeButton.textContent = '×';
        const header = document.createElement('div');
        header.className = 'settings-header';
        header.append(title, closeButton);

        const gradeLabel = document.createElement('label');
        gradeLabel.htmlFor = 'settingsGrade';
        gradeLabel.textContent = 'Grade';
        const gradeSelect = document.createElement('select');
        gradeSelect.className = 'grade-select';
        gradeSelect.id = 'settingsGrade';
        [['10', 'Grade 10'], ['11', 'Grade 11'], ['12', 'Grade 12']].forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            gradeSelect.appendChild(option);
        });
        gradeSelect.addEventListener('change', () => {
            grade = gradeSelect.value;
            write(keys.grade, grade);
            applyPreferences();
            navigateForGrade();
        });

        const modeLabel = document.createElement('span');
        modeLabel.className = 'settings-label';
        modeLabel.textContent = 'Appearance';
        const modeGroup = document.createElement('div');
        modeGroup.className = 'settings-mode-group';
        modeGroup.setAttribute('role', 'group');
        modeGroup.setAttribute('aria-label', 'Light or dark mode');
        [['light', 'Light'], ['dark', 'Dark']].forEach(([value, label]) => {
            const button = document.createElement('button');
            button.className = 'theme-mode-button';
            button.type = 'button';
            button.dataset.mode = value;
            button.textContent = label;
            button.addEventListener('click', () => {
                mode = value;
                write(keys.mode, mode);
                applyPreferences();
            });
            modeGroup.appendChild(button);
        });

        const paletteLabel = document.createElement('label');
        paletteLabel.htmlFor = 'settingsPalette';
        paletteLabel.textContent = 'Color theme';
        const paletteSelect = document.createElement('select');
        paletteSelect.className = 'theme-palette-select';
        paletteSelect.id = 'settingsPalette';
        [['warm', 'Warm'], ['cool', 'Cool'], ['abstract', 'Abstract']].forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            paletteSelect.appendChild(option);
        });
        paletteSelect.addEventListener('change', () => {
            palette = paletteSelect.value;
            write(keys.palette, palette);
            applyPreferences();
        });

        panel.append(header, gradeLabel, gradeSelect, modeLabel, modeGroup, paletteLabel, paletteSelect);
        controls.append(openButton, panel);

        openButton.addEventListener('click', () => {
            const isOpen = panel.hidden;
            panel.hidden = !isOpen;
            openButton.setAttribute('aria-expanded', String(isOpen));
            if (isOpen) closeButton.focus();
            else openButton.focus();
        });
        closeButton.addEventListener('click', () => {
            panel.hidden = true;
            openButton.setAttribute('aria-expanded', 'false');
            openButton.focus();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !panel.hidden) {
                panel.hidden = true;
                openButton.setAttribute('aria-expanded', 'false');
                openButton.focus();
            }
        });
        updateChallenge();
        document.addEventListener('pointerdown', event => {
            if (!panel.hidden && !controls.contains(event.target)) {
                panel.hidden = true;
                openButton.setAttribute('aria-expanded', 'false');
            }
        });

        const navbar = document.querySelector('.navbar');
        const backLink = document.querySelector('.back-home');
        if (navbar) navbar.append(controls);
        else if (backLink) {
            const toolbar = document.createElement('div');
            toolbar.className = 'calculator-toolbar';
            backLink.parentNode.insertBefore(toolbar, backLink);
            toolbar.append(controls, backLink);
        } else {
            document.body.prepend(controls);
        }
        applyPreferences();
    }

    function updateGradeContent() {
        document.querySelectorAll('[data-grade-section]').forEach(section => {
            section.hidden = section.dataset.gradeSection !== grade;
        });
        document.querySelectorAll('[data-grade-view]').forEach(view => {
            const image = view.querySelector('img[data-src]');
            if (view.dataset.gradeView === grade && image && !image.getAttribute('src')) {
                image.setAttribute('src', image.dataset.src);
            }
            const imageReady = view.dataset.imageReady === 'true';
            view.hidden = view.dataset.gradeView !== grade || !imageReady;
            view.setAttribute('aria-hidden', String(view.hidden));
        });

        const headline = document.querySelector('[data-grade-headline]');
        if (headline) headline.textContent = `Grade ${grade} Mathematics`;
        const description = document.querySelector('[data-grade-description]');
        if (description) description.textContent = `Explore focused NCERT Grade ${grade} calculators, organized by chapter.`;
        const gradeHighlight = document.querySelector('[data-grade-highlight]');
        if (gradeHighlight) gradeHighlight.textContent = `Tools organized around NCERT Grade ${grade} chapters.`;
        const kicker = document.querySelector('[data-grade-kicker]');
        if (kicker) kicker.textContent = `CBSE • NCERT • GRADE ${grade}`;

        const search = document.getElementById('chapterSearch');
        if (search) updateChapterSearch();
        const textbook = document.querySelector('[data-grade-textbook-link]');
        if (textbook) {
            const links = {
                '10': ['NCERT Grade 10 Mathematics textbook', 'https://ncert.nic.in/textbook.php?jemh1=1-15'],
                '11': ['NCERT Grade 11 Mathematics textbook', 'https://ncert.nic.in/textbook.php?kemh1=0-16'],
                '12': ['NCERT Grade 12 Mathematics textbook', 'https://ncert.nic.in/textbook.php?lemh1=0-13']
            };
            textbook.textContent = `Open the ${links[grade][0]} ↗`;
            textbook.href = links[grade][1];
        }
        const calculatorLink = document.querySelector('[data-grade-calculators-link]');
        if (calculatorLink) {
            calculatorLink.href = grade === '10' ? 'calculators.html#grade-10' : `grade-${grade}/index.html`;
            calculatorLink.innerHTML = `Explore Grade ${grade} calculators <span aria-hidden="true">→</span>`;
        }
        document.querySelectorAll('[data-grade-count]').forEach(count => {
            if (count.closest('[data-grade-section]')?.dataset.gradeSection === grade) {
                const total = count.closest('[data-grade-section]').querySelectorAll('.calc-button').length;
                count.textContent = `${total} chapters available`;
            }
        });
        updateChallenge();
    }

    function updateChapterSearch() {
        const search = document.getElementById('chapterSearch');
        const count = document.getElementById('chapterCount');
        const emptyState = document.getElementById('noChapters');
        const section = document.querySelector(`[data-grade-section="${grade}"]`);
        if (!search || !section) return;
        const chapters = [...section.querySelectorAll('.calc-button')];
        const query = search.value.trim().toLocaleLowerCase();
        let visible = 0;
        chapters.forEach(chapter => {
            const matches = chapter.textContent.trim().toLocaleLowerCase().includes(query);
            chapter.hidden = !matches;
            if (matches) visible += 1;
        });
        if (count) count.textContent = query ? `${visible} of ${chapters.length} chapters` : `${chapters.length} chapters available`;
        if (emptyState) emptyState.hidden = visible !== 0;
    }

    function navigateForGrade() {
        const pageGrade = document.body.dataset.gradePage
            || (location.pathname.includes('/grade-10/') ? '10' : '');
        if (pageGrade && pageGrade !== grade) {
            location.assign(grade === '10' ? '../calculators.html#grade-10' : `../grade-${grade}/index.html`);
            return;
        }
        if (document.getElementById('chapterGrid')) location.hash = `grade-${grade}`;
    }

    function bindSearch() {
        const search = document.getElementById('chapterSearch');
        if (search) search.addEventListener('input', updateChapterSearch);
    }

    applyPreferences();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            addSettings();
            bindSearch();
        }, { once: true });
    } else {
        addSettings();
        bindSearch();
    }

    window.addEventListener('storage', event => {
        if (Object.values(keys).includes(event.key)) {
            if (event.key === keys.mode || event.key === keys.legacyMode) {
                mode = valid.mode.includes(event.newValue)
                    ? event.newValue
                    : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            } else if (event.key === keys.palette) {
                palette = valid.palette.includes(event.newValue) ? event.newValue : 'warm';
            } else if (event.key === keys.grade) {
                grade = valid.grade.includes(event.newValue) ? event.newValue : '10';
            }
            applyPreferences();
        }
    });
})();
