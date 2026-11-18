// 던전 히어로 직원판 — 업데이트 알림(게임을 안 켜 둔 사람에게 휴대폰 알림) · 빌드 236
// 알림을 받는 일만 한다(파일을 저장해 두거나 화면을 가로채지 않음)
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
firebase.initializeApp({ apiKey: 'AIzaSyAhMP7rb-v03_k63U3SwILkWYaRQJ1A1Jk', authDomain: 'dungeon-hero-jd.firebaseapp.com', projectId: 'dungeon-hero-jd', storageBucket: 'dungeon-hero-jd.firebasestorage.app', messagingSenderId: '917108683360', appId: '1:917108683360:web:0ec3033c33a522a30e8905' });
firebase.messaging();
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL('./index.html', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(L => { for (const c of L) if (c.url.indexOf('/dungeon-hero/staff/') >= 0 && 'focus' in c) return c.focus(); return clients.openWindow(url); }));
});
