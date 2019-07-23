(function(){

  var serviceHost = 'http://192.168.82.101:8071';
  var _whiteList = [
    serviceHost,
    'chrome-extension', // 插件自身配置
  ]

  var config = {
    white_list: [], // 白名单 优先级 1
    black_list: [], // 黑名单 优先级 2
  };

  init();
  function init(){
    fullScreen();
    blockUrl();
    syncBlockSetting();
    // 10分钟同步一次配置
    setInterval(() => {
      syncBlockSetting();
    }, 1000 * 60 * 10);

   var params = {
     email:'admin',
     password: rsaEncode('18201105574_aaaabbbbbccc')
   }
  }

  function fullScreen(){
    chrome.windows.getCurrent({}, (currentWindow) => {
      // state: 可选 'minimized', 'maximized' and 'fullscreen' 
      chrome.windows.update(currentWindow.id, {state: 'maximized'});
    });
  }

  function blockUrl(){
    //监听所有请求
    chrome.webRequest.onBeforeRequest.addListener((details) => {
          var url = details.url;

          for(var i = 0; i < _whiteList.length; i++){
            if(url.indexOf(_whiteList[i]) > -1){
              return { cancel: false }
            }
          }

          if(config.whiteable && config.white_list.length > 0){
            var isWhite = config.white_list.findIndex(item => url.match(new RegExp(item.replace(/\*/g, '.*'),'ig'))) != -1;
            console.log(isWhite, url)
            return { cancel: !isWhite }
          }
          if(config.blackable && config.black_list.length > 0){
            var isBlack = config.black_list.findIndex(item => url.match(new RegExp(item.replace(/\*/g, '.*'),'ig'))) != -1;
            console.log(isBlack, url)
            return { cancel: isBlack };
          }
          return { cancel: false }
      }, 
      { urls: ["<all_urls>"] }, 
      ["blocking"]
    );
  }

  // 监听并收集来自前台传过来的消息
  function collectMessage(){
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      console.log(request);
      // if (request.greeting == "hello")//判断是否为要处理的消息
      //     sendResponse({farewell: "goodbye"});
      sendResponse({farewell: "goodbye"});
    });
  }

  function syncBlockSetting(){
    post(serviceHost + '/plugin/block', {}, (res) => {
      if(res.code !== 'SUCCESS'){
        console.log(res);
        return;
      }
      if(!res.data){
        return;
      }
      config = res.data;
      config.white_list = config.white_list.split(',');
      config.black_list = config.black_list.split(',');
      console.log(config)
    }, (error) => {
      console.log(error);
    });
  }

  function rsaEncode(plainText){
    var pubKey = `-----BEGIN PUBLIC KEY-----
    MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIY9/ZRirUo7bcnjr939dpJu3yjh+TNe
    Jhjn1Y4LMWhaNalE7A95pNLRupvQfEVAHAFGwJeJtmXcJcmPN+xuvP8CAwEAAQ==
    -----END PUBLIC KEY-----`;
    var encrypt_rsa = new JSEncrypt.RSAKey();
    encrypt_rsa = JSEncrypt.KEYUTIL.getKey(pubKey);
    var encStr = encrypt_rsa.encrypt(plainText);
    encStr = JSEncrypt.hex2b64(encStr);
    return encStr;
  }
  


  function post(url, data, success, error){
    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    request.send(JSON.stringify(data));
    request.onload = e => {
      var status = request.status;
      if(status === 200 || status === 304){
        success ? success(JSON.parse(request.responseText)) : console.log(request.responseText);
        return;
      }
      error ? error(e) : console.log(e);
    }
    request.onloadend = () => {

    }

    request.onerror = e => {
      console.log('request error', e);
    }

    request.ontimeout = e => {
      console.log('request timeout', e)
    }

    request.onreadystatechange = () => {
      
    }
  }

})();