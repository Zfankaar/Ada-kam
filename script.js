/* ─── PAGE NAV ─── */

function show(id) {
  document.getElementById('landingPage').classList.add('off');
  document.getElementById('signupPage').classList.add('off');
  document.getElementById('loginPage').classList.add('off');
  document.getElementById('appPage').classList.add('off');
  document.getElementById(id).classList.remove('off');
}

function goHome() { show('landingPage'); }
function showSignup() { show('signupPage'); }
function showLogin() { show('loginPage'); }

/* ─── AUTH ─── */

function handleSignup() {
  var name = document.getElementById('signupName').value.trim();
  var email = document.getElementById('signupEmail').value.trim();
  var pass = document.getElementById('signupPass').value.trim();
  if (!name || !email || !pass) { toast('fill all fields'); return; }
  showLoading('creating account');
  setTimeout(function () {
    localStorage.setItem('user', JSON.stringify({ name: name, email: email, time: Date.now() }));
    hideLoading();
    show('appPage');
    setUser();
    toast('welcome to ada kam');
  }, 800);
}

function handleLogin() {
  var email = document.getElementById('loginEmail').value.trim();
  var pass = document.getElementById('loginPass').value.trim();
  if (!email || !pass) { toast('fill all fields'); return; }
  if (!localStorage.getItem('user')) { toast('no account found'); return; }
  showLoading('signing in');
  setTimeout(function () {
    var data = JSON.parse(localStorage.getItem('user'));
    data.time = Date.now();
    localStorage.setItem('user', JSON.stringify(data));
    hideLoading();
    show('appPage');
    setUser();
    toast('welcome back');
  }, 800);
}

function setUser() {
  var data = JSON.parse(localStorage.getItem('user'));
  if (data) {
    document.getElementById('profileName').textContent = data.name;
    document.getElementById('profileEmail').textContent = data.email;
    document.getElementById('avatarLetter').textContent = data.name.charAt(0).toUpperCase();
    document.getElementById('profileSigned').classList.remove('off');
    document.getElementById('profileGuest').classList.add('off');
    document.getElementById('profileBtn').textContent = 'sign out';
    document.getElementById('profileBtn').onclick = function () {
      showLoading('signing out');
      setTimeout(function () {
        localStorage.removeItem('user');
        document.getElementById('profileSigned').classList.add('off');
        document.getElementById('profileGuest').classList.remove('off');
        hideLoading();
        updateDisplay();
        document.getElementById('earningsList').innerHTML = '<p class="empty">no earnings yet</p>';
        document.getElementById('walletList').innerHTML = '<p class="empty">no transactions yet</p>';
        goHome();
        toast('signed out');
      }, 600);
    };
    switchTab('home');
  }
}

/* ─── TABS ─── */

var screens = ['screenHome', 'screenTasks', 'screenWallet', 'screenProfile'];
var tabs = ['tabHome', 'tabTasks', 'tabWallet', 'tabProfile'];

function switchTab(tab) {
  for (var i = 0; i < screens.length; i++) {
    document.getElementById(screens[i]).classList.add('off');
    document.getElementById(tabs[i]).classList.remove('act');
  }
  var map = { home: 0, tasks: 1, wallet: 2, profile: 3 };
  var idx = map[tab] || 0;
  document.getElementById(screens[idx]).classList.remove('off');
  document.getElementById(tabs[idx]).classList.add('act');
}

/* ─── APP ─── */

var balance = 0;
var adsWatched = 0;
var cooldown = false;

function updateDisplay() {
  var b = '$' + balance.toFixed(2);
  document.getElementById('balanceDisplay').textContent = b;
  document.getElementById('balanceDisplay2').textContent = b;
  document.getElementById('balanceDisplay3').textContent = b;
  document.getElementById('balanceDisplay4').textContent = b;
  document.getElementById('walletAmount').textContent = balance.toFixed(2);
  document.getElementById('profileAds').textContent = adsWatched;
  document.getElementById('profileEarned').textContent = b;
}

function watchAd() {
  if (cooldown) return;

  var btn = document.getElementById('watchBtn');
  var label = document.getElementById('adLabel');
  var earn = document.getElementById('adEarn');
  var timer = document.getElementById('timerDisplay');

  showLoading('loading ad');
  setTimeout(function () {
    hideLoading();
    btn.disabled = true;
    cooldown = true;

    label.textContent = 'playing...';
    earn.textContent = '+$0.05';
    timer.textContent = '3';

    var count = 3;
    var interval = setInterval(function () {
      count--;
      timer.textContent = count;
      if (count <= 0) {
        clearInterval(interval);
        timer.textContent = '';
        label.textContent = 'tap to watch';
        earn.textContent = '+$0.05';
        cooldown = false;
        btn.disabled = false;
        addEarning();
      }
    }, 1000);
  }, 600);
}

