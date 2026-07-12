// Public browser configuration. The publishable/anon key is designed to be
// shipped to clients; row-level security in supabase/schema.sql protects data.
window.TRUFIT_CLOUD = {
  url: 'https://mwlzvdeyapjvvsvldlnu.supabase.co',
  publishableKey: 'sb_publishable_We0sFWpMBnSQb3PP5RlLsg_TqQSeA_H'
};

(() => {
  'use strict';

  const style = document.createElement('style');
  style.textContent = `
    .meal-builder{margin:14px 0 18px;padding:15px;border:1px solid var(--line);border-radius:18px;background:#0a1220}
    .builder-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}.builder-head h3{margin:4px 0 0;font-size:18px}.builder-head>button{border:0;background:transparent;color:var(--orange)}
    .ingredient-results{display:grid;gap:7px;max-height:260px;overflow:auto;margin:8px 0 14px}.ingredient-results button{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;padding:11px;border:1px solid var(--line);border-radius:12px;background:#0c1423;color:var(--ink);text-align:left}.ingredient-results span:first-child{display:flex;flex-direction:column;gap:3px}.ingredient-results small,.meal-ingredient-row small,.saved-meal-card small{color:var(--muted);font-size:10px}
    .meal-ingredient-row,.saved-meal-card{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:9px;padding:10px 0;border-bottom:1px solid var(--line)}.meal-ingredient-row>div,.saved-meal-card>div:first-child{display:flex;flex-direction:column;gap:3px}.meal-ingredient-row input{width:72px;min-height:42px}.meal-ingredient-row button,.saved-meal-card button{border:0;background:#142238;color:var(--ink);border-radius:9px;padding:8px 10px}
    .meal-totals{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:12px 0}.meal-totals div{padding:10px 5px;border:1px solid var(--line);border-radius:12px;background:#0c1423;text-align:center}.meal-totals strong{display:block;font-size:16px;color:var(--green)}.meal-totals span{font-size:8px;color:var(--muted);text-transform:uppercase}
    .builder-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px}.saved-meals{margin-top:18px;padding-top:15px;border-top:1px solid var(--line)}.saved-meal-card{grid-template-columns:minmax(0,1fr) auto}.saved-meal-card>div:last-child{display:flex;gap:5px}.builder-empty{color:var(--muted);font-size:11px;text-align:center;padding:12px}
    .meal-builder details{margin:10px 0 14px;padding:11px;border:1px solid var(--line);border-radius:12px}.meal-builder summary{cursor:pointer;font-size:12px;font-weight:700}.meal-builder textarea{width:100%;font:inherit}
    @media(max-width:420px){.meal-totals{grid-template-columns:repeat(2,1fr)}.builder-actions{grid-template-columns:1fr}.saved-meal-card{grid-template-columns:1fr}.saved-meal-card>div:last-child{justify-content:flex-start}}
  `;
  document.head.appendChild(style);

  document.addEventListener('DOMContentLoaded', () => {
    const numericFields = ['#unlockPin','#unlockPinConfirm','input[name="pin"]','input[name="pinConfirm"]'];
    document.querySelectorAll(numericFields.join(',')).forEach(input => {
      const sanitize = () => { input.value = input.value.replace(/\D/g, '').slice(0, Number(input.maxLength) || undefined); };
      input.addEventListener('beforeinput', event => { if (event.data && /\D/.test(event.data)) event.preventDefault(); });
      input.addEventListener('input', sanitize);
      input.addEventListener('paste', event => {
        event.preventDefault();
        const digits = event.clipboardData.getData('text').replace(/\D/g, '');
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? start;
        input.value = `${input.value.slice(0, start)}${digits}${input.value.slice(end)}`;
        sanitize();
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });

    const script = document.createElement('script');
    script.src = 'food-builder.js';
    script.defer = true;
    document.body.appendChild(script);
  });
})();