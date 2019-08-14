$(function() {
	var serviceHost = 'http://192.168.82.101:8071';

	var $form = $('.form'), $info = $('.info');
	bindBlockStatus();
	initEvents();

	function initEvents(){
		$('#btnActive').click(e => {
			var params = {
				mac_addr: window.localStorage.getItem('mac'),
				code: $.trim($("#txtCode").val())
			};
			if(!params.code){
				$("#pCode").find('.msg').text('激活码不能为空');
				$("#pCode").addClass('err');
				return;
			}
			$.post(serviceHost +'/plugin/active', params, function(res){
				if(res.code != 'SUCCESS'){
					console.log(res);
					return;
				}
				localStorage.setItem('blockData', JSON.stringify(res.data));
				$form.hide();
				$info.addClass('success').show();
				chrome.extension.sendMessage({type:'GET_SETTING'}, function(response) { 
					console.log(response); 
				});
			});	

		// backend 有异步请求时，这里的回调不会等异步请求到结果再触发
		// 	chrome.extension.sendMessage({type:'TO_ACTIVE', code:}, function(response) { 
		// 		console.log(response); 
		//  });
		});

		$("#txtCode").on('input', e => {
			$("#pCode").find('.msg').text('');
			$("#pCode").removeClass('err');
		})
	}

	function bindBlockStatus(){
		var blockData = JSON.parse(localStorage.getItem('blockData'));
		if(!blockData || !blockData.tokenStr){
			$form.show();
			return;
		}
		$.post(serviceHost +'/plugin/status', {token: blockData.tokenStr}, function(res){
			if(res.code != 'SUCCESS'){
				console.log(res);
				return;
			}
			// 1已激活  2 未激活  3已失效
			var status = res.data.status;
			if(status == 2){ 
				$form.show();
				localStorage.removeItem('blockData');
				return;
			}
			localStorage.setItem('blockData', JSON.stringify(res.data));
			$info.find('.stime').text(res.data.start_time);
			$info.find('.etime').text(res.data.end_time);
			if(status == 1){
				$info.find('.status').text('已激活').addClass('success');
				$info.show();
				return;
			}
			if(status == 3){
				$info.find('.status').text('已过期').addClass('expire');
				$info.show();
				return;
			}
		});	
	}


	//测试前台掉后台
	function getPluginStatus(){
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
			console.log('tabs', tabs)
			chrome.tabs.sendMessage(tabs[0].id, {cmd:'GET_STATUS'}, function(res){
				console.log(res)
			});
		});
	}



	// 加载设置
	var defaultConfig = {color: 'white'}; // 默认配置
	chrome.storage.sync.get(defaultConfig, function(items) {
		document.body.style.backgroundColor = items.color;
	});

	// 初始化国际化
	$('#test_i18n').html(chrome.i18n.getMessage("helloWorld"));


});

// 打开后台页
$('#open_background').click(e => {
	window.open(chrome.extension.getURL('background.html'));
});

// 调用后台JS
$('#invoke_background_js').click(e => {
	var bg = chrome.extension.getBackgroundPage();
	bg.testBackground();
});

// 获取后台页标题
$('#get_background_title').click(e => {
	var bg = chrome.extension.getBackgroundPage();
	alert(bg.document.title);
});

// 设置后台页标题
$('#set_background_title').click(e => {
	var title = prompt('请输入background的新标题：', '这是新标题');
	var bg = chrome.extension.getBackgroundPage();
	bg.document.title = title;
	alert('修改成功！');
});

// 自定义窗体大小
$('#custom_window_size').click(() => {
	chrome.windows.getCurrent({}, (currentWindow) => {
		var startLeft = 10;
		chrome.windows.update(currentWindow.id, 
		{
			left: startLeft * 10,
			top: 100,
			width: 800,
			height: 600
		});
		var inteval = setInterval(() => {
			if(startLeft >= 40) clearInterval(inteval);
			chrome.windows.update(currentWindow.id, {left: (++startLeft) * 10});
		}, 50);
	});
});

// 最大化窗口
$('#max_current_window').click(() => {
	chrome.windows.getCurrent({}, (currentWindow) => {
		// state: 可选 'minimized', 'maximized' and 'fullscreen' 
		chrome.windows.update(currentWindow.id, {state: 'maximized'});
	});
});


