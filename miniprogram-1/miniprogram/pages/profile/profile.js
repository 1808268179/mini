// pages/profile/profile.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    isLoading: false,
    menuItems: [
      {
        id: 'history',
        title: '识别历史',
        icon: '/images/icons/history.png',
        arrow: true,
        badge: '',
        url: '/pages/history/history'
      },
      {
        id: 'favorites',
        title: '我的收藏',
        icon: '/images/icons/favorite.png',
        arrow: true,
        badge: '',
        url: '/pages/favorites/favorites'
      },
      {
        id: 'knowledge',
        title: '兰花百科',
        icon: '/images/icons/book.png',
        arrow: true,
        badge: 'new',
        url: '/pages/knowledge/knowledge'
      }
    ],
    settingItems: [
      {
        id: 'feedback',
        title: '意见反馈',
        icon: '/images/icons/feedback.png',
        arrow: true
      },
      {
        id: 'about',
        title: '关于我们',
        icon: '/images/icons/about.png',
        arrow: true
      },
      {
        id: 'privacy',
        title: '隐私政策',
        icon: '/images/icons/privacy.png',
        arrow: true
      }
    ],
    stats: {
      totalRecognitions: 0,
      accurateRecognitions: 0,
      favoriteCount: 0,
      usageDays: 0
    }
  },

  onLoad() {
    // 检查是否支持 getUserProfile (已废弃，但保留兼容性检查)
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    this.loadUserInfo();
    this.loadUserStats();
  },

  onShow() {
    // 每次显示页面时重新加载用户信息和统计数据
    this.loadUserInfo();
    this.loadUserStats();
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = app.globalData.userInfo;
    const openid = app.globalData.openid;
    
    if (userInfo && openid) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
    } else {
      this.setData({
        hasUserInfo: false
      });
    }
  },

  // 加载用户统计数据
  async loadUserStats() {
    if (!app.globalData.openid) {
      return;
    }

    try {
      // 这里可以调用云函数获取用户统计数据
      // 暂时使用模拟数据
      const stats = {
        totalRecognitions: 25,
        accurateRecognitions: 23,
        favoriteCount: 8,
        usageDays: 15
      };
      
      this.setData({
        stats: stats
      });
    } catch (error) {
      console.error('加载用户统计数据失败:', error);
    }
  },

  // 新版用户登录 - 使用头像昵称填写能力
  handleLogin() {
    if (this.data.isLoading) return;

    this.setData({
      isLoading: true
    });

    wx.showLoading({
      title: '正在登录...'
    });

    // 先调用云函数获取openid
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: loginRes => {
        console.log('[云函数] [login] user openid: ', loginRes.result.openid);
        app.globalData.openid = loginRes.result.openid;

        // 创建默认用户信息，后续通过头像昵称组件更新
        const defaultUserInfo = {
          nickName: '微信用户',
          avatarUrl: '/images/default-avatar.png' // 需要添加一个默认头像
        };
        
        app.globalData.userInfo = defaultUserInfo;

        wx.hideLoading();
        this.setData({
          isLoading: false,
          userInfo: defaultUserInfo,
          hasUserInfo: true
        });

        wx.showToast({
          title: '登录成功，请设置头像昵称',
          icon: 'success',
          duration: 2000
        });

        // 重新加载统计数据
        this.loadUserStats();
      },
      fail: err => {
        wx.hideLoading();
        this.setData({
          isLoading: false
        });
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
        console.error('[云函数] [login] 调用失败', err);
      }
    });
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    const userInfo = { ...this.data.userInfo, avatarUrl };
    
    this.setData({
      userInfo: userInfo
    });
    
    // 更新全局数据
    app.globalData.userInfo = userInfo;
    
    // 这里可以调用云函数保存用户信息到数据库
    this.saveUserInfo(userInfo);
    
    wx.showToast({
      title: '头像更新成功',
      icon: 'success'
    });
  },

  // 输入昵称
  onInputNickname(e) {
    const nickName = e.detail.value;
    const userInfo = { ...this.data.userInfo, nickName };
    
    this.setData({
      userInfo: userInfo
    });
    
    // 更新全局数据
    app.globalData.userInfo = userInfo;
    
    // 这里可以调用云函数保存用户信息到数据库
    this.saveUserInfo(userInfo);
  },

  // 保存用户信息到云数据库
  async saveUserInfo(userInfo) {
    if (!app.globalData.openid) {
      return;
    }

    try {
      // 调用云函数保存用户信息
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'saveUserInfo',
          data: {
            openid: app.globalData.openid,
            userInfo: userInfo,
            updateTime: new Date()
          }
        }
      });
      
      console.log('用户信息保存成功:', result);
    } catch (error) {
      console.error('保存用户信息失败:', error);
    }
  },

  // 处理菜单项点击
  handleMenuItemTap(e) {
    const item = e.currentTarget.dataset.item;
    
    if (item.url) {
      wx.navigateTo({
        url: item.url,
        fail: () => {
          wx.showToast({
            title: '页面暂未开放',
            icon: 'none'
          });
        }
      });
    } else {
      wx.showToast({
        title: '功能开发中',
        icon: 'none'
      });
    }
  },

  // 处理设置项点击
  handleSettingItemTap(e) {
    const item = e.currentTarget.dataset.item;
    
    switch(item.id) {
      case 'feedback':
        this.showFeedback();
        break;
      case 'about':
        this.showAbout();
        break;
      case 'privacy':
        this.showPrivacy();
        break;
      default:
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
    }
  },

  // 显示意见反馈
  showFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '感谢您的反馈！您可以通过以下方式联系我们：\n\n微信：your_wechat\n邮箱：your_email@example.com',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 显示关于我们
  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '智能兰花识别小程序 v1.0.0\n\n基于深度学习技术的兰花品种识别工具，帮助用户快速准确地识别兰花品种。\n\n技术支持：微信云开发',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 显示隐私政策
  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们重视您的隐私保护。使用本小程序时：\n\n1. 仅收集必要的用户信息\n2. 图片仅用于识别，不会存储\n3. 不会向第三方泄露个人信息\n4. 您可以随时清除个人数据',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除全局数据
          app.globalData.userInfo = null;
          app.globalData.openid = null;
          
          // 更新页面状态
          this.setData({
            userInfo: null,
            hasUserInfo: false,
            stats: {
              totalRecognitions: 0,
              accurateRecognitions: 0,
              favoriteCount: 0,
              usageDays: 0
            }
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  // 分享小程序
  onShareAppMessage() {
    return {
      title: '智能兰花识别 - 拍照识别兰花品种',
      path: '/pages/home/home',
      imageUrl: '/images/share-cover.jpg'
    };
  }
});