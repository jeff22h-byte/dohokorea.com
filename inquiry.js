/* DOHO Korea — shared inquiry sender (FormSubmit AJAX → overseas@dohokorea.com) */
(function () {
  var ENDPOINT = 'https://formsubmit.co/ajax/overseas@dohokorea.com';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function val(form, name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? el.value.trim() : '';
  }

  function show(status, ok, text) {
    status.style.display = 'block';
    status.className = 'inq-status ' + (ok ? 'ok' : 'err');
    status.textContent = text;
  }

  window.dohoSendInquiry = async function (form, source) {
    var status = form.querySelector('.inq-status');
    var btn = form.querySelector('button[type="submit"]');
    if (val(form, '_honey')) return; // bot trap

    var name = val(form, 'name'), email = val(form, 'email'), message = val(form, 'message');
    if (!name || !email || !message) { show(status, false, 'Please fill in Name, Email and Message.'); return; }
    if (!EMAIL_RE.test(email)) { show(status, false, 'Please enter a valid email address.'); return; }

    var product = val(form, 'product');
    var data = {
      name: name,
      company: val(form, 'company'),
      email: email,
      country: val(form, 'country'),
      product: product,
      message: message,
      source: source || location.href,
      _subject: '[DOHO Website Inquiry] ' + (product || 'General') + ' — ' + name,
      _replyto: email,
      _template: 'table',
      _captcha: 'false'
    };

    btn.disabled = true;
    var label = btn.textContent;
    btn.textContent = 'Sending…';
    status.style.display = 'none';

    try {
      var res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      var json = {};
      try { json = await res.json(); } catch (e) {}
      if (res.ok && String(json.success) === 'true') {
        show(status, true, '✅ Thank you. Your inquiry has been sent — our team will reply shortly.');
        form.querySelectorAll('input:not([type=hidden]):not([name=_honey]), textarea').forEach(function (el) {
          if (el.name !== 'product' || !el.dataset.fixed) el.value = '';
        });
      } else if (/activat/i.test(json.message || '')) {
        show(status, true, '✅ Received. (Admin: please check overseas@dohokorea.com for the FormSubmit activation email — one-time setup.)');
        return;
      } else {
        throw new Error((json.message || ('HTTP ' + res.status)));
      }
    } catch (err) {
      console.error('[DOHO inquiry]', err);
      show(status, false, '❌ Sending failed (' + (err && err.message ? err.message : 'network') + '). Please email us directly at overseas@dohokorea.com');
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  };
})();
