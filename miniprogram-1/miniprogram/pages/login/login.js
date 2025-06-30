// pages/login/login.js
const app = getApp();

Page({
  data: {},

  handleLogin() {
    wx.showLoading({
      title: '正在登录...',
    });

    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认
    wx.getUserProfile({
      desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        app.globalData.userInfo = res.userInfo;
        
        // 调用云函数获取openid
        wx.cloud.callFunction({
          name: 'login',
          data: {},
          success: loginRes => {
            console.log('[云函数] [login] user openid: ', loginRes.result.openid);
            app.globalData.openid = loginRes.result.openid;
            
            wx.hideLoading();
            
            // 登录成功，跳转到主页
            wx.redirectTo({
              url: '/pages/index/index',
            });
          },
          fail: err => {
            wx.hideLoading();
            wx.showToast({
              title: '登录失败，请重试',
              icon: 'none'
            });
            console.error('[云函数] [login] 调用失败', err);
          }
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '您已取消授权',
          icon: 'none'
        });
      }
    });
  },

  onLoad: function() {
    // 可以在这里添加一个逻辑：如果已经登录过，直接跳转
    // 为了演示，我们每次都显示登录页
  }
});
