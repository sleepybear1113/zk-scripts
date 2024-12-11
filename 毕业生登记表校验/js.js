// ==UserScript==
// @name         自考毕业生登记表校验
// @namespace    http://tampermonkey.net/
// @version      2024-12-11
// @description  对自考毕业生登记表进行校验，校验在职状态、职务、曾用名、政治面貌、邮编等字段
// @author       sleepybear@jxksy
// @match        https://zk.zjzs.net:81/CertificateManage/FilePrintManage/filePrint.aspx*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zjzs.net
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    class VerifyConfig {
        constructor(props) {
            this["团员年龄判断"] = props["团员年龄判断"] != null ? props["团员年龄判断"] : true;
            this["政治面貌"] = props["政治面貌"] != null ? props["政治面貌"] : true;
            this["是否有曾用名"] = props["是否有曾用名"] != null ? props["是否有曾用名"] : true;
            this["学历"] = props["学历"] != null ? props["学历"] : true;
            this["职务"] = props["职务"] != null ? props["职务"] : true;
            this["邮编"] = props["邮编"] != null ? props["邮编"] : true;
            this["单位"] = props["单位"] != null ? props["单位"] : true;
            this["在职状态单位对应"] = props["在职状态单位对应"] != null ? props["在职状态单位对应"] : true;
            this["民族"] = props["民族"] != null ? props["民族"] : true;
        }
    }

    class Person {
        constructor(props) {
            this["专业代码"] = props["专业代码"];
            this["姓名"] = props["姓名"];
            this["身份证号"] = props["身份证号"];
            this["准考证号"] = props["准考证号"];
            this["政治面貌"] = props["政治面貌"];
            this["曾用名"] = props["曾用名"];
            this["民族"] = props["民族"];
            this["出生年月"] = props["出生年月"];
            this["是否在职"] = props["是否在职"];
            this["现任职务、职称或工种"] = props["现任职务、职称或工种"];
            this["参加自学考试前学历"] = props["参加自学考试前学历"];
            this["工作单位"] = props["工作单位"];
            this["联系电话"] = props["联系电话"];
            this["邮政编码"] = props["邮政编码"];
            this["通讯地址"] = props["通讯地址"];

            this.age = null;

            this.verifyMessage = [];
        }

        build() {
            // build age, ymd 2003-03-14 to float age，精确到小数点后 1 位，直接计算总天数 / 365.25
            let now = new Date();
            let birth = new Date(this["出生年月"].value);
            let diff = now - birth;
            this.age = diff / (1000 * 60 * 60 * 24 * 365.25);
            this.age = this.age.toFixed(1);
        }

        verify(verifyConfig) {
            // 年龄大于 28 岁并且还是共青团员的不通过
            if (verifyConfig["团员年龄判断"] && this.age > 28 && this["政治面貌"].value === "团员") {
                this.verifyMessage.push("超年龄团员");
            }
            if (verifyConfig["团员年龄判断"] && this.age < 18 && this["政治面貌"].value === "党员") {
                this.verifyMessage.push("未到18岁的党员");
            }
            if (verifyConfig["政治面貌"] && !this["政治面貌"].value) {
                this.verifyMessage.push("政治面貌为空");
            }
            if (verifyConfig["学历"] && !this["参加自学考试前学历"].value) {
                this.verifyMessage.push("学历为空");
            }
            // 有曾用名提醒
            if (verifyConfig["是否有曾用名"] && this["曾用名"].value !== "无") {
                this.verifyMessage.push("有曾用名");
            }
            // 现任职务、职称或工种为空
            if (verifyConfig["职务"] && !this["现任职务、职称或工种"].value) {
                this.verifyMessage.push("职务为空");
            }
            // 邮编为空
            if (verifyConfig["邮编"] && !this["邮政编码"].value) {
                this.verifyMessage.push("邮编为空");
            }
            // 民族校验
            if (verifyConfig["民族"] && !this["民族"].value) {
                this.verifyMessage.push("民族为空");
            }
            if (verifyConfig["民族"] && this["民族"].value === "其他") {
                this.verifyMessage.push("民族为其他");
            }
            // 在职但是工作单位名称字样不包含（学校、学院、大学）字样
            let validList = ["学校", "学院", "大学"];
            if (verifyConfig["在职状态单位对应"]) {
                if (this["是否在职"].value === "否") {
                    let valid = false;
                    for (let i = 0; i < validList.length; i++) {
                        if (this["工作单位"].value.indexOf(validList[i]) >= 0) {
                            valid = true;
                            break;
                        }
                    }
                    if (!valid) {
                        this.verifyMessage.push("非在职但不为学校")
                    }

                    // 非在职且职务可能有问题
                    if (verifyConfig["职务"] && this["现任职务、职称或工种"].value && this["现任职务、职称或工种"].value !== "学生" && this["现任职务、职称或工种"].value.indexOf("失业") < 0) {
                        this.verifyMessage.push("非在职且职业可能有问题");
                    }
                } else if (this["是否在职"].value === "是") {
                    let valid = false;
                    for (let i = 0; i < validList.length; i++) {
                        if (this["工作单位"].value.indexOf(validList[i]) >= 0) {
                            valid = true;
                            break;
                        }
                    }
                    if (valid) {
                        this.verifyMessage.push("在职但为学校单位")
                    }
                }
            }
        }
    }

    class NodeValue {
        constructor(props) {
            this.value = props.value;
            this.node = props.node;
        }
    }

    function runMyScript() {
        // 在 head 中添加一个 script
        let script = document.createElement("script");
        script.innerText = saveVerifyConfig.toString();
        document.getElementsByTagName("head")[0].appendChild(script);

        // 获取所有的 table
        let tables = document.getElementsByTagName("table");
        let mainTables = [];
        for (let i = 0; i < tables.length; i++) {
            let table = tables[i];
            if (table.innerHTML.indexOf("专业代码") >= 0) {
                mainTables.push(table);
            }
        }

        if (tables.length === 0) {
            // 没有找到 table
            return false;
        }

        let keys = ["专业代码", "姓名", "身份证号", "政治面貌", "曾用名", "民族", "出生年月", "是否在职"
            , "现任职务、职称或工种", "参加自学考试前学历", "工作单位", "联系电话", "邮政编码", "通讯地址"];

        let zkScriptIdKey = "zk-script-no-";
        let persons = [];
        for (let i = 0; i < mainTables.length; i++) {
            let table = mainTables[i];
            let person = new Person({});
            let trs = table.getElementsByTagName("tr");

            // 获取准考证号
            for (let j = 1; j < trs.length; j++) {
                let tr = trs[j];
                let tds = tr.getElementsByTagName("td");
                let key = "准考证号";
                for (let k = 0; k < tds.length; k++) {
                    let td = tds[k];
                    if (td.innerHTML.indexOf(key) >= 0) {
                        let value = tds[k + 1].innerText;
                        if (value) {
                            person[key] = value;
                            break;
                        }
                    }
                }
                if (!person[key]) {
                    continue;
                }
                persons.push(person);
                break;
            }

            if (!person["准考证号"]) {
                continue;
            }

            table.parentNode.id = zkScriptIdKey + i;

            // 提取信息，放入准考证号对应的 person 中
            for (let j = 0; j < trs.length; j++) {
                let tr = trs[j];
                let tds = tr.getElementsByTagName("td");
                for (let k = 0; k < tds.length; k++) {
                    let td = tds[k];
                    let innerHTML = td.innerHTML;
                    for (let l = 0; l < keys.length; l++) {
                        let key = keys[l];
                        if (innerHTML.indexOf(key) >= 0) {
                            let td1 = tds[k + 1];
                            person[key] = new NodeValue({value: td1.innerText, node: td1});
                        }
                    }
                }
            }

            person.build();
        }

        // 加载配置
        let verifyConfigStr = localStorage.getItem("verify-zk-config");
        let verifyConfig = null;
        if (!verifyConfigStr) {
            verifyConfig = new VerifyConfig({});
        } else {
            verifyConfig = new VerifyConfig(JSON.parse(verifyConfigStr));
        }

        persons.forEach(p => p.verify(verifyConfig));

        // 统计专业代码去重数量
        let codes = {};
        let schools = {};
        persons.forEach(p => {
            codes[p["专业代码"].value] = 1;
            schools[p["工作单位"].value] = 1;
        });
        let codeCount = Object.keys(codes).length;
        let schoolCount = Object.keys(schools).length;

        // 在 header 的 style 中添加一个 css 属性，打印时不显示
        let style = document.getElementsByTagName("style")[0];
        style.innerText += `@media print {
        .verify-no-print {
            display: none;
        }
    }`;

        // 将页面自带的打印按钮在打印时隐藏
        let body = document.getElementsByTagName("body")[0];
        let divs = body.getElementsByTagName("div");
        for (let i = 0; i < divs.length; i++) {
            let innerHTML = divs[i].innerHTML;
            if (innerHTML.indexOf("filePrint();") >= 0) {
                // 添加 classname = verify-no-print
                divs[i].className = "verify-no-print";
                break;
            }
        }

        let firstDiv = null;
        for (let i = 0; i < divs.length; i++) {
            let innerHTML = divs[i].innerHTML;
            if (innerHTML.indexOf("type=\"hidden\"") >= 0) {
                firstDiv = divs[i];
                break;
            }
        }
        if (!firstDiv) {
            return false;
        }

        // firstDiv 里面追加一个 id = verify-zk 的 div
        let verifyDiv = document.createElement("div");
        verifyDiv.id = "verify-zk";
        // 添加一个 classname = verify-no-print
        verifyDiv.className = "verify-no-print";
        // text-align: left;
        verifyDiv.style.textAlign = "left";
        firstDiv.appendChild(verifyDiv);

        let innerHTML = `<h3>校验提示（该部分打印时不显示）</h3>
    <p><button onclick="window.print();">打印</button></p>
    <div id="verify-zk-config-checkbox"></div>
    <p>共有毕业考生数量 ${persons.length} 人，专业数 ${codeCount} 个，工作单位数 ${schoolCount} 个。</p>`;
        // 需要用 ol 来显示错误信息
        innerHTML += `<ol>`;

        for (let i = 0; i < persons.length; i++) {
            let person = persons[i];
            if (person.verifyMessage.length === 0) {
                continue;
            }
            let message = person.verifyMessage.join("，");
            // 需要用 ol 来显示错误信息
            innerHTML += `<li>序号：[<a href="#${zkScriptIdKey}${i}">${(i + 1) < 10 ? ("0" + (i + 1)) : (i + 1)}] ${person["姓名"].value.padEnd(4, "　")}</a>[${person["准考证号"]}]：${message}</li>`;
        }
        innerHTML += `</ol>`;
        document.getElementById("verify-zk").innerHTML = innerHTML + "<hr>";

        let verifyZkConfigCheckboxDiv = document.getElementById("verify-zk-config-checkbox");
        verifyZkConfigCheckboxDiv.innerHTML = `校验配置：
    |<label>团员年龄判断<input type="checkbox" id="verify-zk-config-团员年龄判断" ${verifyConfig["团员年龄判断"] ? "checked" : ""}></label>
    |<label>政治面貌<input type="checkbox" id="verify-zk-config-政治面貌" ${verifyConfig["政治面貌"] ? "checked" : ""}></label>
    |<label>是否有曾用名<input type="checkbox" id="verify-zk-config-是否有曾用名" ${verifyConfig["是否有曾用名"] ? "checked" : ""}></label>
    |<label>学历<input type="checkbox" id="verify-zk-config-学历" ${verifyConfig["学历"] ? "checked" : ""}></label>
    |<label>职务<input type="checkbox" id="verify-zk-config-职务" ${verifyConfig["职务"] ? "checked" : ""}></label>
    |<label>邮编<input type="checkbox" id="verify-zk-config-邮编" ${verifyConfig["邮编"] ? "checked" : ""}></label>
    |<label>单位<input type="checkbox" id="verify-zk-config-单位" ${verifyConfig["单位"] ? "checked" : ""}></label>
    |<label>在职状态单位对应<input type="checkbox" id="verify-zk-config-在职状态单位对应" ${verifyConfig["在职状态单位对应"] ? "checked" : ""}></label>
    |<label>民族<input type="checkbox" id="verify-zk-config-民族" ${verifyConfig["民族"] ? "checked" : ""}></label>
    |<label><button onclick="saveVerifyConfig(); return false;">保存配置</button></p>`;
    }

    function saveVerifyConfig() {
        let verifyConfig = {
            "团员年龄判断": document.getElementById("verify-zk-config-团员年龄判断").checked,
            "政治面貌": document.getElementById("verify-zk-config-政治面貌").checked,
            "是否有曾用名": document.getElementById("verify-zk-config-是否有曾用名").checked,
            "学历": document.getElementById("verify-zk-config-学历").checked,
            "职务": document.getElementById("verify-zk-config-职务").checked,
            "邮编": document.getElementById("verify-zk-config-邮编").checked,
            "单位": document.getElementById("verify-zk-config-单位").checked,
            "在职状态单位对应": document.getElementById("verify-zk-config-在职状态单位对应").checked,
            "民族": document.getElementById("verify-zk-config-民族").checked,
        };
        localStorage.setItem("verify-zk-config", JSON.stringify(verifyConfig));
    }

    runMyScript();
})();