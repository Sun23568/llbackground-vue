/**
 * 响应式辅助函数
 * 提供防抖、节流、窗口监听等响应式开发常用工具
 */

/**
 * 防抖函数
 * 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时
 *
 * @param {Function} fn - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒），默认 300ms
 * @returns {Function} 防抖后的函数
 *
 * @example
 * const debouncedFn = debounce(() => console.log('执行'), 500)
 * window.addEventListener('resize', debouncedFn)
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

/**
 * 节流函数
 * 规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效
 *
 * @param {Function} fn - 要节流的函数
 * @param {number} interval - 时间间隔（毫秒），默认 300ms
 * @returns {Function} 节流后的函数
 *
 * @example
 * const throttledFn = throttle(() => console.log('执行'), 500)
 * window.addEventListener('scroll', throttledFn)
 */
export function throttle(fn, interval = 300) {
  let lastTime = 0
  return function(...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

/**
 * 添加窗口大小变化监听器（带防抖）
 *
 * @param {Function} callback - 窗口大小变化时的回调函数
 * @param {number} delay - 防抖延迟时间（毫秒），默认 150ms
 * @returns {Function} 移除监听器的函数
 *
 * @example
 * const removeListener = addResizeListener(() => {
 *   console.log('窗口大小改变:', window.innerWidth)
 * })
 * // 移除监听
 * removeListener()
 */
export function addResizeListener(callback, delay = 150) {
  const handler = debounce(callback, delay)
  window.addEventListener('resize', handler)
  return () => window.removeEventListener('resize', handler)
}

/**
 * 添加窗口滚动监听器（带节流）
 *
 * @param {Function} callback - 窗口滚动时的回调函数
 * @param {number} interval - 节流间隔时间（毫秒），默认 100ms
 * @returns {Function} 移除监听器的函数
 *
 * @example
 * const removeListener = addScrollListener(() => {
 *   console.log('页面滚动:', window.scrollY)
 * })
 */
export function addScrollListener(callback, interval = 100) {
  const handler = throttle(callback, interval)
  window.addEventListener('scroll', handler, { passive: true })
  return () => window.removeEventListener('scroll', handler)
}

/**
 * 添加屏幕方向变化监听器
 *
 * @param {Function} callback - 屏幕方向变化时的回调函数
 * @returns {Function} 移除监听器的函数
 *
 * @example
 * const removeListener = addOrientationListener(() => {
 *   console.log('屏幕方向改变')
 * })
 */
export function addOrientationListener(callback) {
  // 优先使用 orientationchange 事件
  if ('onorientationchange' in window) {
    window.addEventListener('orientationchange', callback)
    return () => window.removeEventListener('orientationchange', callback)
  }
  // 降级使用 resize 事件
  return addResizeListener(callback)
}

/**
 * 获取视口宽度
 * @returns {number} 视口宽度（像素）
 */
export function getViewportWidth() {
  return window.innerWidth || document.documentElement.clientWidth
}

/**
 * 获取视口高度
 * @returns {number} 视口高度（像素）
 */
export function getViewportHeight() {
  return window.innerHeight || document.documentElement.clientHeight
}

/**
 * 获取文档滚动高度
 * @returns {number} 文档滚动高度（像素）
 */
export function getScrollTop() {
  return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
}

/**
 * 获取文档滚动宽度
 * @returns {number} 文档滚动宽度（像素）
 */
export function getScrollLeft() {
  return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0
}

/**
 * 滚动到页面顶部（带平滑动画）
 *
 * @param {number} duration - 动画持续时间（毫秒），默认 300ms
 *
 * @example
 * scrollToTop(500)
 */
export function scrollToTop(duration = 300) {
  const scrollTop = getScrollTop()
  if (scrollTop === 0) return

  const startTime = Date.now()

  const scroll = () => {
    const currentTime = Date.now()
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    // 使用缓动函数（easeInOutQuad）
    const easeProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2

    window.scrollTo(0, scrollTop * (1 - easeProgress))

    if (progress < 1) {
      requestAnimationFrame(scroll)
    }
  }

  requestAnimationFrame(scroll)
}

/**
 * 滚动到指定元素（带平滑动画）
 *
 * @param {HTMLElement|string} element - 目标元素或选择器
 * @param {number} offset - 偏移量（像素），默认 0
 * @param {number} duration - 动画持续时间（毫秒），默认 300ms
 *
 * @example
 * scrollToElement('#target', -50, 500)
 */
export function scrollToElement(element, offset = 0, duration = 300) {
  const targetElement = typeof element === 'string'
    ? document.querySelector(element)
    : element

  if (!targetElement) return

  const targetTop = targetElement.getBoundingClientRect().top + getScrollTop() + offset
  const startTop = getScrollTop()
  const distance = targetTop - startTop
  const startTime = Date.now()

  const scroll = () => {
    const currentTime = Date.now()
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    // 使用缓动函数
    const easeProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2

    window.scrollTo(0, startTop + distance * easeProgress)

    if (progress < 1) {
      requestAnimationFrame(scroll)
    }
  }

  requestAnimationFrame(scroll)
}

/**
 * 监听元素进入视口
 *
 * @param {HTMLElement|string} element - 目标元素或选择器
 * @param {Function} callback - 元素进入视口时的回调函数
 * @param {Object} options - IntersectionObserver 配置选项
 * @returns {Function} 停止监听的函数
 *
 * @example
 * const stopObserving = observeElementInView('#target', (isInView) => {
 *   console.log('元素在视口内:', isInView)
 * })
 */
export function observeElementInView(element, callback, options = {}) {
  const targetElement = typeof element === 'string'
    ? document.querySelector(element)
    : element

  if (!targetElement) return () => {}

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      callback(entry.isIntersecting, entry)
    })
  }, {
    threshold: 0.1,
    ...options
  })

  observer.observe(targetElement)

  return () => observer.disconnect()
}

/**
 * 延迟执行（Promise 版本）
 *
 * @param {number} ms - 延迟时间（毫秒）
 * @returns {Promise} Promise 对象
 *
 * @example
 * await sleep(1000)
 * console.log('1秒后执行')
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 等待条件成立（轮询）
 *
 * @param {Function} condition - 条件函数，返回 true 表示条件成立
 * @param {number} interval - 轮询间隔（毫秒），默认 100ms
 * @param {number} timeout - 超时时间（毫秒），默认 5000ms
 * @returns {Promise<boolean>} 条件是否在超时前成立
 *
 * @example
 * const success = await waitFor(() => document.querySelector('#target') !== null)
 */
export function waitFor(condition, interval = 100, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now()

    const check = () => {
      if (condition()) {
        resolve(true)
      } else if (Date.now() - startTime >= timeout) {
        resolve(false)
      } else {
        setTimeout(check, interval)
      }
    }

    check()
  })
}
