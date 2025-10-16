import { defineStore } from 'pinia'
import request from '../utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    token: localStorage.getItem('token') || '',
    loading: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userName: (state) => state.userInfo?.name || '未登录'
  },

  actions: {
    // 登录
    async login(loginForm) {
      this.loading = true
      try {
        const response = await request({
          url: '/auth/login',
          method: 'post',
          data: loginForm
        })

        this.token = response.data.token
        this.userInfo = response.data.userInfo
        localStorage.setItem('token', this.token)

        return response
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    // 登出
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
    },

    // 获取用户信息
    async getUserInfo() {
      if (!this.token) return

      try {
        const response = await request({
          url: '/auth/userinfo',
          method: 'get'
        })

        this.userInfo = response.data
        return response.data
      } catch (error) {
        this.logout()
        throw error
      }
    },

    // 更新用户信息
    async updateUserInfo(userData) {
      try {
        const response = await request({
          url: '/auth/userinfo',
          method: 'put',
          data: userData
        })

        this.userInfo = { ...this.userInfo, ...response.data }
        return response.data
      } catch (error) {
        throw error
      }
    }
  }
})
