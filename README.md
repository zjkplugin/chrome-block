
chrome 插件开发需求
插件名称：chrome_blocker
主要功能点：
    1、支持屏蔽指定某个，某些、某类型的网站；（类似浏览器黑名单）
    2、支持屏蔽所有网站，但某个、某些、某类型的网站可以访问；（类似浏览器白名单）
    3、支持远程从远程服务器获取白名单或黑名单；(插件可以异步获取远程服务器数据)
    4、有一个管理页面，可以维护这些白名单或黑名单数据;(NodeJS 起服务，可以存在mysql库，或json文件中)

参考资料：
    https://developer.chrome.com/extensions/getstarted

开发周期：
    07-05  实现功能点1、2
    07-12  实现功能点3、4
    
chrome 离线安装包
    https://tools.shuax.com/chrome/
    使用安装包，可以禁用 "请停用以开发者模式运行的扩展程序”提示