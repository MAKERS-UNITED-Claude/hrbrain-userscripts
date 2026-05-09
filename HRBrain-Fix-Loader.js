// ==UserScript==
// @name        HRBrain Tripath Loader
// @namespace   tripath.evaluation.hrbrain.jp
// @match       https://tripath.evaluation.hrbrain.jp/*
// @run-at      document-start
// @version     1.0.0
// @description GitHub の最新版 HRBrain-Fix.js を自動取得・適用する loader (本体は GitHub に置いてあり、編集 push で全ユーザーに自動配布される)
// ==/UserScript==

(function () {
  'use strict';

  // 本体のソース URL (GitHub raw)
  const SOURCE_URL =
    'https://raw.githubusercontent.com/MAKERS-UNITED-Claude/hrbrain-userscripts/main/HRBrain-Fix.js';
  const CACHE_KEY = '__hrbrain_fix_cache_v1';

  // userscript のメタデータブロックを取り除いて eval する
  function exec(code) {
    if (!code) return;
    try {
      const stripped = code.replace(
        /^\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\s*/m,
        ''
      );
      (0, eval)(stripped); // (0, eval) は global eval
    } catch (e) {
      console.error('[HRBrain Loader] execution failed:', e);
    }
  }

  // 1. 前回フェッチした内容のキャッシュを即実行
  //    - 起動が速くなる
  //    - オフラインでも前回成功時のコードが効く
  let cached = null;
  try {
    cached = localStorage.getItem(CACHE_KEY);
  } catch (e) {}
  if (cached) exec(cached);

  // 2. 最新版を裏で取得してキャッシュ更新
  //    - GitHub への fetch には no-store + キャッシュバスター付きで CDN/HTTP キャッシュを回避
  fetch(SOURCE_URL + '?_=' + Date.now(), { cache: 'no-store' })
    .then(r => (r.ok ? r.text() : Promise.reject(new Error('HTTP ' + r.status))))
    .then(code => {
      if (code === cached) return; // 変化なし
      try {
        localStorage.setItem(CACHE_KEY, code);
      } catch (e) {}
      // 初回起動時 (cached なし) のみ、今回のページにも反映するため即実行
      if (!cached) exec(code);
    })
    .catch(e => console.warn('[HRBrain Loader] fetch failed:', e));
})();
