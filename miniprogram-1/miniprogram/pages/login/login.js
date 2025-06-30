// pages/login/login.js
const app = getApp();

Page({
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    isLoading: false
  },

  onLoad: function() {
    // 检查是否已经登录
    if (app.globalData.userInfo && app.globalData.openid) {
      wx.redirectTo({
        url: '/pages/index/index',
      });
    }
  },

  handleLogin() {
    if (this.data.isLoading) return;
    
    this.setData({
      isLoading: true
    });

    wx.showLoading({
      title: '正在登录...',
    });

    // 推荐使用wx.getUserProfile获取用户信息
    wx.getUserProfile({
      desc: '用于完善会员资料', 
      success: (res) => {
        console.log('获取用户信息成功', res.userInfo);
        app.globalData.userInfo = res.userInfo;
        
        // 调用云函数获取openid
        wx.cloud.callFunction({
          name: 'login',
          data: {
            type: 'getOpenId'
          },
          success: loginRes => {
            console.log('[云函数] [getOpenId] user openid: ', loginRes.result.openid);
            app.globalData.openid = loginRes.result.openid;
            
            wx.hideLoading();
            this.setData({
              isLoading: false
            });
            
            wx.showToast({
              title: '登录成功',
              icon: 'success',
              duration: 1500
            });
            
            // 登录成功，跳转到主页
            setTimeout(() => {
              wx.redirectTo({
                url: '/pages/index/index',
              });
            }, 1500);
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
            console.error('[云函数] [getOpenId] 调用失败', err);
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({
          isLoading: false
        });
        console.log('用户拒绝授权', err);
        wx.showToast({
          title: '需要授权才能使用',
          icon: 'none'
        });
      }
    });
  },

  // 快速体验（跳过登录，仅用于开发测试）
  handleQuickStart() {
    wx.showModal({
      title: '提示',
      content: '跳过登录将无法保存识别记录，确定要继续吗？',
      success: (res) => {
        if (res.confirm) {
          wx.redirectTo({
            url: '/pages/index/index',
          });
        }
      }
    });
  }
});