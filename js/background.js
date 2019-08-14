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
    getMac();
    extMessage();
    syncBlockSetting();
    // 10分钟同步一次配置
    setInterval(() => {
      syncBlockSetting();
    }, 1000 * 60 * 10);
  }

  function getMac(){
    var port = chrome.runtime.connectNative('com.google.chrome.extends.getmac.echo');
	  port.onMessage.addListener(function(msg){
      window.localStorage.setItem('mac', msg.text);
      port.disconnect();
    });
	  port.onDisconnect.addListener(function(){
      console.log('onDisconnect')
      port = null;
    });
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
  function contentMessage(){
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      console.log(222222)
      console.log(request);
      // if (request.greeting == "hello")//判断是否为要处理的消息
      //     sendResponse({farewell: "goodbye"});
      sendResponse({status:'actived'});
    });
  }

  // 监听来自 popup 的消息 
  function extMessage(){
    chrome.extension.onMessage.addListener(function(request, sender, sendResponse){
      if(request.cmd === 'GET_SETTING'){
        syncBlockSetting();
      } 
      sendResponse({cmd:'GET_SETTING', code:'SUCCESS'})
    })
  }

  

  // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  //   console.log(tabs)
  //    chrome.tabs.sendMessage(tabs[0].id, {test: 'test'} , function(response) {
  //        //alert("baground  respone");
  //       console.log(response)
  //    });
  // });

  function syncBlockSetting(){
    var blockData = JSON.parse(localStorage.getItem('blockData'));
    axiosPost(serviceHost + '/plugin/block', {token: blockData.tokenStr }, (res) => {
      if(res.code !== 'SUCCESS'){
        console.log(res);
        config.white_list.length = 0;
        config.black_list.length = 0;
        return;
      }
      config = res.data;
      config.white_list = config.white_list.split(',');
      config.black_list = config.black_list.split(',');
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

  function axiosPost(url, data, success, error){
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

  function axiosGet(url, success, error){
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    request.send();
    request.onload = e => {
      var status = request.status;
      if(status === 200 || status === 304){
        success ? success(JSON.parse(request.responseText)) : console.log(request.responseText);
        return;
      }
      if(status === 206){ // 206：Partial Content 表示目标url 上的部分资源
        var resText = request.responseText.substring(request.responseText.indexOf('(')+1, request.responseText.length -1);
        success ? success(JSON.parse(resText)) : console.log(resText);
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



  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // 爬取百度文库数据
  function baiduWenku(url){
    // var url = "https://wkbjcloudbos.bdimg.com/v1/docconvert8344/wk/b026ba7f3de0320dc365757d2f92828f/0.json?responseContentType=application%2Fjavascript&responseCacheControl=max-age%3D3888000&responseExpires=Sat%2C%2007%20Sep%202019%2013%3A29%3A03%20%2B0800&authorization=bce-auth-v1%2Ffa1126e91489401fa7cc85045ce7179e%2F2019-07-24T05%3A29%3A03Z%2F3600%2Fhost%2Ff8b67ecae670a0508aa3e8551b2a3c0b788886cc3dfed7bad9d2fd6c94e173ee&x-bce-range=0-94927&token=eyJ0eXAiOiJKSVQiLCJ2ZXIiOiIxLjAiLCJhbGciOiJIUzI1NiIsImV4cCI6MTU2Mzk0OTc0MywidXJpIjp0cnVlLCJwYXJhbXMiOlsicmVzcG9uc2VDb250ZW50VHlwZSIsInJlc3BvbnNlQ2FjaGVDb250cm9sIiwicmVzcG9uc2VFeHBpcmVzIiwieC1iY2UtcmFuZ2UiXX0%3D.voQpR2R24UUIq8sLX1vE7GAUVG%2F0gzztjilnhBzDrgo%3D.1563949743";
    axiosGet(url+'&cancel=true', function(res){
      let resData = res.body.map(item => {
        if(item.t != 'word'){
          return '';
        }
        return item.c;
      })
      console.log(resData.join(''));
    }, function(err){
      console.log(2222222)
      console.log(err)
    })
  }

  function blockWenku(){
    //监听所有请求
    chrome.webRequest.onBeforeRequest.addListener((details) => {
          var url = details.url;
          // 爬取百度文库数据
          if(url.indexOf('0.json') > -1 && url.indexOf('&cancel=true') === -1){
            baiduWenku(url)
            return { cancel: false };
          }
          return { cancel: false }
      }, 
      { urls: ["<all_urls>"] }, 
      ["blocking"]
    );
  }

})();