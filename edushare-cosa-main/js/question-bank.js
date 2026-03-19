/* ===================================================== */
/* EduShare — Question Bank (User-Area) JavaScript       */
/* v2: Multi-select, General chip, side panel ready      */
/* ===================================================== */

(function () {

    let currentSubjectId = null;
    let currentSubjectName = '';
    let currentCourseLabel = '';
    let drillBars = [];
    let questions = [];
    let sublayerTargetLevel = -1;

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

    const TYPE_LABELS = { multiple_choice:'Multiple Choice', true_false:'True / False', short_answer:'Short Answer', essay:'Essay' };
    const GENERAL_PREFIX = 'general-';

    loadSidebar();

    window.toggleProfileMenu = function(){ document.getElementById('profileDropdown').classList.toggle('show'); };
    document.addEventListener('click', (e) => { if(!e.target.closest('.profile-menu')){ const dd=document.getElementById('profileDropdown'); if(dd) dd.classList.remove('show'); }});
    window.logout = function(){ apiRequest('/auth/logout',{method:'POST'}).then(()=>{window.location.href='Login.html';}).catch(()=>{window.location.href='Login.html';}); };

    // === SIDEBAR ===
    async function loadSidebar(){
        const userId=getCurrentUserId()||1;
        try{
            const courses=await apiRequest('/user-courses?userId='+userId);
            if(!courses||courses.length===0){ sidebarCourses.innerHTML='<div class="sidebar-loading">No courses yet.<br><a href="Add-course.html" style="color:var(--orange);font-weight:600;">Add your first course</a></div>'; return; }
            const grouped={};
            courses.forEach(c=>{ const sn=c.subject_name; if(!grouped[sn]) grouped[sn]={subjectId:c.subject_id,courses:[]}; grouped[sn].courses.push(c); });
            let html='';
            for(const[subName,data] of Object.entries(grouped)){
                const subKey=subName.toLowerCase().replace(/\s+/g,'-');
                html+='<div class="subject-item" data-subject-id="'+data.subjectId+'" data-subject-name="'+subName+'" onclick="toggleSidebarSubject(this,\''+subKey+'\')"><span>'+esc(subName)+'</span><span class="arrow">▶</span></div>';
                html+='<div class="course-children" id="children-'+subKey+'">';
                data.courses.forEach(c=>{ const label=c.section?c.course_code+' — '+c.section:c.course_code; html+='<div class="course-item" data-subject-id="'+c.subject_id+'" data-subject-name="'+subName+'" data-label="'+esc(label)+'" onclick="selectSidebarCourse(this)"><span class="dot"></span>'+esc(label)+'</div>'; });
                html+='</div>';
            }
            sidebarCourses.innerHTML=html;
        }catch(err){ console.error('Failed to load sidebar:',err); sidebarCourses.innerHTML='<div class="sidebar-loading">Failed to load courses</div>'; }
    }

    window.toggleSidebarSubject=function(el,key){
        const children=document.getElementById('children-'+key); const isOpen=children.classList.contains('open');
        document.querySelectorAll('.course-children').forEach(c=>c.classList.remove('open'));
        document.querySelectorAll('.subject-item').forEach(s=>s.classList.remove('expanded'));
        if(!isOpen){ children.classList.add('open'); el.classList.add('expanded'); }
    };

    window.selectSidebarCourse=function(el){
        document.querySelectorAll('.course-item').forEach(c=>c.classList.remove('active'));
        document.querySelectorAll('.subject-item').forEach(s=>s.classList.remove('active'));
        el.classList.add('active');
        el.closest('.course-children').previousElementSibling.classList.add('active');
        currentSubjectId=el.dataset.subjectId; currentSubjectName=el.dataset.subjectName; currentCourseLabel=el.dataset.label;
        subjectTitle.textContent=currentSubjectName; courseLabel.textContent=currentCourseLabel;
        drillBars=[]; sublayerTargetLevel=-1; drillBarsContainer.innerHTML=''; hideSublayer();
        loadDrillBar(0,null); loadQuestions();
    };

    // === DRILL-DOWN BARS ===
    async function loadDrillBar(level,parentId){
        if(!currentSubjectId) return;
        try{
            let url='/hierarchy/nodes?subjectId='+currentSubjectId;
            if(parentId) url+='&parentId='+parentId;
            const nodes=await apiRequest(url);
            if(!nodes||nodes.length===0){ if(level>0&&level<=3) showSublayerPrompt(level); return; }
            const label=nodes[0].label||('Level '+(level+1));
            drillBars=drillBars.slice(0,level);
            drillBars.push({ level:level, parentId:parentId, nodes:nodes, selectedIds:[], selectedNames:[], label:label });
            hideSublayer(); appendBarToDOM(drillBars[level]); updateBreadcrumb();
        }catch(err){ console.error('Failed to load drill bar level '+level+':',err); }
    }

    function createBarElement(bar){
        const container=document.createElement('div'); container.className='drill-bar-container'; container.dataset.level=bar.level;
        let chipsHtml='';
        if(bar.parentId&&bar.level>=2){
            const isActive=bar.selectedIds.includes(GENERAL_PREFIX+bar.parentId);
            chipsHtml+='<span class="drill-chip general'+(isActive?' active':'')+'" data-node-id="'+GENERAL_PREFIX+bar.parentId+'" data-node-name="General" data-level="'+bar.level+'" onclick="selectDrillChip(this)">General</span>';
        }
        bar.nodes.forEach(node=>{
            const isActive=bar.selectedIds.includes(node.id);
            chipsHtml+='<span class="drill-chip'+(isActive?' active':'')+'" data-node-id="'+node.id+'" data-node-name="'+esc(node.name)+'" data-level="'+bar.level+'" onclick="selectDrillChip(this)">'+esc(node.name)+'</span>';
        });
        chipsHtml+='<span class="drill-chip add" data-level="'+bar.level+'" onclick="addNodeToBar('+bar.level+')">+ Add</span>';
        container.innerHTML='<div class="drill-bar-inner"><span class="drill-bar-label">'+esc(bar.label)+'</span><div class="drill-scroll-area no-fade-left"><div class="drill-scroll">'+chipsHtml+'</div></div></div>';
        return container;
    }

    function appendBarToDOM(bar){ drillBarsContainer.appendChild(createBarElement(bar)); }

    function removeBarsFromDOM(aboveLevel){
        drillBarsContainer.querySelectorAll('.drill-bar-container').forEach(el=>{ if(parseInt(el.dataset.level)>aboveLevel) el.remove(); });
    }

    window.selectDrillChip=function(el){
        const level=parseInt(el.dataset.level);
        const rawNodeId=el.dataset.nodeId;
        const nodeName=el.dataset.nodeName;
        const bar=drillBars[level];
        const isGeneral=String(rawNodeId).startsWith(GENERAL_PREFIX);
        const nodeId=isGeneral?rawNodeId:parseInt(rawNodeId);
        const idx=bar.selectedIds.indexOf(nodeId);

        if(idx!==-1){
            bar.selectedIds.splice(idx,1); bar.selectedNames.splice(idx,1); el.classList.remove('active');
        }else{
            bar.selectedIds.push(nodeId); bar.selectedNames.push(nodeName); el.classList.add('active');
        }

        drillBars=drillBars.slice(0,level+1); removeBarsFromDOM(level); hideSublayer();

        const realSelected=bar.selectedIds.filter(id=>!String(id).startsWith(GENERAL_PREFIX));
        if(realSelected.length===1&&level<3){ loadDrillBar(level+1,realSelected[0]); }

        loadQuestions(); updateBreadcrumb();
    };

    window.addNodeToBar=async function(level){
        const name=prompt('Enter a name:'); if(!name||!name.trim()) return;
        const bar=drillBars[level]; const parentId=bar.parentId||null;
        try{
            const result=await apiRequest('/hierarchy/nodes',{ method:'POST', body:JSON.stringify({ subjectId:currentSubjectId, parentId:parentId, name:name.trim(), label:bar.label, createdBy:getCurrentUserId()||1 }) });
            if(result.success&&result.node){
                bar.nodes.push(result.node);
                const barEl=drillBarsContainer.querySelector('.drill-bar-container[data-level="'+level+'"]');
                const addBtn=barEl.querySelector('.drill-chip.add');
                const newChip=document.createElement('span');
                newChip.className='drill-chip'; newChip.dataset.nodeId=result.node.id; newChip.dataset.nodeName=result.node.name; newChip.dataset.level=level; newChip.textContent=result.node.name;
                newChip.onclick=function(){ window.selectDrillChip(newChip); };
                addBtn.parentNode.insertBefore(newChip,addBtn);
            }
        }catch(err){ console.error('Failed to add node:',err); alert('Failed to add. Please try again.'); }
    };

    // === SUB-LAYER ===
    function showSublayerPrompt(level){ sublayerTargetLevel=level; sublayerBar.classList.remove('hidden'); sublayerPrompt.classList.remove('hidden'); sublayerFormEl.classList.add('hidden'); }
    function hideSublayer(){ sublayerTargetLevel=-1; sublayerBar.classList.add('hidden'); sublayerFormEl.classList.add('hidden'); sublayerPrompt.classList.remove('hidden'); }
    window.showSublayerForm=function(){ sublayerPrompt.classList.add('hidden'); sublayerFormEl.classList.remove('hidden'); document.getElementById('sublayerName').value=''; document.getElementById('sublayerFirst').value=''; document.getElementById('sublayerName').focus(); };
    window.cancelSublayer=function(){ sublayerFormEl.classList.add('hidden'); sublayerPrompt.classList.remove('hidden'); };

    window.createSublayer=async function(){
        const layerName=document.getElementById('sublayerName').value.trim();
        const firstName=document.getElementById('sublayerFirst').value.trim();
        if(!layerName||!firstName){ alert('Please fill in both fields.'); return; }
        const parentBar=drillBars[sublayerTargetLevel-1];
        if(!parentBar||parentBar.selectedIds.length===0){ alert('No parent selected.'); return; }
        const parentId=parentBar.selectedIds.filter(id=>!String(id).startsWith(GENERAL_PREFIX))[0];
        if(!parentId){ alert('Select a specific item (not General) to add a sub-layer under.'); return; }
        try{
            const result=await apiRequest('/hierarchy/nodes',{ method:'POST', body:JSON.stringify({ subjectId:currentSubjectId, parentId:parentId, name:firstName, label:layerName, createdBy:getCurrentUserId()||1 }) });
            if(result.success){ hideSublayer(); loadDrillBar(sublayerTargetLevel,parentId); }
        }catch(err){ console.error('Failed to create sub-layer:',err); alert('Failed to create. Please try again.'); }
    };

    // === BREADCRUMB ===
    function updateBreadcrumb(){
        if(!currentSubjectName){ breadcrumb.innerHTML='<span class="crumb current">Select a course</span>'; qCount.textContent=''; return; }
        let parts=['<span class="crumb" onclick="resetDrill()">'+esc(currentSubjectName)+'</span>'];
        drillBars.forEach((bar,idx)=>{
            if(bar.selectedIds.length===0) return;
            const isLast=idx===drillBars.length-1||!drillBars[idx+1]||drillBars[idx+1].selectedIds.length===0;
            const displayName=bar.selectedNames.length===1?bar.selectedNames[0]:bar.selectedNames.join(', ');
            parts.push('<span class="sep">›</span>');
            parts.push(isLast?'<span class="crumb current">'+esc(displayName)+'</span>':'<span class="crumb" onclick="resetToLevel('+idx+')">'+esc(displayName)+'</span>');
        });
        const count=questions.length;
        breadcrumb.innerHTML=parts.join('');
        qCount.textContent=count+' question'+(count!==1?'s':'');
    }

    window.resetDrill=function(){
        const firstBarEl=drillBarsContainer.querySelector('.drill-bar-container[data-level="0"]');
        if(firstBarEl) firstBarEl.querySelectorAll('.drill-chip').forEach(c=>c.classList.remove('active'));
        drillBars.forEach(bar=>{ bar.selectedIds=[]; bar.selectedNames=[]; });
        drillBars=drillBars.slice(0,1); removeBarsFromDOM(0); hideSublayer(); loadQuestions(); updateBreadcrumb();
    };

    window.resetToLevel=function(level){
        for(let i=level+1;i<drillBars.length;i++){ drillBars[i].selectedIds=[]; drillBars[i].selectedNames=[]; }
        drillBars=drillBars.slice(0,level+1); removeBarsFromDOM(level); hideSublayer(); loadQuestions(); updateBreadcrumb();
        const bar=drillBars[level];
        const realSelected=bar.selectedIds.filter(id=>!String(id).startsWith(GENERAL_PREFIX));
        if(realSelected.length===1&&level<3) loadDrillBar(level+1,realSelected[0]);
    };

    // === QUESTIONS ===
    async function loadQuestions(){
        if(!currentSubjectId) return;
        let selectedNodeIds=[]; let exactNodeIds=[];
        for(let i=drillBars.length-1;i>=0;i--){
            if(drillBars[i].selectedIds.length>0){
                drillBars[i].selectedIds.forEach(id=>{
                    if(String(id).startsWith(GENERAL_PREFIX)) exactNodeIds.push(parseInt(String(id).replace(GENERAL_PREFIX,'')));
                    else selectedNodeIds.push(id);
                });
                break;
            }
        }
        questionList.innerHTML='<div class="loading-spinner">Loading questions...</div>';
        try{
            let allQuestions=[];
            if(selectedNodeIds.length===0&&exactNodeIds.length===0){
                allQuestions=await apiRequest('/questions?subjectId='+currentSubjectId);
            }else{
                const promises=selectedNodeIds.map(nodeId=>apiRequest('/questions?subjectId='+currentSubjectId+'&nodeId='+nodeId));
                const exactPromises=exactNodeIds.map(nodeId=>apiRequest('/questions?subjectId='+currentSubjectId+'&nodeIdExact='+nodeId));
                const results=await Promise.all([...promises,...exactPromises]);
                const merged=results.flat();
                const seen=new Set();
                allQuestions=merged.filter(q=>{ if(seen.has(q.id)) return false; seen.add(q.id); return true; });
            }
            questions=Array.isArray(allQuestions)?allQuestions:[];
            renderQuestions(); updateBreadcrumb();
        }catch(err){
            console.error('Failed to load questions:',err); questions=[];
            questionList.innerHTML='<div class="prompt-state"><div class="prompt-icon"><svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="13" cy="13" r="10"/><path d="M9 9h.01M17 9h.01M10 15s1.5 2 3 2 3-2 3-2"/></svg></div><h3>Failed to load questions</h3><p>Check your connection and try again.</p></div>';
        }
    }

    function renderQuestions(){
        if(questions.length===0){
            questionList.innerHTML='<div class="prompt-state"><div class="prompt-icon"><svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="13" cy="13" r="10"/><path d="M9 9h.01M17 9h.01M9 16c1.5 1.5 5.5 1.5 7 0"/></svg></div><h3>No questions here yet</h3><p>Create questions manually or generate them with AI to get started.</p></div>';
            return;
        }
        questionList.innerHTML=questions.map((q,idx)=>{
            const typeLabel=TYPE_LABELS[q.question_type]||q.question_type;
            const typeClass=q.question_type||'multiple_choice';
            let optionsHtml='';
            if(q.options&&q.options.length>0){
                const cols=q.question_type==='true_false'?'auto auto 1fr':'1fr 1fr';
                const letters=['A','B','C','D','E','F','G','H'];
                optionsHtml='<div class="q-options" style="grid-template-columns:'+cols+'">';
                q.options.forEach((opt,i)=>{
                    const letter=q.question_type==='true_false'?(i===0?'T':'F'):letters[i];
                    const correct=opt.is_correct?' correct':'';
                    optionsHtml+='<div class="q-option'+correct+'"><span class="letter">'+letter+'</span> '+esc(opt.option_text)+'</div>';
                });
                optionsHtml+='</div>';
            }else if(q.option_a){
                const cols=q.question_type==='true_false'?'auto auto 1fr':'1fr 1fr';
                optionsHtml='<div class="q-options" style="grid-template-columns:'+cols+'">';
                [{letter:'A',text:q.option_a},{letter:'B',text:q.option_b},{letter:'C',text:q.option_c},{letter:'D',text:q.option_d}].filter(o=>o.text).forEach(o=>{
                    const correct=q.correct_answer&&o.text===q.correct_answer?' correct':'';
                    optionsHtml+='<div class="q-option'+correct+'"><span class="letter">'+o.letter+'</span> '+esc(o.text)+'</div>';
                });
                optionsHtml+='</div>';
            }
            let metaParts=['<span class="q-badge '+typeClass+'">'+esc(typeLabel)+'</span>'];
            if(q.topic) metaParts.push('<span class="q-meta-dot">·</span><span class="q-meta-text">'+esc(q.topic)+'</span>');
            if(q.difficulty) metaParts.push('<span class="q-meta-dot">·</span><span class="q-meta-text">'+esc(q.difficulty)+'</span>');
            return '<div class="q-card" data-id="'+q.id+'" style="animation-delay:'+Math.min(idx*0.02,0.2)+'s"><input type="checkbox" class="checkbox" data-id="'+q.id+'" onchange="onQuestionCheck(this)"><div class="q-body"><div class="q-text">'+esc(q.question_text)+'</div><div class="q-meta">'+metaParts.join('')+'</div>'+optionsHtml+'</div><div class="q-actions"><button class="q-action-btn" title="Edit" onclick="editQuestion('+q.id+')"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.5 1.5l2 2L5 10H3V8z"/></svg></button><button class="q-action-btn" title="Add to Quiz" onclick="addQuestionToQuiz('+q.id+')"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6.5h7M6.5 3v7"/></svg></button><button class="q-action-btn danger" title="Delete" onclick="deleteQuestion('+q.id+')"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3.5h9M4.5 3.5V2.5h4v1M3.5 3.5v7a1 1 0 001 1h4a1 1 0 001-1v-7"/></svg></button></div></div>';
        }).join('');
    }

    // === QUESTION ACTIONS ===
    window.onQuestionCheck=function(cb){ cb.closest('.q-card').classList.toggle('selected',cb.checked); const count=document.querySelectorAll('.q-card .checkbox:checked').length; selCount.textContent=count; selGroup.classList.toggle('hidden',count===0); };
    window.clearSelection=function(){ document.querySelectorAll('.q-card .checkbox').forEach(cb=>{cb.checked=false;cb.closest('.q-card').classList.remove('selected');}); selCount.textContent='0'; selGroup.classList.add('hidden'); };
    window.deleteQuestion=async function(id){ if(!confirm('Delete this question? This cannot be undone.')) return; try{ await apiRequest('/questions/'+id,{method:'DELETE'}); questions=questions.filter(q=>q.id!==id); renderQuestions(); updateBreadcrumb(); }catch(err){ console.error('Failed to delete:',err); alert('Failed to delete question.'); }};

    // === EDIT QUESTION MODAL ===
    window.editQuestion=function(id){
        const q=questions.find(x=>x.id===id); if(!q) return;
        document.getElementById('editQId').value=q.id;
        document.getElementById('editQText').value=q.question_text||'';
        document.getElementById('editQType').value=q.question_type||'multiple_choice';
        document.getElementById('editQDifficulty').value=q.difficulty||'medium';
        buildEditOptions(q); editTypeChanged();
        document.getElementById('editQuestionOverlay').classList.remove('hidden');
        document.getElementById('editQText').focus();
    };

    function buildEditOptions(q){
        const list=document.getElementById('editOptionsList'); list.innerHTML='';
        let opts=[];
        if(q.options&&q.options.length>0){ opts=q.options.map(o=>({text:o.option_text||o.text||'',correct:o.is_correct||o.correct||false})); }
        else if(q.option_a){ ['option_a','option_b','option_c','option_d'].forEach(key=>{ if(q[key]) opts.push({text:q[key],correct:q.correct_answer===q[key]}); }); }
        if(opts.length===0&&(q.question_type==='multiple_choice'||q.question_type==='true_false')){
            if(q.question_type==='true_false') opts=[{text:'True',correct:true},{text:'False',correct:false}];
            else opts=[{text:'',correct:true},{text:'',correct:false},{text:'',correct:false},{text:'',correct:false}];
        }
        opts.forEach((opt,i)=>addEditOptionRow(opt.text,opt.correct,i));
    }

    function addEditOptionRow(text,correct,index){
        const list=document.getElementById('editOptionsList');
        const row=document.createElement('div'); row.className='edit-option-row';
        row.innerHTML='<input type="text" value="'+esc(text||'')+'" placeholder="Option text..." class="edit-opt-text"><label class="correct-radio"><input type="radio" name="editCorrect" '+(correct?'checked':'')+'>Correct</label><button type="button" class="remove-option" onclick="this.closest(\'.edit-option-row\').remove()" title="Remove">&times;</button>';
        list.appendChild(row);
    }

    window.addEditOption=function(){ addEditOptionRow('',false,document.querySelectorAll('.edit-option-row').length); };

    window.editTypeChanged=function(){
        const type=document.getElementById('editQType').value;
        const section=document.getElementById('editOptionsSection');
        const addBtn=document.getElementById('editAddOptionBtn');
        if(type==='short_answer'||type==='essay'){ section.classList.add('hidden'); }
        else{
            section.classList.remove('hidden'); addBtn.style.display=type==='true_false'?'none':'';
            if(type==='true_false'){ const list=document.getElementById('editOptionsList'); const rows=list.querySelectorAll('.edit-option-row'); if(rows.length!==2||!rows[0].querySelector('.edit-opt-text').value.match(/^true$/i)){ list.innerHTML=''; addEditOptionRow('True',true,0); addEditOptionRow('False',false,1); }}
        }
    };

    window.saveEditedQuestion=async function(e){
        e.preventDefault();
        const id=document.getElementById('editQId').value;
        const questionText=document.getElementById('editQText').value.trim();
        const questionType=document.getElementById('editQType').value;
        const difficulty=document.getElementById('editQDifficulty').value;
        if(!questionText){alert('Question text is required.');return;}
        const btn=document.getElementById('editSaveBtn'); btn.disabled=true; btn.textContent='Saving...';
        const optionRows=document.querySelectorAll('#editOptionsList .edit-option-row');
        const options=[];
        optionRows.forEach(row=>{ const text=row.querySelector('.edit-opt-text').value.trim(); const isCorrect=row.querySelector('input[type="radio"]').checked; if(text) options.push({text,isCorrect}); });
        const body={questionText,questionType,difficulty,options:options.length>0?options:undefined};
        if(options.length>=1) body.optionA=options[0]?.text||null;
        if(options.length>=2) body.optionB=options[1]?.text||null;
        if(options.length>=3) body.optionC=options[2]?.text||null;
        if(options.length>=4) body.optionD=options[3]?.text||null;
        const correctOpt=options.find(o=>o.isCorrect); body.correctAnswer=correctOpt?correctOpt.text:null;
        try{
            await apiRequest('/questions/'+id,{method:'PUT',body:JSON.stringify(body)});
            const q=questions.find(x=>x.id===parseInt(id));
            if(q){ q.question_text=questionText; q.question_type=questionType; q.difficulty=difficulty; q.option_a=body.optionA||null; q.option_b=body.optionB||null; q.option_c=body.optionC||null; q.option_d=body.optionD||null; q.correct_answer=body.correctAnswer; if(options.length>0) q.options=options.map((o,i)=>({option_text:o.text,is_correct:o.isCorrect?1:0,sort_order:i})); }
            closeEditQuestion(); renderQuestions(); showToast('Question updated!');
        }catch(err){ console.error('Failed to update:',err); alert('Failed to save. Please try again.'); }
        finally{ btn.disabled=false; btn.textContent='Save Changes'; }
    };

    window.closeEditQuestion=function(event){ if(event&&event.target!==event.currentTarget) return; document.getElementById('editQuestionOverlay').classList.add('hidden'); };

    // === QUIZ PICKER MODAL ===
    let pendingQuestionIds=[];
    window.addQuestionToQuiz=function(id){ pendingQuestionIds=[id]; openQuizPicker(); };
    window.addSelectedToQuiz=function(){ pendingQuestionIds=Array.from(document.querySelectorAll('.q-card .checkbox:checked')).map(cb=>parseInt(cb.dataset.id)); if(pendingQuestionIds.length===0) return; openQuizPicker(); };

    async function openQuizPicker(){
        const overlay=document.getElementById('quizPickerOverlay'); const list=document.getElementById('quizPickerList');
        const loading=document.getElementById('quizPickerLoading'); const empty=document.getElementById('quizPickerEmpty');
        const title=document.getElementById('quizPickerTitle');
        title.textContent=pendingQuestionIds.length===1?'Add Question to Quiz':'Add '+pendingQuestionIds.length+' Questions to Quiz';
        overlay.classList.remove('hidden'); loading.classList.remove('hidden'); list.innerHTML=''; empty.classList.add('hidden');
        try{
            const userId=getCurrentUserId()||1;
            const quizzes=await apiRequest('/quizzes?userId='+userId);
            loading.classList.add('hidden');
            if(!quizzes||quizzes.length===0){ empty.classList.remove('hidden'); return; }
            list.innerHTML=quizzes.map(q=>'<div class="quiz-pick-item" data-quiz-id="'+q.id+'"><div class="quiz-pick-info"><h3>'+esc(q.title)+'</h3><span class="quiz-pick-meta">'+(q.question_count||0)+' questions · '+(q.subject_name||'No subject')+'</span></div><button class="quiz-pick-btn" onclick="addToThisQuiz('+q.id+',this)">Add</button></div>').join('');
        }catch(err){ console.error('Failed to load quizzes:',err); loading.classList.add('hidden'); list.innerHTML='<div class="modal-loading">Failed to load quizzes.</div>'; }
    }

    window.addToThisQuiz=async function(quizId,btn){
        btn.disabled=true; btn.textContent='Adding...'; let addedCount=0;
        try{
            for(const questionId of pendingQuestionIds){ await apiRequest('/quizzes/'+quizId+'/questions',{method:'POST',body:JSON.stringify({questionId:questionId})}); addedCount++; }
            btn.textContent='Added!'; btn.classList.add('added');
            const item=btn.closest('.quiz-pick-item'); const meta=item.querySelector('.quiz-pick-meta');
            if(meta){ const currentCount=parseInt(meta.textContent)||0; meta.textContent=meta.textContent.replace(/^\d+/,currentCount+addedCount); }
            showToast('Added '+addedCount+' question'+(addedCount!==1?'s':'')+' to quiz!');
            setTimeout(()=>{ clearSelection(); },500);
        }catch(err){ console.error('Failed to add:',err); btn.disabled=false; btn.textContent='Failed'; setTimeout(()=>{btn.textContent='Add';},2000); }
    };

    window.closeQuizPicker=function(event){ if(event&&event.target!==event.currentTarget) return; document.getElementById('quizPickerOverlay').classList.add('hidden'); pendingQuestionIds=[]; };

    // === GLOBAL KEY HANDLERS ===
    document.addEventListener('keydown',(e)=>{
        if(e.key==='Escape'){
            const editO=document.getElementById('editQuestionOverlay'); if(editO&&!editO.classList.contains('hidden')){ closeEditQuestion(); return; }
            const quizO=document.getElementById('quizPickerOverlay'); if(quizO&&!quizO.classList.contains('hidden')){ closeQuizPicker(); return; }
        }
    });

    // === HELPERS ===
    function showToast(message){ const toast=document.getElementById('successToast'); document.getElementById('toastMessage').textContent=message; toast.classList.remove('hidden'); setTimeout(()=>toast.classList.add('hidden'),3000); }
    function esc(str){ const div=document.createElement('div'); div.textContent=str||''; return div.innerHTML; }

    // === CONTEXT HELPER ===
    function getCurrentContext(){
        let deepestNodeId=null; let path=[];
        for(const bar of drillBars){
            const realSelected=bar.selectedIds.filter(id=>!String(id).startsWith(GENERAL_PREFIX));
            if(realSelected.length===1){ deepestNodeId=realSelected[0]; const name=bar.selectedNames[bar.selectedIds.indexOf(realSelected[0])]; path.push(name); }
        }
        return { subjectId:currentSubjectId, subjectName:currentSubjectName, nodeId:deepestNodeId, path:path.join(' > ') };
    }
    window.getQuestionBankContext=getCurrentContext;

})();