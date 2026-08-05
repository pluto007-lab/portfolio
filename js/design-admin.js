(() => {
  'use strict';
  const categories = ['Adobe', 'Canva', 'AI Image Design', 'SNS Design'];
  const $ = (selector) => document.querySelector(selector);
  const refs = {
    loadStatus: $('#load-status'), dirtyStatus: $('#dirty-status'), total: $('#summary-total'), visible: $('#summary-visible'), featured: $('#summary-featured'), changed: $('#summary-changed'),
    file: $('#json-file'), reset: $('#reset-button'), downloadJson: $('#download-json'), downloadFallback: $('#download-fallback'), add: $('#add-button'), remove: $('#delete-button'),
    list: $('#work-list'), note: $('#list-note'), form: $('#work-form'), formErrors: $('#form-errors'), editorMessage: $('#editor-message'), preview: $('#preview-grid'), previewFeatured: $('#preview-featured'),
    search: $('#search-filter'), categoryFilter: $('#category-filter'), tagFilter: $('#tag-filter'), visibleFilter: $('#visible-filter'), featuredFilter: $('#featured-filter'),
    tagInput: $('#tag-input'), toolInput: $('#tool-input'), tagChips: $('#tag-chips'), toolChips: $('#tool-chips'), tagSuggestions: $('#tag-suggestions'), toolSuggestions: $('#tool-suggestions'),
    workflowCurrent: $('#workflow-current'), workflowSteps: [...document.querySelectorAll('[data-workflow-step]')], technicalSrc: $('#technical-src'),
    helpButton: $('#help-button'), helpDialog: $('#help-dialog'), helpClose: $('#help-close'), helpDone: $('#help-done')
  };
  let works = [], baseline = [], selectedId = '', draggedId = '', exportedSnapshot = '', workflowStage = 'loading';
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const sorted = (items) => [...items].sort((a, b) => a.order - b.order);
  const snapshot = (items = works) => JSON.stringify(sorted(items));
  const selected = () => works.find((work) => work.id === selectedId);
  const unique = (items) => [...new Set(items.map((item) => String(item).trim()).filter(Boolean))];
  const toolArray = (tool) => unique(String(tool || '').split(' / '));
  const setStatus = (message, error = false) => { refs.loadStatus.textContent = message; refs.loadStatus.style.color = error ? '#a23f46' : ''; };

  function normalize(raw, index) {
    const work = { id:'', src:'', fileName:'', category:'', title:'', tool:'', usage:'', description:'', tags:[], series:'', visible:true, featured:false, order:index + 1, alt:'' };
    Object.assign(work, raw);
    work.tags = Array.isArray(raw.tags) ? unique(raw.tags) : [];
    work.visible = raw.visible === true;
    work.featured = raw.featured === true;
    work.order = Number(raw.order);
    return work;
  }

  function validate(items) {
    const errors = [];
    if (!Array.isArray(items)) return ['ルートは作品オブジェクトの配列である必要があります。'];
    const ids = new Map();
    items.forEach((work, index) => {
      const label = `項目${index + 1}`;
      if (!work || typeof work !== 'object' || Array.isArray(work)) { errors.push(`${label}: オブジェクトではありません。`); return; }
      ['id','src','fileName','category','title','tool','usage','description','series','alt'].forEach((key) => { if (typeof work[key] !== 'string') errors.push(`${label}: ${key}は文字列である必要があります。`); });
      if (!work.id?.trim()) errors.push(`${label}: idは必須です。`);
      if (!work.src?.trim()) errors.push(`${label}: srcは必須です。`);
      if (!work.fileName?.trim()) errors.push(`${label}: fileNameは必須です。`);
      if (!categories.includes(work.category)) errors.push(`${label}: category「${work.category}」は既存カテゴリではありません。`);
      if (!Array.isArray(work.tags) || work.tags.some((tag) => typeof tag !== 'string' || !tag.trim())) errors.push(`${label}: tagsは空文字を含まない文字列配列にしてください。`);
      if (typeof work.visible !== 'boolean') errors.push(`${label}: visibleは真偽値である必要があります。`);
      if (typeof work.featured !== 'boolean') errors.push(`${label}: featuredは真偽値である必要があります。`);
      if (typeof work.order !== 'number' || !Number.isInteger(work.order) || work.order < 1) errors.push(`${label}: orderは1以上の整数にしてください。`);
      if (work.id) ids.set(work.id, (ids.get(work.id) || 0) + 1);
    });
    ids.forEach((count, id) => { if (count > 1) errors.push(`id「${id}」が${count}件重複しています。`); });
    const featuredWorks = items.filter((work) => work.featured);
    if (featuredWorks.length > 3) errors.push(`代表作品は最大3点です。現在${featuredWorks.length}点選択されています。`);
    featuredWorks.filter((work) => !work.visible).forEach((work) => errors.push(`id「${work.id}」は非公開のため代表作品にできません。`));
    return errors;
  }

  function filtersActive() { return Boolean(refs.search.value || refs.categoryFilter.value || refs.tagFilter.value || refs.visibleFilter.value || refs.featuredFilter.checked); }
  function filteredWorks() {
    const query = refs.search.value.trim().toLowerCase();
    return sorted(works).filter((work) => (!query || `${work.title} ${work.id} ${work.fileName}`.toLowerCase().includes(query)) && (!refs.categoryFilter.value || work.category === refs.categoryFilter.value) && (!refs.tagFilter.value || work.tags.includes(refs.tagFilter.value)) && (!refs.featuredFilter.checked || work.featured) && (!refs.visibleFilter.value || (refs.visibleFilter.value === 'visible' ? work.visible : !work.visible)));
  }

  function updateOrder() { works.forEach((work, index) => { work.order = index + 1; }); }
  function changedCount() {
    const base = new Map(baseline.map((item) => [item.id, JSON.stringify(item)]));
    let count = works.filter((item) => base.get(item.id) !== JSON.stringify(item)).length;
    count += baseline.filter((item) => !works.some((work) => work.id === item.id)).length;
    return count;
  }
  function isDirty() { return snapshot() !== snapshot(baseline); }
  function updateWorkflow() {
    const dirty = isDirty();
    const current = dirty ? 'edit' : workflowStage;
    const labels = { loading:'データを読み込み中', load:'読み込み完了・編集できます', edit:'編集中・JSONの書き出しが必要です', export:'JSON書き出し完了・portfolio/dataへ置き換えてください' };
    refs.workflowCurrent.textContent = `現在：${labels[current] || labels.load}`;
    const order = ['load','edit','export','replace','commit','publish'];
    refs.workflowSteps.forEach((step) => {
      const index = order.indexOf(step.dataset.workflowStep);
      const currentIndex = order.indexOf(current === 'loading' ? 'load' : current);
      step.classList.toggle('is-current', step.dataset.workflowStep === current);
      step.classList.toggle('is-complete', index < currentIndex);
    });
  }
  function updateSummary() {
    const dirty = isDirty();
    refs.total.textContent = works.length; refs.visible.textContent = works.filter(w=>w.visible).length; refs.featured.textContent = works.filter(w=>w.featured).length + ' / 3'; refs.changed.textContent = changedCount();
    refs.dirtyStatus.textContent = dirty ? '⚠ 編集内容はまだDesignページへ反映されていません。\n2つのファイルを書き出し、portfolio/data内のファイルを置き換えてください。' : workflowStage === 'export' ? '✓ ファイルを書き出しました。次はportfolio/data内の同名ファイルを置き換えてください。' : '✓ 読み込み済みです。編集を始められます。';
    refs.dirtyStatus.classList.toggle('is-dirty', dirty); refs.dirtyStatus.classList.toggle('is-exported', !dirty && workflowStage === 'export');
    updateWorkflow();
  }
  function updateOptions() {
    const categoryValue = refs.categoryFilter.value, tagValue = refs.tagFilter.value;
    refs.categoryFilter.replaceChildren(new Option('すべて',''), ...categories.map(v=>new Option(v,v))); refs.categoryFilter.value = categoryValue;
    const tags = unique(works.flatMap(w=>w.tags)).sort(); refs.tagFilter.replaceChildren(new Option('すべて',''), ...tags.map(v=>new Option(v,v))); refs.tagFilter.value = tagValue;
    refs.tagSuggestions.replaceChildren(...tags.map(v=>new Option(v)));
    refs.toolSuggestions.replaceChildren(...unique(works.flatMap(w=>toolArray(w.tool))).sort().map(v=>new Option(v)));
    const formCategory = refs.form.elements.category; if (!formCategory.options.length) formCategory.replaceChildren(...categories.map(v=>new Option(v,v)));
  }
  function badge(text) { const span=document.createElement('span'); span.textContent=text; return span; }
  function renderList() {
    const items=filteredWorks(), filtered=filtersActive(); refs.list.replaceChildren(); refs.note.textContent=filtered?'絞り込み中はドラッグを無効化しています。上下ボタンは全体順を変更します。':'全体順で表示しています。ドラッグまたは上下ボタンで並べ替えできます。';
    items.forEach((work) => {
      const item=document.createElement('article'); item.className='admin-work-item'; item.tabIndex=0; item.dataset.id=work.id; item.draggable=!filtered; item.classList.toggle('is-selected',work.id===selectedId); item.classList.toggle('is-hidden',!work.visible);
      const img=document.createElement('img'); img.className='admin-thumb'; img.src=work.src; img.alt='';
      const copy=document.createElement('div'); copy.className='admin-item-copy'; const title=document.createElement('strong'); title.textContent=work.title||work.fileName||'タイトル未設定'; const meta=document.createElement('small'); meta.textContent=`#${work.order} / ${work.category}`; const badges=document.createElement('div'); badges.className='admin-badges'; if(work.featured)badges.append(badge('featured')); if(!work.visible)badges.append(badge('非表示')); work.tags.slice(0,3).forEach(tag=>badges.append(badge(tag))); copy.append(title,meta,badges);
      const actions=document.createElement('div'); actions.className='admin-order-actions'; const up=document.createElement('button');up.type='button';up.textContent='↑';up.setAttribute('aria-label',`${title.textContent}を上へ`);up.dataset.move='up';const down=document.createElement('button');down.type='button';down.textContent='↓';down.setAttribute('aria-label',`${title.textContent}を下へ`);down.dataset.move='down';actions.append(up,down);item.append(img,copy,actions);refs.list.append(item);
    });
  }
  function chip(container,text,type){const span=document.createElement('span');span.className='admin-chip';span.append(document.createTextNode(text));const button=document.createElement('button');button.type='button';button.textContent='×';button.setAttribute('aria-label',`${text}を削除`);button.dataset.removeChip=type;button.dataset.value=text;span.append(button);container.append(span);}
  function renderEditor(){const work=selected();if(!work){refs.form.hidden=true;refs.remove.disabled=true;refs.editorMessage.textContent='一覧から作品を選択してください。';return;}refs.form.hidden=false;refs.remove.disabled=false;refs.editorMessage.textContent=work.title||work.fileName||work.id;['id','src','fileName','category','title','usage','description','series','order','alt'].forEach(name=>{refs.form.elements[name].value=work[name]??'';});refs.form.elements.featured.checked=work.featured;refs.form.elements.visible.checked=work.visible;refs.technicalSrc.textContent=work.src||'未設定';refs.tagChips.replaceChildren();work.tags.forEach(v=>chip(refs.tagChips,v,'tag'));refs.toolChips.replaceChildren();toolArray(work.tool).forEach(v=>chip(refs.toolChips,v,'tool'));renderFormErrors();}
  function renderFormErrors(){const work=selected();if(!work)return;const errors=[];if(!work.id.trim())errors.push('IDを入力してください。');if(works.filter(w=>w.id===work.id).length>1)errors.push('IDが重複しています。');if(!work.src.trim())errors.push('画像パスを入力してください。');if(!work.fileName.trim())errors.push('ファイル名を入力してください。');if(!categories.includes(work.category))errors.push('既存カテゴリを選択してください。');refs.formErrors.hidden=!errors.length;refs.formErrors.textContent=errors.join(' ');}
  function createPreviewCard(work) {
    const card=document.createElement('article');card.className='admin-preview-card';
    const img=document.createElement('img');img.src=work.src;img.alt=work.alt||'';
    const copy=document.createElement('div');const strong=document.createElement('strong');strong.textContent=work.title||work.fileName;
    const small=document.createElement('small');small.textContent=`#${work.order}${work.featured?' / featured':''}`;
    copy.append(strong,small);card.append(img,copy);return card;
  }
  function appendPreviewSection(title, items, className='') {
    const section=document.createElement('section');section.className=`admin-preview-category ${className}`.trim();
    const h=document.createElement('h3');h.textContent=`${title}（${items.length}点）`;
    const grid=document.createElement('div');grid.className='admin-preview-grid';items.forEach(work=>grid.append(createPreviewCard(work)));
    section.append(h,grid);refs.preview.append(section);
  }
  function renderPreview(){
    refs.preview.replaceChildren();
    const visible=sorted(works).filter(work=>work.visible);
    const featured=visible.filter(work=>work.featured).slice(0,3);
    const featuredIds=new Set(featured.map(work=>work.id));
    const others=visible.filter(work=>!featuredIds.has(work.id));
    appendPreviewSection('代表作品',featured,'admin-preview-featured');
    categories.forEach(category=>appendPreviewSection(`その他 / ${category}`,others.filter(work=>work.category===category)));
  }
  function renderAll(){updateOptions();renderList();renderEditor();renderPreview();updateSummary();}
  function selectWork(id){selectedId=id;renderList();renderEditor();}
  function commitLoaded(data,message){works=sorted(data.map(normalize));updateOrder();baseline=clone(works);exportedSnapshot=snapshot();workflowStage='load';selectedId=works[0]?.id||'';renderAll();setStatus(`${message} ${works.length}件を読み込みました。`);}
  function moveWork(id,direction){const index=works.findIndex(w=>w.id===id),next=index+(direction==='up'?-1:1);if(index<0||next<0||next>=works.length)return;[works[index],works[next]]=[works[next],works[index]];updateOrder();renderAll();}
  function download(name,text,type='application/json'){const blob=new Blob([text],{type:`${type};charset=utf-8`}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),0);}
  function exportData(fallback=false){updateOrder();const errors=validate(works);if(errors.length){refs.formErrors.hidden=false;refs.formErrors.textContent=`書き出せません。${errors.join(' ')}`;setStatus(`検証エラー ${errors.length}件。書き出しを中止しました。`,true);return;}const json=JSON.stringify(sorted(works),null,2);if(fallback)download('design-works-fallback.js',`// Generated from data/design-works.json for file:// preview. JSON remains the source of truth.\nwindow.DESIGN_WORKS_FALLBACK = ${json};\n`,'text/javascript');else download('design-works.json',`${json}\n`);if(!fallback){baseline=clone(works);exportedSnapshot=snapshot();workflowStage='export';}renderAll();setStatus(`${fallback?'フォールバック':'JSON'}を書き出しました。${works.length}件・代表作${works.filter(w=>w.featured).length}件。`);}

  refs.helpButton.addEventListener('click', () => refs.helpDialog.showModal());
  refs.helpClose.addEventListener('click', () => refs.helpDialog.close());
  refs.helpDone.addEventListener('click', () => refs.helpDialog.close());
  refs.helpDialog.addEventListener('click', (event) => { if (event.target === refs.helpDialog) refs.helpDialog.close(); });
  refs.list.addEventListener('click',e=>{const item=e.target.closest('.admin-work-item');if(!item)return;if(e.target.dataset.move){e.stopPropagation();moveWork(item.dataset.id,e.target.dataset.move);return;}selectWork(item.dataset.id);});
  refs.list.addEventListener('keydown',e=>{const item=e.target.closest('.admin-work-item');if(item&&e.target===item&&(e.key==='Enter'||e.key===' ')){e.preventDefault();selectWork(item.dataset.id);}});
  refs.list.addEventListener('dragstart',e=>{const item=e.target.closest('.admin-work-item');if(!item||filtersActive()){e.preventDefault();return;}draggedId=item.dataset.id;e.dataTransfer.effectAllowed='move';});
  refs.list.addEventListener('dragover',e=>{if(draggedId)e.preventDefault();});
  refs.list.addEventListener('drop',e=>{e.preventDefault();const target=e.target.closest('.admin-work-item');if(!target||!draggedId||target.dataset.id===draggedId)return;const from=works.findIndex(w=>w.id===draggedId),to=works.findIndex(w=>w.id===target.dataset.id);const [moved]=works.splice(from,1);works.splice(to,0,moved);draggedId='';updateOrder();renderAll();});
  refs.form.addEventListener('input',e=>{const work=selected();if(!work||!e.target.name)return;const name=e.target.name;if(name==='featured'){if(e.target.checked&&!work.visible){e.target.checked=false;refs.formErrors.hidden=false;refs.formErrors.textContent='代表作品にするには、先に「Designページに公開する」をONにしてください。';setStatus('代表作品の変更を受け付けませんでした。公開設定を確認してください。',true);return;}else if(e.target.checked&&works.filter(item=>item.featured&&item!==work).length>=3){e.target.checked=false;refs.formErrors.hidden=false;refs.formErrors.textContent='代表作品は最大3点です。別の代表作品をOFFにしてから選択してください。';setStatus('代表作品は最大3点までです。4点目の変更を受け付けませんでした。',true);return;}else{work.featured=e.target.checked;}}else if(name==='visible'){work.visible=e.target.checked;if(!work.visible){work.featured=false;refs.form.elements.featured.checked=false;}}else if(name==='order'){const desired=Math.max(1,Math.min(works.length,Number(e.target.value)||1));const current=works.indexOf(work);works.splice(current,1);works.splice(desired-1,0,work);updateOrder();}else{work[name]=e.target.value;if(name==='src'&&!work.fileName)work.fileName=e.target.value.split('/').pop()||'';if(name==='id')selectedId=work.id;if(name==='src')refs.technicalSrc.textContent=work.src||'未設定';}renderList();renderPreview();updateSummary();renderFormErrors();});
  function addChip(type,value){const work=selected(),clean=value.trim();if(!work||!clean)return;if(type==='tag'){if(!work.tags.includes(clean))work.tags.push(clean);refs.tagInput.value='';}else{const tools=toolArray(work.tool);if(!tools.includes(clean))tools.push(clean);work.tool=tools.join(' / ');refs.toolInput.value='';}renderAll();}
  [refs.tagInput,refs.toolInput].forEach((input,index)=>input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addChip(index?'tool':'tag',input.value);}}));
  refs.form.addEventListener('click',e=>{const type=e.target.dataset.removeChip;if(!type)return;const work=selected(),value=e.target.dataset.value;if(type==='tag')work.tags=work.tags.filter(v=>v!==value);else work.tool=toolArray(work.tool).filter(v=>v!==value).join(' / ');renderAll();});
  refs.add.addEventListener('click',()=>{let n=1,id='new-design-work';while(works.some(w=>w.id===id))id=`new-design-work-${++n}`;const work=normalize({id,category:categories[0],order:works.length+1,visible:true},works.length);works.push(work);selectedId=id;renderAll();refs.form.elements.title.focus();});
  refs.remove.addEventListener('click',()=>{const work=selected();if(!work)return;const name=work.title||work.fileName||work.id;if(!window.confirm(`「${name}」を削除しますか？`))return;works=works.filter(w=>w!==work);updateOrder();selectedId=works[0]?.id||'';renderAll();});
  [refs.search,refs.categoryFilter,refs.tagFilter,refs.visibleFilter,refs.featuredFilter].forEach(control=>control.addEventListener('input',renderList));
  refs.reset.addEventListener('click',()=>{if(isDirty()&&!window.confirm('未書き出しの変更を破棄して、最後に読み込んだ状態へ戻しますか？'))return;works=clone(baseline);selectedId=works[0]?.id||'';renderAll();setStatus('最後に読み込んだ状態へ戻しました。');});
  refs.downloadJson.addEventListener('click',()=>exportData(false));refs.downloadFallback.addEventListener('click',()=>exportData(true));
  refs.file.addEventListener('change',async()=>{const file=refs.file.files[0];if(!file)return;if(isDirty()&&!window.confirm('未書き出しの変更があります。別のJSONを読み込みますか？')){refs.file.value='';return;}try{const parsed=JSON.parse(await file.text());const errors=validate(parsed);if(errors.length)throw new Error(errors.join('\n'));commitLoaded(parsed,`${file.name}から`);}catch(error){setStatus(`読み込み失敗: ${error.message}`,true);}finally{refs.file.value='';}});
  window.addEventListener('beforeunload',e=>{if(!isDirty())return;e.preventDefault();e.returnValue='';});

  async function init(){categories.forEach(v=>refs.form.elements.category.append(new Option(v,v)));try{let data;if(location.protocol==='file:'){data=window.DESIGN_WORKS_FALLBACK;if(!Array.isArray(data))throw new Error('file://用フォールバックがありません。');}else{const response=await fetch('data/design-works.json');if(!response.ok)throw new Error(`HTTP ${response.status}`);data=await response.json();}const errors=validate(data);if(errors.length)throw new Error(errors.join(' '));commitLoaded(data,location.protocol==='file:'?'フォールバックから':'design-works.jsonから');}catch(error){setStatus(`初期データの読み込みに失敗しました: ${error.message}`,true);renderAll();}}
  init();
})();