// 最小化窗口
$('#min_current_window').click(() => {
	chrome.windows.getCurrent({}, (currentWindow) => {
		// state: 可选 'minimized', 'maximized' and 'fullscreen' 
		chrome.windows.update(currentWindow.id, {state: 'minimized'});
	});
});

// 打开新窗口
$('#open_new_window').click(() => {
	chrome.windows.create({state: 'maximized'});
});

// 关闭全部
$('#close_current_window').click(() => {
	chrome.windows.getCurrent({}, (currentWindow) => {
		chrome.windows.remove(currentWindow.id);
	});
});

// 新标签打开网页
$('#open_url_new_tab').click(() => {
	chrome.tabs.create({url: 'https://www.baidu.com'});
});

// 当前标签打开网页
$('#open_url_current_tab').click(() => {
	getCurrentTabId(tabId => {
		chrome.tabs.update(tabId, {url: 'http://www.so.com'});
	});
});

// 获取当前标签ID
$('#get_current_tab_id').click(() => {
	getCurrentTabId(tabId => {
		alert('当前标签ID：' + tabId);
	});
});

// 高亮tab
$('#highlight_tab').click(() => {
	chrome.tabs.highlight({tabs: 0});
});

// popup主动发消息给content-script
$('#send_message_to_content_script').click(() => {
	sendMessageToContentScript('你好，我是popup！', (response) => {
		if(response) alert('收到来自content-script的回复：'+response);
	});
});

// 监听来自content-script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
	console.log('收到来自content-script的消息：');
	console.log(request, sender, sendResponse);
	sendResponse('我是popup，我已收到你的消息：' + JSON.stringify(request));
});

// popup与content-script建立长连接
$('#connect_to_content_script').click(() => {
	getCurrentTabId((tabId) => {
		var port = chrome.tabs.connect(tabId, {name: 'test-connect'});
		port.postMessage({question: '你是谁啊？'});
		port.onMessage.addListener(function(msg) {
			alert('收到长连接消息：'+msg.answer);
			if(msg.answer && msg.answer.startsWith('我是'))
			{
				port.postMessage({question: '哦，原来是你啊！'});
			}
		});
	});
});

// 获取当前选项卡ID
function getCurrentTabId(callback)
{
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
	{
		if(callback) callback(tabs.length ? tabs[0].id: null);
	});
}

// 这2个获取当前选项卡id的方法大部分时候效果都一致，只有少部分时候会不一样
function getCurrentTabId2()
{
	chrome.windows.getCurrent(function(currentWindow)
	{
		chrome.tabs.query({active: true, windowId: currentWindow.id}, function(tabs)
		{
			if(callback) callback(tabs.length ? tabs[0].id: null);
		});
	});
}

// 向content-script主动发送消息
function sendMessageToContentScript(message, callback)
{
	getCurrentTabId((tabId) =>
	{
		chrome.tabs.sendMessage(tabId, message, function(response)
		{
			if(callback) callback(response);
		});
	});
}

// 向content-script注入JS片段
function executeScriptToCurrentTab(code)
{
	getCurrentTabId((tabId) =>
	{
		chrome.tabs.executeScript(tabId, {code: code});
	});
}


// 演示2种方式操作DOM

// 修改背景色
$('#update_bg_color').click(() => {
	executeScriptToCurrentTab('document.body.style.backgroundColor="red";')
});

// 修改字体大小
$('#update_font_size').click(() => {
	sendMessageToContentScript({cmd:'update_font_size', size: 42}, function(response){});
});

// 显示badge
$('#show_badge').click(() => {
	chrome.browserAction.setBadgeText({text: 'New'});
	chrome.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 255]});
});

// 隐藏badge
$('#hide_badge').click(() => {
	chrome.browserAction.setBadgeText({text: ''});
	chrome.browserAction.setBadgeBackgroundColor({color: [0, 0, 0, 0]});
});

// 显示桌面通知
$('#show_notification').click(e => {
	chrome.notifications.create(null, {
		type: 'image',
		iconUrl: 'img/icon.png',
		title: '祝福',
		message: '骚年，祝你圣诞快乐！Merry christmas!',
		imageUrl: 'img/sds.png'
	});
});

$('#check_media').click(e => {
	alert('即将打开一个有视频的网站，届时将自动检测是否存在视频！');
	chrome.tabs.create({url: 'http://www.w3school.com.cn/tiy/t.asp?f=html5_video'});
});