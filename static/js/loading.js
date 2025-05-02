// ==============================
// LOADING.JS — Loading Animation
// ==============================

// ==============================
// LOADER FUNCTIONS — Internal
// ==============================

function insertLoaderSmart(wrapper, parent) {
  const stickyBar = parent.querySelector('.sticky-bar');
  if (stickyBar && stickyBar.nextSibling) {
    parent.insertBefore(wrapper, stickyBar.nextSibling);
  } else {
    parent.insertBefore(wrapper, parent.firstChild); // fallback to top
  }
}

function createSpinnerLoader({ id = 'loading-spinner', parent = document.body } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'loading spinner';
  wrapper.id = id;

  const spinner = document.createElement('div');
  spinner.className = 'spinner';

  wrapper.appendChild(spinner);
  insertLoaderSmart(wrapper, parent);

  return wrapper;
}

function createBounceLoader({ id = 'loading-bounce', parent = document.body } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'loading bounce';
  wrapper.id = id;

  ['one', 'two', 'three'].forEach(num => {
    const ball = document.createElement('div');
    ball.className = `bounce-ball ${num}`;
    wrapper.appendChild(ball);
  });

  insertLoaderSmart(wrapper, parent);

  return wrapper;
}

function detectLoaderTypeFromDOM() {
  if (document.querySelector('#loading-bounce')) return 'bounce';
  if (document.querySelector('#loading-spinner')) return 'spinner';
  return 'spinner'; // fallback default
}

// ==============================
// LOADER MANAGER — Public API
// ==============================
export const LoaderManager = {
  create(type = 'spinner', options = {}) {
    switch (type) {
      case 'bounce':
        return createBounceLoader(options);
      case 'spinner':
      default:
        return createSpinnerLoader(options);
    }
  },

  remove(type = 'spinner', id) {
    const loaderId = id || `loading-${type}`;
    const el = document.getElementById(loaderId);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  },

  toggle(type = 'spinner', isVisible = true, id) {
    const loaderId = id || `loading-${type}`;
    const el = document.getElementById(loaderId);
    if (el) el.style.display = isVisible ? 'block' : 'none';
  },

  run(typeOrTask = 'spinner', taskOrOptions = () => {}, maybeOptions = {}) {
    let type = typeof typeOrTask === 'string' ? typeOrTask : undefined;
    let task = typeof typeOrTask === 'function' ? typeOrTask : taskOrOptions;
    let options = typeof taskOrOptions === 'object' ? taskOrOptions : maybeOptions;

    if (!type) type = detectLoaderTypeFromDOM();

    this.create(type, options);
    this.toggle(type, true, options.id);

    return Promise.resolve(task()).finally(() => {
      this.toggle(type, false, options.id);
      this.remove(type, options.id);
    });
  }
};
