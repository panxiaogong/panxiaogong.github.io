$(document).ready(function () {
  initHighlight();
  initSidebar();
  initDirectoryTree();
  initTreeSearch();
  initHeaderSearch();
  initBackToTop();
  buildRightToc();
  wrapImageWithFancyBox();
});

function initHighlight() {
  if (!window.hljs) return;

  $('pre code').each(function (index, block) {
    if (typeof hljs.highlightBlock === 'function') {
      hljs.highlightBlock(block);
    }
  });
}

function initSidebar() {
  var mobileMedia = window.matchMedia('(max-width: 1199px)');
  var $body = $('body');

  function syncSidebarState() {
    if (mobileMedia.matches) {
      $body.removeClass('sidebar-open');
    } else {
      $body.addClass('sidebar-open');
    }
  }

  syncSidebarState();
  $(window).on('resize', syncSidebarState);

  $('#sidebar-toggle, #sidebar-toggle-mobile').on('click', function (e) {
    e.preventDefault();
    $body.toggleClass('sidebar-open');
  });

  $('#sidebar-close, #sidebar-overlay').on('click', function () {
    if (mobileMedia.matches) {
      $body.removeClass('sidebar-open');
    }
  });

  $('#tree').on('click', 'a', function () {
    if (mobileMedia.matches && !$(this).hasClass('directory')) {
      $body.removeClass('sidebar-open');
    }
  });
}

function initDirectoryTree() {
  var $tree = $('#tree');
  if (!$tree.length) return;

  var $activeNode = $tree.find('li.file.active');
  if ($activeNode.length) {
    revealTreePath($activeNode, true);
  } else {
    $tree.children('ul').show();
  }

  $tree.on('click', 'a.directory', function (e) {
    e.preventDefault();

    var $link = $(this);
    var $directory = $link.parent('li.directory');
    var $subTree = $link.siblings('ul');
    var isOpen = $directory.hasClass('is-open');

    if (!$subTree.length) return;

    if (isOpen) {
      $subTree.slideUp(120);
      $directory.removeClass('is-open');
    } else {
      $subTree.slideDown(120);
      $directory.addClass('is-open');
    }
  });
}

function initTreeSearch() {
  var $tree = $('#tree');
  var $input = $('#search-input');
  if (!$tree.length || !$input.length) return;

  function collapseTree() {
    $tree.find('li').show();
    $tree.find('li.directory').removeClass('is-open');
    $tree.find('ul ul').hide();
  }

  function resetTree() {
    collapseTree();

    var $activeNode = $tree.find('li.file.active');
    if ($activeNode.length) {
      revealTreePath($activeNode, true);
    } else {
      $tree.children('ul').show();
    }
  }

  function filterTree(keyword) {
    var query = $.trim(keyword).toLowerCase();
    resetTree();

    if (!query.length) return;

    $tree.find('li').hide();

    var $matches = $tree.find('li.file').filter(function () {
      return $(this).text().toLowerCase().indexOf(query) !== -1;
    });

    if (!$matches.length) return;

    $matches.each(function () {
      var $file = $(this);
      $file.show();
      $file.parents('li.directory').show();
      $file.parents('ul').show();
      $file.parents('li.directory').addClass('is-open');
    });
  }

  $input.on('input', function () {
    filterTree($(this).val());
  });

  $input.on('keydown', function (e) {
    if (e.key === 'Enter') {
      var query = $.trim($(this).val());
      if (!query.length) return;

      window.open(
          searchEngine + encodeURIComponent(query + ' site:' + homeHost),
          '_blank'
      );
    }
  });
}

function initHeaderSearch() {
  var $input = $('#header-search-input');
  if (!$input.length) return;

  $input.on('keydown', function (e) {
    if (e.key === 'Enter') {
      var query = $.trim($(this).val());
      if (!query.length) return;

      window.open(
          searchEngine + encodeURIComponent(query + ' site:' + homeHost),
          '_blank'
      );
    }
  });
}

function revealTreePath($nodeSet, includeSiblings) {
  $nodeSet.each(function () {
    var $node = $(this);
    var $parentLists = $node.parents('ul');
    var $parentDirectories = $node.parents('li.directory');

    $parentLists.show();

    $parentDirectories.each(function () {
      var $directory = $(this);
      $directory.show();
      $directory.addClass('is-open');
      $directory.children('ul').show();

      if (includeSiblings) {
        $directory.siblings('li').show();
      }
    });

    if (includeSiblings) {
      $node.siblings('li').show();
    }
  });
}

