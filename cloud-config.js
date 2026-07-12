// Public browser configuration. The publishable/anon key is designed to be
// shipped to clients; row-level security in supabase/schema.sql protects data.
window.TRUFIT_CLOUD = {
  url: 'https://mwlzvdeyapjvvsvldlnu.supabase.co',
  publishableKey: 'sb_publishable_We0sFWpMBnSQb3PP5RlLsg_TqQSeA_H'
};

(() => {
  'use strict';

  let supabaseValue;

  const wrapSupabase = value => {
    if (!value?.createClient || value.createClient.__trufitWrapped) return value;

    const originalCreateClient = value.createClient.bind(value);
    const wrappedCreateClient = (...args) => {
      const client = originalCreateClient(...args);
      window.TRUFIT_AUTH_CLIENT = client;
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

  const showAuthError = message => {
    const error = document.querySelector('#cloudError');
    if (!error) return;
    error.textContent = message;
    error.classList.remove('hidden');
  };

  window.addEventListener('load', () => {
    const form = document.querySelector('#cloudEmailForm');
    const codeForm = document.querySelector('#cloudCodeForm');
    const title = document.querySelector('#cloudTitle');
    const helper = document.querySelector('#cloudSheet .helper-copy');
    if (!form || !codeForm) return;

    if (title) title.textContent = 'Cloud account';
    if (helper) helper.textContent = 'Sign in or create an account to sync your encrypted TruFit data. Your PIN still protects the contents of your backup.';

    form.innerHTML = `
      <label>Email address<input required id="cloudEmail" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com"></label>
      <label>Password<input required id="cloudPassword" type="password" autocomplete="current-password" minlength="8" placeholder="At least 8 characters"></label>
      <button class="primary-button full" type="submit" data-auth-action="signin">Sign in and sync</button>
      <button class="outline-button full" type="submit" data-auth-action="signup">Create account</button>
    `;
    codeForm.classList.add('hidden');

    form.addEventListener('submit', async event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const client = window.TRUFIT_AUTH_CLIENT;
      const email = document.querySelector('#cloudEmail')?.value.trim();
      const password = document.querySelector('#cloudPassword')?.value || '';
      const action = event.submitter?.dataset.authAction || 'signin';
      const button = event.submitter;
      const error = document.querySelector('#cloudError');

      if (!client) return showAuthError('Cloud sync is still loading. Try again in a moment.');
      if (password.length < 8) return showAuthError('Password must be at least 8 characters.');

      if (error) error.classList.add('hidden');
      if (button) {
        button.disabled = true;
        button.textContent = action === 'signup' ? 'Creating account…' : 'Signing in…';
      }

      try {
        const result = action === 'signup'
          ? await client.auth.signUp({ email, password })
          : await client.auth.signInWithPassword({ email, password });

        if (result.error) throw result.error;
        if (action === 'signup' && !result.data.session) {
          throw new Error('Account created, but Supabase still requires email confirmation. Turn off Confirm email in Authentication settings, then sign in.');
        }

        document.querySelector('#cloudSheet')?.classList.remove('open');
        document.querySelector('#cloudSheet')?.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      } catch (err) {
        showAuthError(err.message || 'Could not connect your cloud account.');
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = action === 'signup' ? 'Create account' : 'Sign in and sync';
        }
      }
    }, true);

    const numericFields = [
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