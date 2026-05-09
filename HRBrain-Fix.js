// ==UserScript==
// @name        HRBrain Tripath iPad/iPhone Layout Fix
// @namespace   tripath.evaluation.hrbrain.jp
// @match       https://tripath.evaluation.hrbrain.jp/*
// @run-at      document-start
// @version     2.1.0
// @description 古いiPadOS Safari (iPad 6世代等) でのレイアウト崩れを修正 (customize_usersheets ページに限定)
// ==/UserScript==

(function () {
  'use strict';

  // 修正を適用する対象パス（hash ルーティング）
  // 例: https://tripath.evaluation.hrbrain.jp/#/customize_usersheets/68338/3876001/212728
  // @match は hash 部にマッチできないのでここで判定する
  function isTargetPage() {
    return /^#\/customize_usersheets(\/|$)/.test(location.hash);
  }

  // ---- 1. viewport を 1280 に固定 -----------------------------------
  // ページが固定 1280px 幅で組まれているので、Safari に正しい幅を伝えて
  // 自動で縮小フィットさせる（ピンチズーム可）。
  const VIEWPORT = 'width=1280, user-scalable=yes';

  function ensureViewport() {
    let m = document.querySelector('meta[name="viewport"]');
    if (!m) {
      m = document.createElement('meta');
      m.setAttribute('name', 'viewport');
      (document.head || document.documentElement).appendChild(m);
    }
    if (m.getAttribute('content') !== VIEWPORT) {
      m.setAttribute('content', VIEWPORT);
    }
  }

  // ---- 2. position: sticky を全部 static に倒す ---------------------
  // 古い iPadOS Safari の sticky 二重描画バグ対策。
  function unstickAll() {
    const els = document.querySelectorAll('*');
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (el.dataset.__unstuck) continue;
      const cs = getComputedStyle(el);
      if (cs.position === 'sticky' || cs.position === '-webkit-sticky') {
        el.style.setProperty('position', 'static', 'important');
        el.dataset.__unstuck = '1';
      }
    }
  }

  // ---- 3. KPI/スキル評価表のグリッド行が画面高さに膨れるバグの修正 -
  // grid-template-rows に 500〜1299px の値が含まれる「壊れた grid」を
  // 症状ベースで検出する（styled-components の動的クラス名 sc-XXX に
  // 依存しないので、HRBrain 側のデプロイで効力を失わない）。
  function capBuggyGridCells() {
    const all = document.querySelectorAll('*');
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const cs = getComputedStyle(el);
      if (cs.display !== 'grid') continue;
      const rows = cs.gridTemplateRows;
      if (!rows) continue;
      if (!/\b(?:[5-9]\d\d|1[0-2]\d\d)(?:\.\d+)?px\b/.test(rows)) continue;

      // 壊れた grid 内の「狭い・高い」セルだけ 60px に cap
      el.querySelectorAll('*').forEach(c => {
        if (c.tagName === 'TEXTAREA' || c.tagName === 'INPUT') return;
        const r = c.getBoundingClientRect();
        if (r.height > 200 && r.width < 400) {
          c.style.setProperty('max-height', '60px', 'important');
        }
      });
    }
  }

  // ---- 4. ミッション/備考など textarea を含む縦長セクションを抑える -
  // textarea を持つ要素から親を 8 段まで遡って、高さ 500〜1500px の
  // 要素を 250px (textarea 自体は 200px) に cap する。
  function capTextareaAncestors() {
    document.querySelectorAll('textarea').forEach(ta => {
      let el = ta;
      let n = 0;
      while (el && el !== document.body && n < 8) {
        const r = el.getBoundingClientRect();
        if (r.height >= 500 && r.height <= 1500) {
          const limit = el.tagName === 'TEXTAREA' ? '200px' : '250px';
          el.style.setProperty('max-height', limit, 'important');
        }
        el = el.parentElement;
        n++;
      }
    });
  }

  // ---- 5. ベースCSS（横はみ出し抑制） ------------------------------
  function injectStyle() {
    if (document.getElementById('__tripath_fix_style')) return;
    const style = document.createElement('style');
    style.id = '__tripath_fix_style';
    style.textContent = `html, body { overflow-x: hidden !important; }`;
    (document.head || document.documentElement).appendChild(style);
  }

  // ---- 全修正を適用 -------------------------------------------------
  function applyAllFixes() {
    if (!isTargetPage()) return;
    ensureViewport();
    injectStyle();
    unstickAll();
    capBuggyGridCells();
    capTextareaAncestors();
  }

  applyAllFixes();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAllFixes, { once: true });
  }

  // SPA / hash ルーティング遷移への追従
  window.addEventListener('hashchange', applyAllFixes);

  // 動的描画 (React 再レンダリング等) への追従（300ms debounce で連発を抑制）
  let timer = null;
  new MutationObserver(() => {
    if (!isTargetPage()) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(applyAllFixes, 300);
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
