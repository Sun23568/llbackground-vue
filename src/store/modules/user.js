import {removeToken, setToken} from '@/utils/auth'
import {default as api} from '../../utils/api'
import store from '../../store'
import router from '../../router'
import {sm3} from 'sm-crypto'

const user = {
  state: {
    nickname: "",
    userId: "",
    roleIds: [],
    menus: [],
    permissions: [],
    serverPublicKey: "",
  },
  mutations: {
    SET_USER: (state, userInfo) => {
      state.nickname = userInfo.nickname;
      state.userId = userInfo.userId;
      state.roleIds = userInfo.roleIds;
      state.menus = userInfo.menuList;
      state.permissions = userInfo.permissionList;
    },
    RESET_USER: (state) => {
      state.nickname = "";
      state.userId = "";
      state.roleIds = [];
      state.menus = [];
      state.permissions = [];
      state.serverPublicKey = ""; // 重置时也清空公钥
    },
    SET_PUBLIC_KEY: (state, publicKey) => {
      state.serverPublicKey = publicKey;
    }
  },
  actions: {// 获取服务器公钥
    GetServerPublicKey({commit}) {
      return new Promise((resolve, reject) => {
        api({
          url: "/sa/publicKey",
          method: "get"
        }).then(data => {
          commit('SET_PUBLIC_KEY', data.publicKey);
          resolve(data.publicKey);
        }).catch(err => {
          reject(err);
        });
      });
    },
    // 登录
    Login({commit, state}, loginForm) {
      // 密码加密
      loginForm.password = sm3(loginForm.password);
      const form = {
        userId: loginForm.userId,
        password: sm2.doEncrypt(loginForm.password, state.serverPublicKey)
      }
      return new Promise((resolve, reject) => {
        api({
          url: "/sa/login", method: "post", data: loginForm
        }).then(data => {
          //localstorage中保存token
          setToken(data.userSession.sessionMap.token);
          resolve(data);
        }).catch(err => {
          reject(err)
        })
      })
    },
    // 获取用户信息
    GetInfo({commit, state}) {
      // 前端使用SM2加密密码
      const encryptedPassword = sm2.doEncrypt(password, serverPublicKey);
      return new Promise((resolve, reject) => {
        api({
          url: '/sa/session', method: 'post'
        }).then(data => {
          //储存用户信息
          commit('SET_USER', data);
          //生成路由
          store.dispatch('GenerateRoutes', data).then(() => {
            //生成该用户的新路由json操作完毕之后,调用vue-router的动态新增路由方法,将新路由添加
            router.addRoutes(store.getters.addRouters)
          })
          resolve(data)
        }).catch(error => {
          reject(error)
        })
      })
    },
    // 登出
    LogOut({commit}) {
      return new Promise((resolve) => {
        api({
          url: "login/logout", method: "post"
        }).then(data => {
          commit('RESET_USER')
          removeToken()
          resolve(data);
        }).catch(() => {
          commit('RESET_USER')
          removeToken()
        })
      })
    },
    // 前端登出,不用调后端清除token的接口
    FedLogOut({commit}) {
      return new Promise(resolve => {
        commit('RESET_USER')
        removeToken()
        resolve()
      })
    }
  }
}
export default user
