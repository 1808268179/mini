// pages/index/index.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    imageUrl: '',
    recognitionResult: null,
    isRecognizing: false,
    historyList: [],
    showHistory: false,
    confidence: 0,
    // 模拟识别结果数据（实际项目中应该调用AI识别服务）
    orchidDatabase: {
      '春兰': {
        name: '春兰',
        scientificName: 'Cymbidium goeringii',
        description: '春兰是中国传统名花，花期在春季，香味浓郁，是兰花中的珍品。',
        characteristics: ['叶片狭长', '花朵单生', '香味浓郁', '春季开花'],
        care: '喜阴凉通风，忌阳光直射，浇水要适度，土壤要疏松透气。'
      },
      '蕙兰': {
        name: '蕙兰',
        scientificName: 'Cymbidium faberi',
        description: '蕙兰花朵较大，一茎多花，是兰花中比较容易养护的品种。',
        characteristics: ['一茎多花', '花朵较大', '叶片宽厚', '适应性强'],
        care: '相对容易养护，喜半阴环境，注意通风和适度浇水。'
      },
      '建兰': {
        name: '建兰',
        scientificName: 'Cymbidium ensifolium',
        description: '建兰又称四季兰，可多次开花，花期较长，深受兰友喜爱。',
        characteristics: ['四季开花', '花期较长', '叶片革质', '香味清淡'],
        care: '喜温暖湿润环境，夏季注意遮阴，冬季保温。'
      }
    }
  },

  onLoad: function() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      });
    }
    this.loadHistory();
  },

  onShow: function() {
    // 每次显示页面时重新加载历史记录
    this.loadHistory();
  },

  // 选择图片
  chooseImage: function() {
    const that = this;
    wx.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success: function(res) {
        if (res.tapIndex === 0) {
          that.takePhoto();
        } else if (res.tapIndex === 1) {
          that.chooseFromAlbum();
        }
      }
    });
  },

  // 拍照
  takePhoto: function() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      maxDuration: 30,
      camera: 'back',
      success: function(res) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        that.setData({
          imageUrl: tempFilePath
        });
        that.recognizeOrchid(tempFilePath);
      },
      fail: function(err) {
        console.error('拍照失败', err);
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        });
      }
    });
  },

  // 从相册选择
  chooseFromAlbum: function() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: function(res) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        that.setData({
          imageUrl: tempFilePath
        });
        that.recognizeOrchid(tempFilePath);
      },
      fail: function(err) {
        console.error('选择图片失败', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 识别兰花（模拟AI识别过程）
  recognizeOrchid: function(imagePath) {
    const that = this;
    
    that.setData({
      isRecognizing: true,
      recognitionResult: null
    });

    wx.showLoading({
      title: '识别中...'
    });

    // 模拟AI识别延迟
    setTimeout(() => {
      // 随机选择一个兰花种类进行模拟识别
      const orchidTypes = Object.keys(that.data.orchidDatabase);
      const randomType = orchidTypes[Math.floor(Math.random() * orchidTypes.length)];
      const confidence = 0.85 + Math.random() * 0.1; // 85-95%的置信度

      const result = {
        ...that.data.orchidDatabase[randomType],
        confidence: confidence,
        timestamp: new Date().getTime()
      };

      that.setData({
        recognitionResult: result,
        confidence: confidence,
        isRecognizing: false
      });

      wx.hideLoading();
      
      // 保存到历史记录
      that.saveToHistory(imagePath, result);

      wx.showToast({
        title: '识别完成',
        icon: 'success'
      });
    }, 2000);
  },

  // 保存到历史记录
  saveToHistory: function(imagePath, result) {
    if (!app.globalData.openid) {
      console.log('未登录，不保存历史记录');
      return;
    }

    const historyItem = {
      id: new Date().getTime(),
      imageUrl: imagePath,
      result: result,
      timestamp: new Date().getTime(),
      openid: app.globalData.openid
    };

    // 先上传图片到云存储
    this.uploadImageToCloud(imagePath, historyItem);
  },

  // 上传图片到云存储
  uploadImageToCloud: function(imagePath, historyItem) {
    const cloudPath = `orchid-images/${app.globalData.openid}/${historyItem.id}.jpg`;
    
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: imagePath,
      success: res => {
        console.log('图片上传成功', res.fileID);
        historyItem.cloudImageUrl = res.fileID;
        
        // 保存记录到数据库
        this.saveRecordToDatabase(historyItem);
      },
      fail: err => {
        console.error('图片上传失败', err);
        // 即使图片上传失败，也尝试保存记录
        this.saveRecordToDatabase(historyItem);
      }
    });
  },

  // 保存记录到数据库
  saveRecordToDatabase: function(historyItem) {
    wx.cloud.database().collection('orchid_history').add({
      data: historyItem,
      success: res => {
        console.log('历史记录保存成功', res._id);
        this.loadHistory(); // 重新加载历史记录
      },
      fail: err => {
        console.error('历史记录保存失败', err);
      }
    });
  },

  // 加载历史记录
  loadHistory: function() {
    if (!app.globalData.openid) {
      return;
    }

    wx.cloud.database().collection('orchid_history')
      .where({
        openid: app.globalData.openid
      })
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get({
        success: res => {
          console.log('历史记录加载成功', res.data);
          this.setData({
            historyList: res.data
          });
        },
        fail: err => {
          console.error('历史记录加载失败', err);
        }
      });
  },

  // 显示/隐藏历史记录
  toggleHistory: function() {
    this.setData({
      showHistory: !this.data.showHistory
    });
  },

  // 查看历史记录详情
  viewHistoryDetail: function(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({
      imageUrl: item.cloudImageUrl || item.imageUrl,
      recognitionResult: item.result,
      confidence: item.result.confidence,
      showHistory: false
    });
  },

  // 删除历史记录
  deleteHistoryItem: function(e) {
    const item = e.currentTarget.dataset.item;
    const that = this;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条识别记录吗？',
      success: function(res) {
        if (res.confirm) {
          wx.cloud.database().collection('orchid_history').doc(item._id).remove({
            success: res => {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              that.loadHistory();
            },
            fail: err => {
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '智能兰花识别 - 轻松识别兰花品种',
      path: '/pages/index/index',
      imageUrl: this.data.imageUrl || '/images/share-default.jpg'
    };
  },

  // 清空当前识别结果
  clearResult: function() {
    this.setData({
      imageUrl: '',
      recognitionResult: null,
      confidence: 0
    });
  },

  // 重新识别
  reRecognize: function() {
    if (this.data.imageUrl) {
      this.recognizeOrchid(this.data.imageUrl);
    }
  }
});