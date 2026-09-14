/**
 * ==========================================================================
 * [Style Guide Viewer System]
 * UI 스타일 가이드 문서 전용 시스템 스크립트 (guide.js)
 * - 코드 박스 자동 추출 및 Prism.js 하이라이팅
 * - 코드 보기/닫기 토글 및 클립보드 복사
 * - 가이드 탭 네비게이션 및 새로고침 상태 유지 (Hash / localStorage)
 * ==========================================================================
 */

(function() {
  'use strict';

  // ==========================================
  // 1. 코드 박스 자동 생성 & Prism 하이라이팅
  // ==========================================
  document.addEventListener('DOMContentLoaded', function() {
    var boxes = document.querySelectorAll('.guideBox');
    
    boxes.forEach(function(box) {
      if (box.nextElementSibling && box.nextElementSibling.classList.contains('guideCodeWrap')) return;
      
      // 주석(Comment)을 포함한 원본 HTML 추출 및 가이드 래퍼 정리
      var rawHtml = box.innerHTML;
      var htmlCode = rawHtml
        .replace(/<span class="guideSizeLabel"[^>]*>[\s\S]*?<\/span>/gi, '')
        .replace(/<div class="guideSizeItem"[^>]*>([\s\S]*?)<\/div>/gi, '$1')
        .replace(/<div class="guideSizeGroup"[^>]*>([\s\S]*?)<\/div>/gi, '$1');
      
      // 들여쓰기 및 줄바꿈 정리
      var lines = htmlCode.split('\n');
      while (lines.length > 0 && lines[0].trim() === '') lines.shift();
      while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
      
      if (lines.length > 0) {
        var minIndent = null;
        lines.forEach(function(line) {
          if (line.trim().length === 0) return;
          var match = line.match(/^(\s+)/);
          var indent = match ? match[1].length : 0;
          if (minIndent === null || indent < minIndent) {
            minIndent = indent;
          }
        });

        if (minIndent && minIndent > 0) {
          var regex = new RegExp('^\\s{' + minIndent + '}');
          htmlCode = lines.map(function(l) { return l.replace(regex, ''); }).join('\n');
        } else {
          htmlCode = lines.join('\n');
        }
      }
      
      var wrap = document.createElement('div');
      wrap.className = 'guideCodeWrap';
      wrap.innerHTML = 
        '<div class="guideCodeHeader">' +
          '<button type="button" class="guideCodeToggle" onclick="toggleCode(this)">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>' +
            '<span>코드 보기</span>' +
          '</button>' +
          '<button type="button" class="guideCodeCopy" onclick="copyCode(this)">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>' +
            '<span>코드 복사</span>' +
          '</button>' +
        '</div>' +
        '<pre class="guideCodeBlock"><code class="language-html"></code></pre>';
      
      var codeEl = wrap.querySelector('code');
      codeEl.textContent = htmlCode;
      box.parentNode.insertBefore(wrap, box.nextSibling);
      
      if (window.Prism) {
        Prism.highlightElement(codeEl);
      }
    });
  });

  // ==========================================
  // 2. 가이드 탭 네비게이션 & 상태 유지
  // ==========================================
  window.activateTab = function(targetId) {
    if (!targetId) return;
    var navBtn = document.querySelector('.guideNavItem[data-target="' + targetId + '"]');
    var targetSection = document.getElementById(targetId);
    if (!navBtn || !targetSection) return;

    // 초기 깜빡임 방지용 임시 style 태그 제거
    var initStyle = document.getElementById('guideInitStyle');
    if (initStyle) initStyle.remove();

    // 탭 버튼 활성화 변경
    document.querySelectorAll('.guideNavItem').forEach(function(item) {
      item.classList.remove('isActive');
    });
    navBtn.classList.add('isActive');

    // 타겟 섹션만 노출
    document.querySelectorAll('.guideSection').forEach(function(section) {
      section.style.display = 'none';
    });
    targetSection.style.display = 'block';

    // 스크롤 상단 초기화
    var wrapper = document.querySelector('.guideWrapper');
    if (wrapper) {
      wrapper.scrollTop = 0;
    }
    window.scrollTo(0, 0);

    // 상태 저장 (localStorage & URL hash)
    try {
      localStorage.setItem('activeGuideTab', targetId);
    } catch (e) {}

    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, null, '#' + targetId);
    }
  };

  // 스티키 네비게이션 클릭 이벤트
  document.addEventListener('click', function(e) {
    var navItem = e.target.closest('.guideNavItem');
    if (navItem) {
      var targetId = navItem.getAttribute('data-target');
      window.activateTab(targetId);
    }
  });

  // ==========================================
  // 3. 테마(다크모드/라이트모드) 관리
  // ==========================================
  window.setTheme = function(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('guideTheme', theme);
    } catch (e) {}

    var toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
      var icon = toggleBtn.querySelector('.themeIcon');
      var text = toggleBtn.querySelector('.themeText');
      if (theme === 'dark') {
        if (icon) icon.textContent = '☀️';
        if (text) text.textContent = 'Light Mode';
      } else {
        if (icon) icon.textContent = '🌙';
        if (text) text.textContent = 'Dark Mode';
      }
    }
  };

  // 테마 전환 버튼 클릭 이벤트
  document.addEventListener('click', function(e) {
    var themeBtn = e.target.closest('#themeToggleBtn');
    if (themeBtn) {
      var currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      var nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      window.setTheme(nextTheme);
    }
  });

  // 초기 로드 시 저장된 탭 및 테마 복원
  document.addEventListener('DOMContentLoaded', function() {
    var savedTheme = 'light';
    try {
      savedTheme = localStorage.getItem('guideTheme') || 'light';
    } catch (e) {}
    window.setTheme(savedTheme);

    var hash = window.location.hash ? window.location.hash.replace('#', '') : null;
    var savedTab = null;
    try {
      savedTab = localStorage.getItem('activeGuideTab');
    } catch (e) {}

    var initialTab = hash || savedTab || 'sectionForms';

    if (document.getElementById(initialTab)) {
      window.activateTab(initialTab);
    } else {
      window.activateTab('sectionForms');
    }
  });

})();

// ==========================================
// 4. 코드 보기 토글 & 복사 전역 함수
// ==========================================
function toggleCode(btn) {
  var wrap = btn.closest('.guideCodeWrap');
  var codeBlock = wrap.querySelector('.guideCodeBlock');
  btn.classList.toggle('isOpen');
  codeBlock.classList.toggle('isOpen');
  var label = btn.querySelector('span');
  if (label) {
    label.textContent = codeBlock.classList.contains('isOpen') ? '코드 닫기' : '코드 보기';
  }
}

function fallbackCopy(text, cb) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  ta.style.top = '-9999px';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    if (cb) cb();
  } catch (e) {
    console.error('Clipboard copy failed:', e);
  }
  document.body.removeChild(ta);
}

function copyCode(btn) {
  var wrap = btn.closest('.guideCodeWrap');
  var code = wrap.querySelector('code').textContent;

  function onCopied() {
    btn.classList.add('isCopied');
    var label = btn.querySelector('span');
    if (label) label.textContent = '복사됨';
    setTimeout(function() {
      btn.classList.remove('isCopied');
      if (label) label.textContent = '코드 복사';
    }, 2000);
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(onCopied).catch(function() {
      fallbackCopy(code, onCopied);
    });
  } else {
    fallbackCopy(code, onCopied);
  }
}
