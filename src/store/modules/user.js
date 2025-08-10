import {removeToken, setToken} from '@/utils/auth'
import {default as api} from '../../utils/api'
import store from '../../store'
import router from '../../router'
import {sm3} from 'sm-crypto'

const user = {
  state: {
    userId: "",
    userName: "",
    roleIds: [],
    menus: [],
    permissions: [],
    serverPublicKey: "",
  },
  mutations: {
    SET_USER: (state, userInfo) => {
      const info = userInfo.userSession;
      state.userId = info.userId;
      state.userName = info.userName;
      // state.roleIds = userInfo.roleIds;
      state.menus = info.userCacheItemVo.menus;
      state.permissions = info.userCacheItemVo.perms;
    },
    RESET_USER: (state) => {
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
      const param = {
        userId: loginForm.userId,
        password: sm3(loginForm.password)
      }
      return new Promise((resolve, reject) => {
        api({
          url: "/sa/login", method: "post", data: param
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
      return new Promise((resolve, reject) => {
        api({
          url: '/sa/session', method: 'post'
        }).then(data => {
          //储存用户信息
          commit('SET_USER', data);
          //生成路由
          store.dispatch('GenerateRoutes', data.userSession).then(() => {
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
