// ==UserScript==
// @name         自考毕业生清单添加序号
// @namespace    http://tampermonkey.net/
// @version      2024-12-11
// @description  对毕业生清单列表添加序号列，方便查看序号
// @author       sleepybear@jxksy
// @match        https://zk.zjzs.net:81/Report/Graduation/graduateList.aspx*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zjzs.net
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    document.querySelectorAll('tr#top').forEach(tr => {
        let td = tr.insertCell(0);
        td.style.width = "30px";
        td.innerText = "序号";
    });
    document.querySelectorAll('tr.trDa').forEach((tr, i) => tr.insertCell(0).innerText = String(i + 1));
})();