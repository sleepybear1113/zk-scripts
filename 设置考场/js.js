// ==UserScript==
// @name         自考考场选择
// @namespace    http://tampermonkey.net/
// @version      2024-09-24
// @description  从 Excel复制考场序号，自动勾选考场
// @author       sleepybear@jxksy
// @match        https://zk.zjzs.net:81/ExaminationManage/ExamRoomSetManage/examRoomSelect.aspx*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zjzs.net
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let trList = document.getElementsByClassName("trData");
    if (!trList || trList.length === 0) {
        return;
    }

    let parent = trList[0].parentNode.parentNode.parentNode;
    let p0 = parent.children[0];
    let addInput = document.createElement("input");
    addInput.placeholder = "考场序号(从Excel复制某列)";
    addInput.id = "zk-script-rooms";
    p0.appendChild(addInput);
    let addButton = document.createElement("a");
    addButton.innerText = "勾选";
    p0.appendChild(addButton);
    addButton.onclick = function () {
        let input = document.getElementById("zk-script-rooms");
        let roomsStr = input.value;
        roomsStr = roomsStr.replace(/\n/g, " ").replace(/\t/g, " ").replace(/,/g, " ");
        let rooms = roomsStr.split(" ");
        let map = {};
        for (let i = 0; i < rooms.length; i++) {
            let room = rooms[i];
            map[room] = true;
        }
        for (let i = 0; i < trList.length; i++) {
            let tr = trList[i];
            let tdList = tr.getElementsByTagName("td");

            let checkbox = tdList[0].getElementsByTagName("input")[0];
            let no = tdList[4];
            let room = no.innerText.trim();

            if (map[room]) {
                console.log("勾选考场：" + room);
                checkbox.click();
            }
        }
        return false;
    };
})();