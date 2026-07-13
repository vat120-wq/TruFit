(() => {
  'use strict';

  const LEGACY_KEY='trufit-custom-meals-v1';
  const BUILTIN=[['Egg','1 large',72,6,0,5],['Chicken breast','4 oz cooked',187,35,0,4],['Ground beef','4 oz cooked',230,28,0,12],['Salmon','4 oz cooked',233,25,0,14],['White rice','1 cup cooked',205,4,45,0],['Pasta','1 cup cooked',221,8,43,1],['Oats','1/2 cup dry',150,5,27,3],['Bread','1 slice',80,3,15,1],['Flour tortilla','1 medium',140,4,24,4],['Potato','1 medium',161,4,37,0],['Black beans','1/2 cup',114,8,20,1],['Greek yogurt','1 cup',130,23,9,0],['Cheddar cheese','1 oz',114,7,0,9],['Protein powder','1 scoop',120,24,3,2],['Milk','1 cup',122,8,12,5],['Olive oil','1 tbsp',119,0,0,14],['Butter','1 tbsp',102,0,0,12],['Peanut butter','1 tbsp',94,4,4,8],['Avocado','1/2 medium',120,2,6,11],['Banana','1 medium',105,1,27,0],['Apple','1 medium',95,1,25,0],['Broccoli','1 cup cooked',55,4,11,1],['Mixed vegetables','1 cup',80,4,16,1],['Salsa','1/4 cup',20,1,4,0]].map(([name,unit,calories,protein,carbs,fat])=>({name,unit,calories,protein,carbs,fat,builtin:true}));
  const $=(s,r=document)=>r.querySelector(s);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const round=n=>Math.round((+n||0)*10)/10;

  let draft=[];
  let recipes=[];
  let customIngredients=[];
  let client=null;
  let user=null;
  let editingId=null;

  const allIngredients=()=>[...customIngredients,...BUILTIN];
  const total=()=>draft.reduce((t,x)=>({calories:t.calories+x.calories*x.qty,protein:t.protein+x.protein*x.qty,carbs:t.carbs+x.carbs*x.qty,fat:t.fat+x.fat*x.qty}),{calories:0,protein:0,carbs:0,fat:0});
  const status=message=>{const el=$('#mealCloudStatus');if(el)el.textContent=message};

  async function getClient(){
    if(client)return client;
    const cfg=window.TRUFIT_CLOUD;
    if(!cfg?.url||!cfg?.publishableKey)throw new Error('Cloud sync is not configured.');
    if(!window.supabase?.createClient){
      await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=resolve;s.onerror=()=>reject(new Error('Could not load cloud library.'));document.head.appendChild(s)});
    }
    client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    const {data}=await client.auth.getSession();
    user=data.session?.user||null;
    client.auth.onAuthStateChange((_event,session)=>{user=session?.user||null;if(user)refreshCloud();else{recipes=[];customIngredients=[];renderSaved();renderSearch($('#ingredientSearch')?.value||'');status('Sign in to sync recipes')}});
    return client;
  }

  async function refreshCloud(){
    try{
      await getClient();
      if(!user){status('Sign in to sync recipes');renderSaved();return}
      status('Syncing recipes…');
      const [recipeResult,ingredientResult]=await Promise.all([
        client.from('trufit_recipes').select('*').order('updated_at',{ascending:false}),
        client.from('trufit_ingredients').select('*').order('name')
      ]);
      if(recipeResult.error)throw recipeResult.error;
      if(ingredientResult.error)throw ingredientResult.error;
      recipes=(recipeResult.data||[]).map(row=>({...row,ingredients:Array.isArray(row.ingredients)?row.ingredients:[]}));
      customIngredients=(ingredientResult.data||[]).map(row=>({...row,builtin:false}));
      await migrateLegacy();
      renderSaved();
      renderSearch($('#ingredientSearch')?.value||'');
      status(`Cloud synced · ${recipes.length} saved meal${recipes.length===1?'':'s'}`);
    }catch(err){
      console.warn(err);
      status(err.message?.includes('relation')?'Run the latest Supabase schema to enable cloud recipes.':'Recipe sync unavailable');
      renderSaved();
    }
  }

  async function migrateLegacy(){
    if(!user)return;
    let legacy=[];
    try{legacy=JSON.parse(localStorage.getItem(LEGACY_KEY)||'[]')}catch{}
    if(!legacy.length)return;
    const rows=legacy.map(m=>({user_id:user.id,name:m.name||'Custom meal',meal:m.meal||'Dinner',servings:+m.servings||1,calories:+m.calories||0,protein:+m.protein||0,carbs:+m.carbs||0,fat:+m.fat||0,ingredients:m.ingredients||[],updated_at:new Date().toISOString()}));
    const {error}=await client.from('trufit_recipes').upsert(rows,{onConflict:'user_id,name'});
    if(!error){localStorage.removeItem(LEGACY_KEY);const {data}=await client.from('trufit_recipes').select('*').order('updated_at',{ascending:false});recipes=data||[]}
  }

  function render(){
    const list=$('#mealIngredientList');if(!list)return;
    list.innerHTML=draft.map((x,i)=>`<div class="meal-ingredient-row"><div><strong>${esc(x.name)}</strong><small>${esc(x.unit)} · ${round(x.calories*x.qty)} kcal</small></div><input data-q="${i}" type="number" min=".1" step=".1" value="${x.qty}"><button data-r="${i}" type="button">×</button></div>`).join('')||'<p class="builder-empty">Add ingredients to calculate the meal.</p>';
    const servings=Math.max(1,+$('#mealServings').value||1),t=total();
    $('#mealTotalCalories').textContent=Math.round(t.calories/servings);
    $('#mealTotalProtein').textContent=round(t.protein/servings);
    $('#mealTotalCarbs').textContent=round(t.carbs/servings);
    $('#mealTotalFat').textContent=round(t.fat/servings);
  }

  function renderSearch(q=''){
    const el=$('#ingredientResults');if(!el)return;
    const db=allIngredients(),needle=q.toLowerCase();
    el.innerHTML=db.filter(x=>x.name.toLowerCase().includes(needle)).slice(0,16).map((x,i)=>{const index=db.indexOf(x);return`<button type="button" data-add="${index}"><span><strong>${esc(x.name)}</strong><small>${esc(x.unit)}${x.builtin?'':' · saved'}</small></span><span>${round(x.calories)} kcal · ${round(x.protein)}g P</span></button>`}).join('')||'<p class="builder-empty">No matching ingredients.</p>';
  }

  function renderSaved(){
    const el=$('#savedMealList');if(!el)return;
    if(!user){el.innerHTML='<p class="builder-empty">Sign in under Settings to access cloud-synced meals.</p>';return}
    el.innerHTML=recipes.map(m=>`<div class="saved-meal-card"><div><strong>${esc(m.name)}</strong><small>${round(m.calories)} kcal · ${round(m.protein)}g P · ${round(m.carbs)}g C · ${round(m.fat)}g F</small></div><div><button data-edit="${m.id}" type="button">Edit</button><button data-log="${m.id}" type="button">Log</button><button data-del="${m.id}" type="button">×</button></div></div>`).join('')||'<p class="builder-empty">No saved cloud meals yet.</p>';
  }

  function currentMeal(){
    const servings=Math.max(1,+$('#mealServings').value||1),t=total();
    return{name:$('#mealBuilderName').value.trim()||'Custom meal',meal:$('#mealBuilderType').value,servings,calories:round(t.calories/servings),protein:round(t.protein/servings),carbs:round(t.carbs/servings),fat:round(t.fat/servings),ingredients:draft.map(x=>({...x}))};
  }

  function log(m){const f=$('#customFoodForm');if(!f)return;f.elements.foodName.value=m.name;f.elements.calories.value=m.calories;f.elements.protein.value=m.protein;f.elements.carbs.value=m.carbs;f.elements.fat.value=m.fat;f.elements.meal.value=m.meal;f.requestSubmit()}

  async function saveMeal(andLog){
    if(!draft.length)return alert('Add at least one ingredient.');
    try{
      await getClient();
      if(!user)return alert('Sign in under Settings before saving a meal.');
      const m=currentMeal(),row={user_id:user.id,...m,updated_at:new Date().toISOString()};
      status('Saving meal…');
      let result;
      if(editingId)result=await client.from('trufit_recipes').update(row).eq('id',editingId).select().single();
      else result=await client.from('trufit_recipes').upsert(row,{onConflict:'user_id,name'}).select().single();
      if(result.error)throw result.error;
      editingId=result.data.id;
      await refreshCloud();
      status('Meal saved to cloud');
      if(andLog)log(result.data);
    }catch(err){alert(err.message||'Could not save the meal.')}
  }

  async function addCustomIngredient(){
    const name=$('#ciName').value.trim();if(!name)return;
    const item={name,unit:$('#ciUnit').value.trim()||'1 serving',calories:+$('#ciCal').value||0,protein:+$('#ciP').value||0,carbs:+$('#ciC').value||0,fat:+$('#ciF').value||0};
    draft.push({...item,qty:1});render();
    try{
      await getClient();
      if(user){const {error}=await client.from('trufit_ingredients').upsert({user_id:user.id,...item,updated_at:new Date().toISOString()},{onConflict:'user_id,name'});if(error)throw error;await refreshCloud()}
    }catch(err){console.warn('Custom ingredient was added to this recipe but not saved to cloud.',err)}
  }

  function clearBuilder(){editingId=null;draft=[];$('#mealBuilderName').value='';$('#mealServings').value=1;render()}

  function install(){
    const anchor=$('#customFoodBtn');if(!anchor||$('#mealBuilderPanel'))return;
    anchor.insertAdjacentHTML('beforebegin',`<button class="primary-button full" id="mealBuilderToggle" type="button">Build a meal from ingredients</button><section class="meal-builder hidden" id="mealBuilderPanel"><div class="builder-head"><div><p class="eyebrow">CLOUD MEAL BUILDER</p><h3>Build and estimate a meal</h3><small id="mealCloudStatus">Connecting to cloud…</small></div><button id="clearMealBuilder" type="button">Clear</button></div><div class="field-row"><label>Meal name<input id="mealBuilderName" placeholder="Chicken rice bowl"></label><label>Meal<select id="mealBuilderType"><option>Breakfast</option><option>Lunch</option><option selected>Dinner</option><option>Snacks</option></select></label></div><label>Ingredient search<input id="ingredientSearch" placeholder="Chicken, rice, oil..."></label><div id="ingredientResults" class="ingredient-results"></div><details><summary>Add and save a custom ingredient</summary><div class="field-row"><label>Name<input id="ciName"></label><label>Serving<input id="ciUnit" placeholder="1 cup"></label></div><div class="field-row four"><label>Calories<input id="ciCal" type="number"></label><label>Protein<input id="ciP" type="number"></label><label>Carbs<input id="ciC" type="number"></label><label>Fat<input id="ciF" type="number"></label></div><button class="outline-button full" id="ciAdd" type="button">Add ingredient</button></details><div id="mealIngredientList"></div><label>Recipe servings<input id="mealServings" type="number" min="1" value="1"></label><div class="meal-totals"><div><strong id="mealTotalCalories">0</strong><span>kcal</span></div><div><strong id="mealTotalProtein">0</strong><span>protein</span></div><div><strong id="mealTotalCarbs">0</strong><span>carbs</span></div><div><strong id="mealTotalFat">0</strong><span>fat</span></div></div><p class="helper-copy">Estimated values vary by brand, cooking method, and portion size.</p><div class="builder-actions"><button class="outline-button" id="saveMealBtn" type="button">Save meal</button><button class="primary-button" id="saveLogMealBtn" type="button">Save & log</button></div><div class="saved-meals"><p class="eyebrow">CLOUD-SAVED MEALS</p><div id="savedMealList"></div></div></section>`);
    $('#mealBuilderToggle').onclick=()=>{$('#mealBuilderPanel').classList.toggle('hidden');renderSearch();renderSaved();render();refreshCloud()};
    $('#ingredientSearch').oninput=e=>renderSearch(e.target.value);
    $('#ingredientResults').onclick=e=>{const b=e.target.closest('[data-add]');if(b){draft.push({...allIngredients()[+b.dataset.add],qty:1});render()}};
    $('#mealIngredientList').oninput=e=>{if(e.target.dataset.q!==undefined){draft[+e.target.dataset.q].qty=Math.max(.1,+e.target.value||1);render()}};
    $('#mealIngredientList').onclick=e=>{if(e.target.dataset.r!==undefined){draft.splice(+e.target.dataset.r,1);render()}};
    $('#mealServings').oninput=render;
    $('#ciAdd').onclick=addCustomIngredient;
    $('#saveMealBtn').onclick=()=>saveMeal(false);
    $('#saveLogMealBtn').onclick=()=>saveMeal(true);
    $('#clearMealBuilder').onclick=clearBuilder;
    $('#savedMealList').onclick=async e=>{
      const id=e.target.dataset.log||e.target.dataset.edit||e.target.dataset.del;if(!id)return;
      const m=recipes.find(x=>x.id===id);if(!m)return;
      if(e.target.dataset.log)log(m);
      if(e.target.dataset.edit){editingId=m.id;draft=(m.ingredients||[]).map(x=>({...x}));$('#mealBuilderName').value=m.name;$('#mealBuilderType').value=m.meal;$('#mealServings').value=m.servings||1;render()}
      if(e.target.dataset.del&&confirm(`Delete ${m.name}?`)){const {error}=await client.from('trufit_recipes').delete().eq('id',id);if(error)return alert(error.message);if(editingId===id)clearBuilder();await refreshCloud()}
    };
    getClient().then(refreshCloud).catch(err=>status(err.message));
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install):install();
})();
