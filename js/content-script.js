// 注意，必须设置了run_at=document_start 此段代码才会生效
// document.addEventListener('DOMContentLoaded', function(){
  // $.post('http://wap.jc2.haikr.com.cn/hk-insurance-shop/api/insuranceCommon/getNowTime', function(res){
	// 	chrome.runtime.sendMessage(res, function(response) {
  //     console.log('收到来自后台的回复：' + response);
  //   });
	// });
// });
// console.log(window.event)
//   window.addEventListener('beforeunload', function(){
//     localStorage.setItem("beforeunload","addEventListener.beforeunload");
//     window.event.returnValue = '';
//   })

// window.onbeforeunload = function(){
//   alert(2222)
//   if(event.clientX > document.body.clientWidth && event.clientY < 0 || event.altKey){
//     window.event.returnValue = '';
//   }
// }
// document.onbeforeunload = function(){
//   return false;
// }

//  document.onkeydown = function()
// {
//   alert(event.keyCode)
//     if ( event.keyCode==116)
//     {
//         event.keyCode = 0;
//         event.cancelBubble = true;
//         return false;
//     }
// }

// window.onbeforeunload = function() {return "确定要离开此网站吗？"; };