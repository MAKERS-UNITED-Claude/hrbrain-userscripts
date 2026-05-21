// ==UserScript==
// @name        HRBrain Tripath iPad/iPhone Layout Fix
// @namespace   tripath.evaluation.hrbrain.jp
// @match       https://tripath.evaluation.hrbrain.jp/*
// @run-at      document-start
// @version     2.2.0
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

  // ---- 4. 自己PR/ミッション/備考の textarea を内容に合わせて自動リサイズ -
  // 旧バージョン (v2.1) は textarea を 200px / 親を 250px に固定キャップして
  // 「画面いっぱいに広がるバグ」を抑えていたが、入力量が増えると枠から
  // あふれて入力しづらくなる副作用があった。
  // 代わりに scrollHeight 追従で自然なリサイズに変更。
  // 暴走防止のため上限 800px の安全弁を残す。
  const TEXTAREA_MIN_PX = 120;
  const TEXTAREA_MAX_PX = 800; // 古いSafariのバグ由来の異常膨張への安全弁

  function resizeOne(ta) {
    ta.style.setProperty('height', 'auto', 'important');
    const target = Math.max(
      TEXTAREA_MIN_PX,
      Math.min(ta.scrollHeight, TEXTAREA_MAX_PX)
    );
    ta.style.setProperty('height', target + 'px', 'important');

    // textarea を含む親8段までの固定キャップ (旧版が設定したもの含む) を解除して
    // textarea が伸びるのに親が追従できるようにする
    let el = ta.parentElement;
    let n = 0;
    while (el && el !== document.body && n < 8) {
      if (el.style.maxHeight) {
        el.style.removeProperty('max-height');
      }
      el = el.parentElement;
      n++;
    }
  }

  function autoResizeTextareas() {
    document.querySelectorAll('textarea').forEach(ta => {
      if (!ta.dataset.__autoResize) {
        ta.dataset.__autoResize = '1';
        const handler = () => resizeOne(ta);
        ta.addEventListener('input', handler);
        ta.addEventListener('change', handler);
      }
      // 既存 textarea / 新規 textarea いずれも、現在の内容に合わせて再計算
      resizeOne(ta);
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
    autoResizeTextareas();
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
