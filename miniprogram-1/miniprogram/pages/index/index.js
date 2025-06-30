const app = getApp();
Page({
  data: {
    imageSrc: '',
    isLoading: false,
    isUploading: false,
    result: {
      name: '',
      latin: '',
      confidence: 0,
      features: []
    }
  },

  chooseImage() {
    this.setData({ isUploading: true });
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        setTimeout(() => {
          this.setData({
            imageSrc: res.tempFilePaths[0],
            result: { name: '', latin: '', confidence: 0, features: [] },
            isUploading: false
          });
          wx.showToast({
            title: '图片上传成功',
            icon: 'success',
            duration: 1500
          });
        }, 800);
      },
      fail: () => {
        this.setData({ isUploading: false });
        wx.showToast({
          title: '图片选择失败',
          icon: 'error'
        });
      }
    });
  },

  startRecognition() {
    if (!this.data.imageSrc) {
      wx.showToast({
        title: '请先选择一张图片',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    this.setData({ isLoading: true });
    wx.showLoading({ title: 'AI正在努力识别中...' });

    wx.uploadFile({
      url: 'http://61.136.101.57:5000/predict',
      filePath: this.data.imageSrc,
      name: 'file',
      success: (res) => {
        const data = JSON.parse(res.data);
        if (data.message === '成功') {
          const topResult = data.top5_info[0];
          this.setData({
            result: {
              name: topResult.name,
              latin: '',
              confidence: topResult.confidence,
              features: []
            }
          });
          wx.showToast({
            title: '识别完成！',
            icon: 'success',
            duration: 2000
          });
        } else {
          wx.showToast({
            title: '识别失败：' + data.error,
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '请求失败：' + err.errMsg,
          icon: 'error'
        });
      },
      complete: () => {
        this.setData({ isLoading: false });
        wx.hideLoading();
      }
    });
  },

  clearResult() {
    this.setData({
      result: { name: '', latin: '', confidence: 0, features: [] }
    });
    wx.showToast({
      title: '结果已清除',
      icon: 'none',
      duration: 1500
    });
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出当前账户吗？',
      success: (res) => {
        if (res.confirm) {
          wx.reLaunch({
            url: '/pages/Login/Login'
          });
        }
      }
    });
  },

  getConfidenceLevel(confidence) {
    if (confidence >= 0.9) return 'high';
    if (confidence >= 0.7) return 'medium';
    return 'low';
  },

  getConfidenceText(confidence) {
    if (confidence >= 0.9) return '高可信度';
    if (confidence >= 0.7) return '中等可信度';
    return '低可信度';
  }
});