function buildRightToc() {
  var $panel = $('#right-toc');
  var $container = $('#right-toc-content');
  var $article = $('#article-content');

  if (!$panel.length || !$container.length) return;

  if (!$article.length) {
    $panel.addClass('is-empty');
    $container.html('<p class="right-toc-empty">当前页面暂无目录</p>');
    return;
  }

  var $headings = $article.find('h1, h2, h3, h4');
  if (!$headings.length) {
    $panel.addClass('is-empty');
    $container.html('<p class="right-toc-empty">当前页面暂无目录</p>');
    return;
  }

  var minLevel = 6;
  $headings.each(function () {
    var level = parseInt(this.tagName.substring(1), 10);
    if (level < minLevel) {
      minLevel = level;
    }
  });

  var tocHtml = '<ul>';
  $headings.each(function (index) {
    var $heading = $(this);
    var text = $.trim($heading.text());
    if (!text.length) return;

    var headingId = this.id;
    if (!headingId) {
      headingId = 'toc-anchor-' + index;
      $heading.attr('id', headingId);
    }

    var level = parseInt(this.tagName.substring(1), 10) - minLevel + 1;
    tocHtml += '<li class="toc-level-' + level + '">';
    tocHtml += '<a href="#' + encodeURIComponent(headingId) + '" data-target-id="' + escapeHtml(headingId) + '">' + escapeHtml(text) + '</a>';
    tocHtml += '</li>';
  });
  tocHtml += '</ul>';

  $panel.removeClass('is-empty');
  $container.html(tocHtml);

  $container.off('click.rightToc').on('click.rightToc', 'a', function (e) {
    var targetId = $(this).attr('data-target-id');
    var targetNode = targetId ? document.getElementById(targetId) : null;
    if (!targetNode) return;
    e.preventDefault();

    $('html, body').stop(true).animate({
      scrollTop: $(targetNode).offset().top - 74
    }, 260);

    if (window.history && typeof window.history.replaceState === 'function') {
      window.history.replaceState(null, '', '#' + encodeURIComponent(targetId));
    }
  });

  function syncActiveHeading() {
    var scrollTop = $(window).scrollTop() + 120;
    var currentId = '';

    $headings.each(function () {
      if ($(this).offset().top <= scrollTop) {
        currentId = this.id;
      }
    });

    $container.find('a').removeClass('is-active');
    if (currentId) {
      $container.find('a').filter(function () {
        return $(this).attr('data-target-id') === currentId;
      }).addClass('is-active');
    }
  }

  syncActiveHeading();
  $(window).off('scroll.rightToc').on('scroll.rightToc', syncActiveHeading);
}

function initBackToTop() {
  var $button = $('#totop-toggle');
  if (!$button.length) return;

  $(window).on('scroll', function () {
    if ($(window).scrollTop() > 280) {
      $button.addClass('is-visible');
    } else {
      $button.removeClass('is-visible');
    }
  });

  $button.on('click', function () {
    $('html, body').animate({ scrollTop: 0 }, 220);
  });
}

function escapeHtml(content) {
  return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
}

function wrapImageWithFancyBox() {
  if (typeof $.fancybox === 'undefined') return;

  $('img').not('#header img').each(function () {
    var $image = $(this);
    var imageCaption = $image.attr('alt');
    var $imageWrapLink = $image.parent('a');

    if ($imageWrapLink.length < 1) {
      var src = this.getAttribute('src');
      var idx = src.lastIndexOf('?');
      if (idx !== -1) {
        src = src.substring(0, idx);
      }
      $imageWrapLink = $image.wrap('<a href="' + src + '"></a>').parent('a');
    }

    $imageWrapLink.attr('data-fancybox', 'images');
    if (imageCaption) {
      $imageWrapLink.attr('data-caption', imageCaption);
    }
  });

  $('[data-fancybox="images"]').fancybox({
    buttons: ['slideShow', 'thumbs', 'zoom', 'fullScreen', 'close'],
    thumbs: {
      autoStart: false
    }
  });
}
