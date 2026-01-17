/**
 * 响应式 Mixin
 * 为 Vue 组件提供设备类型响应式数据和屏幕尺寸监听
 *
 * 使用方法：
 * import responsiveMixin from '@/mixins/responsiveMixin'
 *
 * export default {
 *   mixins: [responsiveMixin],
 *   mounted() {
 *     console.log(this.isMobile)    // true/false
 *     console.log(this.deviceType)  // 'mobile'/'tablet'/'desktop'
 *   }
 * }
 */

import { isMobile, isTablet, getDeviceType } from '@/utils/device'
import { addResizeListener } from '@/utils/responsive'

export default {
  data() {
    return {
      /**
       * 是否为移动端设备（屏幕宽度 <= 768px）
       * @type {boolean}
       */
      isMobile: false,

      /**
       * 是否为平板设备（768px < 屏幕宽度 <= 1024px）
       * @type {boolean}
       */
      isTablet: false,

      /**
       * 是否为桌面端设备（屏幕宽度 > 1024px）
       * @type {boolean}
       */
      isDesktop: true,

      /**
       * 当前设备类型
       * @type {'mobile'|'tablet'|'desktop'}
       */
      deviceType: 'desktop',

      /**
       * 当前视口宽度（像素）
       * @type {number}
       */
      viewportWidth: window.innerWidth,

      /**
       * 当前视口高度（像素）
       * @type {number}
       */
      viewportHeight: window.innerHeight
    }
  },

  computed: {
    /**
     * 是否为小屏设备（移动端或平板竖屏）
     * @returns {boolean}
     */
    isSmallScreen() {
      return this.isMobile || (this.isTablet && this.viewportWidth < 900)
    },

    /**
     * 是否为大屏设备（桌面端或平板横屏）
     * @returns {boolean}
     */
    isLargeScreen() {
      return this.isDesktop || (this.isTablet && this.viewportWidth >= 900)
    }
  },

  mounted() {
    // 初始化设备信息
    this.updateDevice()

    // 添加窗口大小变化监听器
    this._resizeHandler = addResizeListener(this.updateDevice)
  },

  beforeDestroy() {
    // 移除监听器，避免内存泄漏
    if (this._resizeHandler) {
      this._resizeHandler()
    }
  },

  methods: {
    /**
     * 更新设备类型信息
     * 当窗口大小变化时自动调用
     */
    updateDevice() {
      this.isMobile = isMobile()
      this.isTablet = isTablet()
      this.isDesktop = !this.isMobile && !this.isTablet
      this.deviceType = getDeviceType()
      this.viewportWidth = window.innerWidth
      this.viewportHeight = window.innerHeight
    }
  }
}
