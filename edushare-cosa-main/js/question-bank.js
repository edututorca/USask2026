/* ===================================================== */
/* EduShare — Question Bank (User-Area) JavaScript       */
/* ===================================================== */

(function () {

    // ── State ───────────────────────────────────────────
    let currentSubjectId = null;
    let currentSubjectName = '';
    let currentCourseLabel = '';
    let drillBars = [];        // array of { level, parentId, nodes, selectedId, selectedName, label }
    let questions = [];
    let sublayerTargetLevel = -1;

    // ── DOM refs ────────────────────────────────────────
    const sidebarCourses = document.getElementById('sidebarCourses');
    const subjectTitle = document.getElementById('subjectTitle');
    const courseLabel = document.getElementById('courseLabel');
    const drillBarsContainer = document.getElementById('drillBarsContainer');
    const sublayerBar = document.getElementById('sublayerBar');
    const sublayerPrompt = document.getElementById('sublayerPrompt');
    const sublayerFormEl = document.getElementById('sublayerForm');
    const breadcrumb = document.getElementById('breadcrumb');
    const qCount = document.getElementById('qCount');
    const questionList = document.getElementById('questionList');
    const selGroup = document.getElementById('selGroup');
    const selCount = document.getElementById('selCount');

    const TYPE_LABELS = {
        multiple_choice: 'Multiple Choice',
        true_false: 'True / False',
        short_answer: 'Short Answer',
        essay: 'Essay'
    };

    // ── Initialize ──────────────────────────────────────
    loadSidebar();

    // ── Profile menu ────────────────────────────────────
    window.toggleProfileMenu = function () {
        document.getElementById('profileDropdown').classList.toggle('show');
    };
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.profile-menu')) {
            const dd = document.getElementById('profileDropdown');
            if (dd) dd.classList.remove('show');
        }
    });

    // ── Logout ──────────────────────────────────────────
    window.logout = function () {
        apiRequest('/auth/logout', { method: 'POST' })
            .then(() => { window.location.href = 'Login.html'; })
            .catch(() => { window.location.href = 'Login.html'; });
    };

    // ═════════════════════════════════════════════════════
    // SIDEBAR
    // ═════════════════════════════════════════════════════

    async function loadSidebar() {
        const userId = getCurrentUserId() || 1;

        try {
            const courses = await apiRequest(`/user-courses?userId=${userId}`);

            if (!courses || courses.length === 0) {
                sidebarCourses.innerHTML = `
                    <div class="sidebar-loading">
                        No courses yet.<br>
                        <a href="Add-course.html" style="color:var(--orange);font-weight:600;">Add your first course</a>
                    </div>`;
                return;
            }

            // Group courses by subject
            const grouped = {};
            courses.forEach(c => {
                const subName = c.subject_name;
                if (!grouped[subName]) {
                    grouped[subName] = { subjectId: c.subject_id, courses: [] };
                }
                grouped[subName].courses.push(c);
            });

            let html = '';
            for (const [subName, data] of Object.entries(grouped)) {
                const subKey = subName.toLowerCase().replace(/\s+/g, '-');
                html += `
                    <div class="subject-item" data-subject-id="${data.subjectId}" data-subject-name="${subName}" onclick="toggleSidebarSubject(this, '${subKey}')">
                        <span>${esc(subName)}</span>
                        <span class="arrow">▶</span>
                    </div>
                    <div class="course-children" id="children-${subKey}">`;

                data.courses.forEach(c => {
                    const label = c.section ? `${c.course_code} — ${c.section}` : c.course_code;
                    html += `
                        <div class="course-item" data-subject-id="${c.subject_id}" data-subject-name="${subName}" data-label="${esc(label)}" onclick="selectSidebarCourse(this)">
                            <span class="dot"></span>${esc(label)}
                        </div>`;
                });

                html += '</div>';
            }

            sidebarCourses.innerHTML = html;

        } catch (err) {
            console.error('Failed to load sidebar courses:', err);
            sidebarCourses.innerHTML = '<div class="sidebar-loading">Failed to load courses</div>';
        }
    }

    window.toggleSidebarSubject = function (el, key) {
        const children = document.getElementById('children-' + key);
        const isOpen = children.classList.contains('open');

        // Close all
        document.querySelectorAll('.course-children').forEach(c => c.classList.remove('open'));
        document.querySelectorAll('.subject-item').forEach(s => s.classList.remove('expanded'));

        if (!isOpen) {
            children.classList.add('open');
            el.classList.add('expanded');
        }
    };

    window.selectSidebarCourse = function (el) {
        // Update active states
        document.querySelectorAll('.course-item').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.subject-item').forEach(s => s.classList.remove('active'));
        el.classList.add('active');
        el.closest('.course-children').previousElementSibling.classList.add('active');

        // Set current context
        currentSubjectId = el.dataset.subjectId;
        currentSubjectName = el.dataset.subjectName;
        currentCourseLabel = el.dataset.label;

        // Update header
        subjectTitle.textContent = currentSubjectName;
        courseLabel.textContent = currentCourseLabel;

        // Reset drill-down and load
        drillBars = [];
        sublayerTargetLevel = -1;
        drillBarsContainer.innerHTML = '';
        hideSublayer();
        loadDrillBar(0, null);
        loadQuestions();
    };

    // ═════════════════════════════════════════════════════
    // DRILL-DOWN BARS
    // ═════════════════════════════════════════════════════

    async function loadDrillBar(level, parentId) {
        if (!currentSubjectId) return;

        try {
            let url = `/hierarchy/nodes?subjectId=${currentSubjectId}`;
            if (parentId) url += `&parentId=${parentId}`;

            const nodes = await apiRequest(url);

            if (!nodes || nodes.length === 0) {
                if (level > 0 && level <= 3) {
                    showSublayerPrompt(level);
                }
                return;
            }

            const label = nodes[0].label || `Level ${level + 1}`;

            // Trim state to this level
            drillBars = drillBars.slice(0, level);

            drillBars.push({
                level: level,
                parentId: parentId,
                nodes: nodes,
                selectedId: null,
                selectedName: null,
                label: label
            });

            hideSublayer();
            appendBarToDOM(drillBars[level]);
            updateBreadcrumb();

        } catch (err) {
            console.error(`Failed to load drill bar level ${level}:`, err);
        }
    }

    // Build a single bar's DOM element
    function createBarElement(bar) {
        const container = document.createElement('div');
        container.className = 'drill-bar-container';
        container.dataset.level = bar.level;

        let chipsHtml = '';
        bar.nodes.forEach(node => {
            const isActive = bar.selectedId === node.id;
            chipsHtml += `<span class="drill-chip${isActive ? ' active' : ''}" data-node-id="${node.id}" data-node-name="${esc(node.name)}" data-level="${bar.level}" onclick="selectDrillChip(this)">${esc(node.name)}</span>`;
        });
        chipsHtml += `<span class="drill-chip add" data-level="${bar.level}" onclick="addNodeToBar(${bar.level})">+ Add</span>`;

        container.innerHTML = `
            <div class="drill-bar-inner">
                <span class="drill-bar-label">${esc(bar.label)}</span>
                <div class="drill-scroll-area no-fade-left">
                    <div class="drill-scroll">${chipsHtml}</div>
                </div>
            </div>`;

        return container;
    }

    // Append a new bar to the DOM (no rebuild of existing bars)
    function appendBarToDOM(bar) {
        const el = createBarElement(bar);
        drillBarsContainer.appendChild(el);
    }

    // Remove all bar DOM elements below a given level
    function removeBarsFromDOM(aboveLevel) {
        const barEls = drillBarsContainer.querySelectorAll('.drill-bar-container');
        barEls.forEach(el => {
            if (parseInt(el.dataset.level) > aboveLevel) {
                el.remove();
            }
        });
    }

    // Full rebuild — only used on course switch
    function renderAllBars() {
        drillBarsContainer.innerHTML = '';
        drillBars.forEach(bar => appendBarToDOM(bar));
        updateBreadcrumb();
    }

    window.selectDrillChip = function (el) {
        const level = parseInt(el.dataset.level);
        const nodeId = parseInt(el.dataset.nodeId);
        const nodeName = el.dataset.nodeName;
        const bar = drillBars[level];

        // Toggle off if clicking same chip
        if (bar.selectedId === nodeId) {
            bar.selectedId = null;
            bar.selectedName = null;
            el.classList.remove('active');

            // Remove bars below in state and DOM
            drillBars = drillBars.slice(0, level + 1);
            removeBarsFromDOM(level);
            hideSublayer();
            loadQuestions();
            updateBreadcrumb();
            return;
        }

        // Deselect siblings in this bar (just toggle CSS, no rebuild)
        const barEl = drillBarsContainer.querySelector(`.drill-bar-container[data-level="${level}"]`);
        if (barEl) {
            barEl.querySelectorAll('.drill-chip').forEach(c => c.classList.remove('active'));
        }
        el.classList.add('active');

        // Update state
        bar.selectedId = nodeId;
        bar.selectedName = nodeName;

        // Remove bars below in state and DOM
        drillBars = drillBars.slice(0, level + 1);
        removeBarsFromDOM(level);
        hideSublayer();

        loadQuestions();
        updateBreadcrumb();

        // Load children for next bar
        if (level < 3) {
            loadDrillBar(level + 1, nodeId);
        }
    };

    window.addNodeToBar = async function (level) {
        const name = prompt('Enter a name:');
        if (!name || !name.trim()) return;

        const bar = drillBars[level];
        const parentId = bar.parentId || null;

        try {
            const result = await apiRequest('/hierarchy/nodes', {
                method: 'POST',
                body: JSON.stringify({
                    subjectId: currentSubjectId,
                    parentId: parentId,
                    name: name.trim(),
                    label: bar.label,
                    createdBy: getCurrentUserId() || 1
                })
            });

            if (result.success && result.node) {
                bar.nodes.push(result.node);

                // Insert new chip before the + Add button (no full rebuild)
                const barEl = drillBarsContainer.querySelector(`.drill-bar-container[data-level="${level}"]`);
                const addBtn = barEl.querySelector('.drill-chip.add');
                const newChip = document.createElement('span');
                newChip.className = 'drill-chip';
                newChip.dataset.nodeId = result.node.id;
                newChip.dataset.nodeName = result.node.name;
                newChip.dataset.level = level;
                newChip.textContent = result.node.name;
                newChip.onclick = function () { window.selectDrillChip(newChip); };
                addBtn.parentNode.insertBefore(newChip, addBtn);
            }
        } catch (err) {
            console.error('Failed to add node:', err);
            alert('Failed to add. Please try again.');
        }
    };

    // ═════════════════════════════════════════════════════
    // SUB-LAYER
    // ═════════════════════════════════════════════════════

    function showSublayerPrompt(level) {
        sublayerTargetLevel = level;
        sublayerBar.classList.remove('hidden');
        sublayerPrompt.classList.remove('hidden');
        sublayerFormEl.classList.add('hidden');
    }

    function hideSublayer() {
        sublayerTargetLevel = -1;
        sublayerBar.classList.add('hidden');
        sublayerFormEl.classList.add('hidden');
        sublayerPrompt.classList.remove('hidden');
    }

    window.showSublayerForm = function () {
        sublayerPrompt.classList.add('hidden');
        sublayerFormEl.classList.remove('hidden');
        document.getElementById('sublayerName').value = '';
        document.getElementById('sublayerFirst').value = '';
        document.getElementById('sublayerName').focus();
    };

    window.cancelSublayer = function () {
        sublayerFormEl.classList.add('hidden');
        sublayerPrompt.classList.remove('hidden');
    };

    window.createSublayer = async function () {
        const layerName = document.getElementById('sublayerName').value.trim();
        const firstName = document.getElementById('sublayerFirst').value.trim();
        if (!layerName || !firstName) {
            alert('Please fill in both fields.');
            return;
        }

        // Parent is the selected chip from the bar above
        const parentBar = drillBars[sublayerTargetLevel - 1];
        if (!parentBar || !parentBar.selectedId) {
            alert('No parent selected.');
            return;
        }

        try {
            const result = await apiRequest('/hierarchy/nodes', {
                method: 'POST',
                body: JSON.stringify({
                    subjectId: currentSubjectId,
                    parentId: parentBar.selectedId,
                    name: firstName,
                    label: layerName,
                    createdBy: getCurrentUserId() || 1
                })
            });

            if (result.success) {
                // Reload the drill bar at this level
                hideSublayer();
                loadDrillBar(sublayerTargetLevel, parentBar.selectedId);
            }
        } catch (err) {
            console.error('Failed to create sub-layer:', err);
            alert('Failed to create. Please try again.');
        }
    };

    // ═════════════════════════════════════════════════════
    // BREADCRUMB
    // ═════════════════════════════════════════════════════

    function updateBreadcrumb() {
        if (!currentSubjectName) {
            breadcrumb.innerHTML = '<span class="crumb current">Select a course</span>';
            qCount.textContent = '';
            return;
        }

        let parts = [`<span class="crumb" onclick="resetDrill()">${esc(currentSubjectName)}</span>`];

        drillBars.forEach((bar, idx) => {
            if (!bar.selectedId) return;
            const isLast = idx === drillBars.length - 1 ||
                           !drillBars[idx + 1] ||
                           !drillBars[idx + 1].selectedId;

            parts.push('<span class="sep">›</span>');
            if (isLast) {
                parts.push(`<span class="crumb current">${esc(bar.selectedName)}</span>`);
            } else {
                parts.push(`<span class="crumb" onclick="resetToLevel(${idx})">${esc(bar.selectedName)}</span>`);
            }
        });

        const count = questions.length;
        breadcrumb.innerHTML = parts.join('');
        qCount.textContent = `${count} question${count !== 1 ? 's' : ''}`;
    }

    window.resetDrill = function () {
        // Deselect first bar's chip
        const firstBarEl = drillBarsContainer.querySelector('.drill-bar-container[data-level="0"]');
        if (firstBarEl) {
            firstBarEl.querySelectorAll('.drill-chip').forEach(c => c.classList.remove('active'));
        }

        drillBars.forEach(bar => {
            bar.selectedId = null;
            bar.selectedName = null;
        });
        drillBars = drillBars.slice(0, 1);
        removeBarsFromDOM(0);
        hideSublayer();
        loadQuestions();
        updateBreadcrumb();
    };

    window.resetToLevel = function (level) {
        // Deselect chips below this level
        for (let i = level + 1; i < drillBars.length; i++) {
            drillBars[i].selectedId = null;
            drillBars[i].selectedName = null;
        }
        drillBars = drillBars.slice(0, level + 1);
        removeBarsFromDOM(level);
        hideSublayer();
        loadQuestions();
        updateBreadcrumb();

        // Reload children for the selected node at this level
        const bar = drillBars[level];
        if (bar.selectedId && level < 3) {
            loadDrillBar(level + 1, bar.selectedId);
        }
    };

    // ═════════════════════════════════════════════════════
    // QUESTIONS
    // ═════════════════════════════════════════════════════

    async function loadQuestions() {
        if (!currentSubjectId) return;

        // Find the deepest selected node
        let deepestNodeId = null;
        for (let i = drillBars.length - 1; i >= 0; i--) {
            if (drillBars[i].selectedId) {
                deepestNodeId = drillBars[i].selectedId;
                break;
            }
        }

        questionList.innerHTML = '<div class="loading-spinner">Loading questions...</div>';

        try {
            let url = `/questions?subjectId=${currentSubjectId}`;
            if (deepestNodeId) {
                url += `&nodeId=${deepestNodeId}`;
            }

            questions = await apiRequest(url);

            if (!questions || !Array.isArray(questions)) {
                questions = [];
            }

            renderQuestions();
            updateBreadcrumb();
        } catch (err) {
            console.error('Failed to load questions:', err);
            questions = [];
            questionList.innerHTML = `
                <div class="prompt-state">
                    <div class="prompt-icon"><svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="13" cy="13" r="10"/><path d="M9 9h.01M17 9h.01M10 15s1.5 2 3 2 3-2 3-2"/></svg></div>
                    <h3>Failed to load questions</h3>
                    <p>Check your connection and try again.</p>
                </div>`;
        }
    }

    function renderQuestions() {
        if (questions.length === 0) {
            questionList.innerHTML = `
                <div class="prompt-state">
                    <div class="prompt-icon"><svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="13" cy="13" r="10"/><path d="M9 9h.01M17 9h.01M9 16c1.5 1.5 5.5 1.5 7 0"/></svg></div>
                    <h3>No questions here yet</h3>
                    <p>Create questions manually or generate them with AI to get started.</p>
                </div>`;
            return;
        }

        questionList.innerHTML = questions.map((q, idx) => {
            const typeLabel = TYPE_LABELS[q.question_type] || q.question_type;
            const typeClass = q.question_type || 'multiple_choice';

            // Build options HTML
            let optionsHtml = '';
            if (q.options && q.options.length > 0) {
                // Options from question_options table
                const cols = q.question_type === 'true_false' ? 'auto auto 1fr' : '1fr 1fr';
                const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                optionsHtml = `<div class="q-options" style="grid-template-columns:${cols}">`;
                q.options.forEach((opt, i) => {
                    const letter = q.question_type === 'true_false' ? (i === 0 ? 'T' : 'F') : letters[i];
                    const correct = opt.is_correct ? ' correct' : '';
                    optionsHtml += `<div class="q-option${correct}"><span class="letter">${letter}</span> ${esc(opt.option_text)}</div>`;
                });
                optionsHtml += '</div>';
            } else if (q.option_a) {
                // Fallback to inline options
                const cols = q.question_type === 'true_false' ? 'auto auto 1fr' : '1fr 1fr';
                optionsHtml = `<div class="q-options" style="grid-template-columns:${cols}">`;
                const opts = [
                    { letter: 'A', text: q.option_a },
                    { letter: 'B', text: q.option_b },
                    { letter: 'C', text: q.option_c },
                    { letter: 'D', text: q.option_d }
                ].filter(o => o.text);

                opts.forEach(o => {
                    const correct = q.correct_answer && o.text === q.correct_answer ? ' correct' : '';
                    optionsHtml += `<div class="q-option${correct}"><span class="letter">${o.letter}</span> ${esc(o.text)}</div>`;
                });
                optionsHtml += '</div>';
            }

            // Meta info
            let metaParts = [`<span class="q-badge ${typeClass}">${esc(typeLabel)}</span>`];
            if (q.topic) {
                metaParts.push(`<span class="q-meta-dot">·</span><span class="q-meta-text">${esc(q.topic)}</span>`);
            }
            if (q.difficulty) {
                metaParts.push(`<span class="q-meta-dot">·</span><span class="q-meta-text">${esc(q.difficulty)}</span>`);
            }

            return `
            <div class="q-card" data-id="${q.id}" style="animation-delay:${Math.min(idx * 0.02, 0.2)}s">
                <input type="checkbox" class="checkbox" data-id="${q.id}" onchange="onQuestionCheck(this)">
                <div class="q-body">
                    <div class="q-text">${esc(q.question_text)}</div>
                    <div class="q-meta">${metaParts.join('')}</div>
                    ${optionsHtml}
                </div>
                <div class="q-actions">
                    <button class="q-action-btn" title="Edit" onclick="editQuestion(${q.id})">
                        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.5 1.5l2 2L5 10H3V8z"/></svg>
                    </button>
                    <button class="q-action-btn" title="Add to Quiz" onclick="addQuestionToQuiz(${q.id})">
                        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6.5h7M6.5 3v7"/></svg>
                    </button>
                    <button class="q-action-btn danger" title="Delete" onclick="deleteQuestion(${q.id})">
                        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3.5h9M4.5 3.5V2.5h4v1M3.5 3.5v7a1 1 0 001 1h4a1 1 0 001-1v-7"/></svg>
                    </button>
                </div>
            </div>`;
        }).join('');
    }

    // ═════════════════════════════════════════════════════
    // QUESTION ACTIONS
    // ═════════════════════════════════════════════════════

    window.onQuestionCheck = function (cb) {
        cb.closest('.q-card').classList.toggle('selected', cb.checked);
        const count = document.querySelectorAll('.q-card .checkbox:checked').length;
        selCount.textContent = count;
        selGroup.classList.toggle('hidden', count === 0);
    };

    window.clearSelection = function () {
        document.querySelectorAll('.q-card .checkbox').forEach(cb => {
            cb.checked = false;
            cb.closest('.q-card').classList.remove('selected');
        });
        selCount.textContent = '0';
        selGroup.classList.add('hidden');
    };

    window.deleteQuestion = async function (id) {
        if (!confirm('Delete this question? This cannot be undone.')) return;

        try {
            await apiRequest(`/questions/${id}`, { method: 'DELETE' });
            questions = questions.filter(q => q.id !== id);
            renderQuestions();
            updateBreadcrumb();
        } catch (err) {
            console.error('Failed to delete question:', err);
            alert('Failed to delete question.');
        }
    };

    window.editQuestion = function (id) {
        // TODO: Open edit modal or navigate to question editor
        alert('Edit functionality coming soon — question ID: ' + id);
    };

    window.addQuestionToQuiz = function (id) {
        // TODO: Open quiz picker modal
        alert('Add to quiz functionality coming soon — question ID: ' + id);
    };

    window.addSelectedToQuiz = function () {
        const selectedIds = Array.from(document.querySelectorAll('.q-card .checkbox:checked'))
            .map(cb => cb.dataset.id);
        // TODO: Open quiz picker modal with selected IDs
        alert('Add ' + selectedIds.length + ' questions to quiz — coming soon');
    };

    // ═════════════════════════════════════════════════════
    // HELPERS
    // ═════════════════════════════════════════════════════

    function esc(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

})();