function addEarning() {
  balance += 0.05;
  adsWatched++;
  updateDisplay();

  var list = document.getElementById('earningsList');
  var empty = list.querySelector('.empty');
  if (empty) empty.remove();

  var now = new Date();
  var time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  var p = document.createElement('p');
  var left = document.createElement('span');
  left.textContent = '+$0.05';
  var right = document.createElement('span');
  right.textContent = time;
  right.style.color = '#9a8f83';
  p.appendChild(left);
  p.appendChild(right);
  list.insertBefore(p, list.firstChild);

  toast('+$0.05');
}

/* ─── WITHDRAW PANEL ─── */

var selectedMethod = '';

function openWithdraw() {
  document.getElementById('walletMain').classList.add('off');
  document.getElementById('withdrawPanel').classList.remove('off');
  document.getElementById('wpBalance').textContent = balance.toFixed(2);
  document.getElementById('wpNote').textContent = '';
  document.getElementById('wpAccount').value = '';
  document.getElementById('wpAmount').value = '';
  selectedMethod = '';
  var methods = document.querySelectorAll('.wp-method');
  for (var i = 0; i < methods.length; i++) methods[i].classList.remove('active');
}

function closeWithdraw() {
  document.getElementById('walletMain').classList.remove('off');
  document.getElementById('withdrawPanel').classList.add('off');
}

function selectMethod(m) {
  selectedMethod = m;
  var methods = document.querySelectorAll('.wp-method');
  for (var i = 0; i < methods.length; i++) methods[i].classList.remove('active');
  if (m === 'easypaisa') methods[0].classList.add('active');
  else methods[1].classList.add('active');
  document.getElementById('wpNote').textContent = '';
}

function sendWithdraw() {
  if (!selectedMethod) { document.getElementById('wpNote').textContent = 'select a method'; return; }
  var account = document.getElementById('wpAccount').value.trim();
  if (!account) { document.getElementById('wpNote').textContent = 'enter account number'; return; }
  var amt = parseFloat(document.getElementById('wpAmount').value);
  if (!amt || amt < 1) { document.getElementById('wpNote').textContent = 'minimum withdrawal is $1.00'; return; }
  if (amt > balance) { document.getElementById('wpNote').textContent = 'insufficient balance'; return; }

  showLoading('sending request');
  setTimeout(function () {
    hideLoading();
    balance -= amt;
    updateDisplay();

    var list = document.getElementById('walletList');
    var empty = list.querySelector('.empty');
    if (empty) empty.remove();

    var now = new Date();
    var time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var date = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

    var p = document.createElement('p');
    var left = document.createElement('span');
    left.textContent = '-$' + amt.toFixed(2) + ' ' + selectedMethod;
    left.style.color = '#2c3a33';
    var right = document.createElement('span');
    right.textContent = date + ' ' + time;
    right.style.color = '#9a8f83';
    p.appendChild(left);
    p.appendChild(right);
    list.insertBefore(p, list.firstChild);

    closeWithdraw();
    toast('withdraw request sent');
  }, 1200);
}

/* ─── TOAST ─── */

function toast(msg) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(function () { el.classList.remove('show'); }, 2000);
}

/* ─── LOADING ─── */

function showLoading(msg) {
  document.getElementById('loadingText').textContent = msg || 'loading';
  document.getElementById('loading').classList.add('show');
}

function hideLoading() {
  document.getElementById('loading').classList.remove('show');
}

/* ─── AD CLICK ─── */

document.getElementById('adBox').addEventListener('click', function () {
  if (!cooldown) watchAd();
});

/* ─── 24H AUTO-LOGIN ─── */

(function init() {
  var raw = localStorage.getItem('user');
  if (raw) {
    var data = JSON.parse(raw);
    if (!data.time || Date.now() - data.time < 86400000) {
      showLoading('restoring session');
      setTimeout(function () {
        hideLoading();
        show('appPage');
        setUser();
      }, 600);
    } else {
      localStorage.removeItem('user');
    }
  }
})();
