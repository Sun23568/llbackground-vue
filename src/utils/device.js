/**
 * 设备检测工具
 * 提供设备类型判断、屏幕尺寸检测等功能
 */

/**
 * 判断是否为移动端设备
 * @returns {boolean} true 表示移动端（屏幕宽度 <= 768px）
 */
export function isMobile() {
  return window.innerWidth <= 768
}

/**
 * 判断是否为平板设备
 * @returns {boolean} true 表示平板（768px < 屏幕宽度 <= 1024px）
 */
export function isTablet() {
  return window.innerWidth > 768 && window.innerWidth <= 1024
}

/**
 * 判断是否为桌面端设备
 * @returns {boolean} true 表示桌面端（屏幕宽度 > 1024px）
 */
export function isDesktop() {
  return window.innerWidth > 1024
}

/**
 * 获取当前设备类型
 * @returns {'mobile'|'tablet'|'desktop'} 设备类型字符串
 */
export function getDeviceType() {
  if (isMobile()) return 'mobile'
  if (isTablet()) return 'tablet'
  return 'desktop'
}

/**
 * 判断是否为小屏手机（屏幕宽度 <= 375px）
 * @returns {boolean} true 表示小屏手机
 */
export function isSmallMobile() {
  return window.innerWidth <= 375
}

/**
 * 判断设备是否支持触摸
 * @returns {boolean} true 表示支持触摸
 */
export function isTouchDevice() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  )
}

/**
 * 获取屏幕方向
 * @returns {'portrait'|'landscape'} portrait 表示竖屏，landscape 表示横屏
 */
export function getOrientation() {
  if (window.orientation !== undefined) {
    // iOS 和部分 Android 设备支持 window.orientation
    return Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait'
  }
  // 使用屏幕宽高比判断
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
}

/**
 * 判断是否为竖屏模式
 * @returns {boolean} true 表示竖屏
 */
export function isPortrait() {
  return getOrientation() === 'portrait'
}

/**
 * 判断是否为横屏模式
 * @returns {boolean} true 表示横屏
 */
export function isLandscape() {
  return getOrientation() === 'landscape'
}

/**
 * 获取设备像素比（DPR）
 * @returns {number} 设备像素比，通常为 1, 2, 3
 */
export function getDevicePixelRatio() {
  return window.devicePixelRatio || 1
}

/**
 * 判断是否为高清屏（Retina）
 * @returns {boolean} true 表示高清屏（DPR >= 2）
 */
export function isRetina() {
  return getDevicePixelRatio() >= 2
}

/**
 * 获取视口尺寸
 * @returns {{ width: number, height: number }} 视口宽度和高度
 */
export function getViewportSize() {
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight
  }
}

/**
 * 判断是否为 iOS 设备
 * @returns {boolean} true 表示 iOS 设备
 */
export function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/**
 * 判断是否为 Android 设备
 * @returns {boolean} true 表示 Android 设备
 */
export function isAndroid() {
  return /Android/i.test(navigator.userAgent)
}

/**
 * 判断是否为微信浏览器
 * @returns {boolean} true 表示微信浏览器
 */
export function isWeChat() {
  return /MicroMessenger/i.test(navigator.userAgent)
}
