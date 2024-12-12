// ==UserScript==
// @name         自考毕业生花名册打印分页纠错脚本
// @namespace    http://tampermonkey.net/
// @version      2024-12-12
// @description  用于自考花名册打印，当一次性打印大量页面的时候，可能会出现页面错位，用该脚本来纠正页面错位。
// @author       You
// @match        https://zk.zjzs.net:81/Report/Graduation/graduateRoster.aspx*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zjzs.net
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    // 筛选出包含“毕业生花名册”的 div
    let divList = Array.from(document.querySelectorAll("div")).filter(div => div.innerHTML.includes('毕业生花名册'));
    // 去掉最后一个，然后为所有花名册的 div 添加 style 分页防止错位
    divList.pop();
    divList.forEach(div => div.style.pageBreakAfter = "always");
})();