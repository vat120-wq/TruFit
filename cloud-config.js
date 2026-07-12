// Public browser configuration. The publishable/anon key is designed to be
// shipped to clients; row-level security in supabase/schema.sql protects data.
window.TRUFIT_CLOUD = {
  url: 'https://mwlzvdeyapjvvsvldlnu.supabase.co',
  publishableKey: 'sb_publishable_We0sFWpMBnSQb3PP5RlLsg_TqQSeA_H'
};

(() => {
  'use strict';

  const redirectUrl = 'https://vat120-wq.github.io/TruFit/';
  let supabaseValue;

  const wrapSupabase = value => {
    if (!value?.createClient || value.createClient.__trufitWrapped) return value;

    const originalCreateClient = value.createClient.bind(value);
    const wrappedCreateClient = (...args) => {
      const client = originalCreateClient(...args);
      const originalSignInWithOtp = client.auth.signInWithOtp.bind(client.auth);

      client.auth.signInWithOtp = credentials => originalSignInWithOtp({
        ...credentials,
        options: {
          ...(credentials?.options || {}),
          emailRedirectTo: redirectUrl
        }
      });

      return client;
    };

    wrappedCreateClient.__trufitWrapped = true;
    value.createClient = wrappedCreateClient;
    return value;
  };

  Object.defineProperty(window, 'supabase', {
    configurable: true,
    get() {
      return supabaseValue;
    },
    set(value) {
      supabaseValue = wrapSupabase(value);
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const numericFields = [
      '#cloudCode',
      '#unlockPin',
      '#unlockPinConfirm',
      'input[name="pin"]',
      'input[name="pinConfirm"]'
    ];

    document.querySelectorAll(numericFields.join(',')).forEach(input => {
      const sanitize = () => {
        input.value = input.value.replace(/\D/g, '').slice(0, Number(input.maxLength) || undefined);
      };

      input.addEventListener('beforeinput', event => {
        if (event.data && /\D/.test(event.data)) event.preventDefault();
      });
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
  });
})();