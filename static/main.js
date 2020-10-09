// import { config } from './config.js'
// import {fs} from 'fs';
// import * as fs from 'fs';

let totalIndex = 0;
let allMessages = [];

let config = {
    command: 'subday',
    prefix: '!',
    channel: '',
    sub: true,
    vip: false,
    mod: true,
    all: false,
    connected: false,
    messages: []
}

let options = {
    options: {
        debug: false
    },
    connection: {
        secure: true,
        reconnect: true
    },
};

let client = new tmi.client(options);

function connectToTwitch() {

    disconnectFromTwitch();
    
    config.connected = false;

    if(client == null){
        client = new tmi.client(options);
        console.log("Creating new client")
    }
    // Connect the client to the server..
    client.connect().then(
        (msg) => {
            console.log(msg)

            client.join(config.channel).then((msg) => { console.log(`Connected to Twitch [${config.channel}]`); updateConnectStatus(true) })
                .catch(msg => { console.error(msg); updateConnectStatus(false) });

                // client.on("connected", () => { console.log(`Connected to Twitch [${config.channel}]`);})
    client.on("disconnected", () => { console.log(`Disconnected from Twitch`); updateConnectStatus(false) });

    client.on("message", (channel, userstate, message, self) => {processMessage(channel, userstate, message, self)})
        }).catch(msg => { console.error(msg); updateConnectStatus(false) });

    
}

function disconnectFromTwitch() {
    // client.part(config.channel);
    // if (config.connected)
    if(client == null) return;
    client.disconnect().then(
        () => {
            updateConnectStatus(false);
            console.log('Disconnected');
        })
    client = null;
        
}


function processMessage(channel, userstate, message, self) {

    console.log(config)
    console.log(userstate)
    // console.log(userstate);
    let words = message.split(' ');
    if (!message.startsWith(config.prefix)
        || words[0].trim().substr(1).toLowerCase() != config.command.trim().toLowerCase()
        || words.length == 1) return;

    if (userstate['badge-info'] == null && !config.all) return;

    console.log('here')

    let user = {
        username: userstate.username,
        isSub: userstate.subscriber || userstate.badges.founder != null,
        isBroadcaster: userstate.badges.broadcaster == '1',
        isMod: userstate.mod,
        isVip: userstate.badges.vip != null,
        msgID: userstate.id,
        userID: userstate['user-id']
    }

    if (
        ((config.sub == true || config.sub == 'true') && user.isSub) 
        || ((config.mod == true || config.mod == 'true') && user.isMod) 
        || ((config.vip == true || config.vip == 'true') && user.isVip) 
        || user.isBroadcaster || (config.all == true || config.all == 'true'))
        
        addToList(user, words.slice(1).join(" "))

}


function addToList(user, msg) {

    let images = ''

    if(config.messages.some(m => m.id == user.msgID)) return;

   
    let newMsg = {
        id: user.msgID,
        message: msg,
        badges: [],
        username: user.username,
        userID: user.userID,
        msgID: user.msgID
    }

    if(config.messages.some(m => m.userID == user.userID))  {
        let oldMsg = config.messages.find(m => m.userID == user.userID);
        if(oldMsg){
            oldMsg.message = msg
            oldMsg.username = user.username;

            if (user.isSub) oldMsg.badges.push('sub')
            if (user.isBroadcaster) oldMsg.badges.push('broadcaster')
            if (user.isMod) oldMsg.badges.push('mod')
            if (user.isVip) oldMsg.badges.push('vip')

            console.log(oldMsg);
            localStorage.setItem('subDay_' + 'messages', JSON.stringify(config.messages));

            loadListToTable();
            return;
            
        }
    }

    if (user.isSub) newMsg.badges.push('sub')
    if (user.isBroadcaster) newMsg.badges.push('broadcaster')
    if (user.isMod) newMsg.badges.push('mod')
    if (user.isVip) newMsg.badges.push('vip')


    if (user.isSub) images += `<img src='./images/sub.png' class='badge-image'/>`
    if (user.isBroadcaster) images += `<img src='./images/broadcaster.png' class='badge-image'/>`
    if (user.isMod) images += `<img src='./images/mod.png' class='badge-image'/>`
    if (user.isVip) images += `<img src='./images/vip.png' class='badge-image'/>`



    var newNode = document.createElement('tr');
    newNode.className = 'row'

    newNode.dataset.id = newMsg.id;

    newNode.innerHTML =
        `<th  class='col-1'>${config.messages.length + 1}</th>
    <td class='col-3'>${newMsg.username}</td>
    <td class='col-4'>${newMsg.message}</td>
    <td class='col-3'>${images}</td>
    <td class="col-1">
    <button class="btn btn-outline-danger" type="button" onclick="removeMessage('${newMsg.id}')"><i class="far fa-trash-alt"></i></button>
    </td>`;
    document.getElementById("messagesList").appendChild(newNode);

    // fs.appendFileSync('../list.txt', combinedMessage);
    // allMessages = localStorage.getItem('subDay_' + 'messages')
    // let msgArray = [];
    // if (allMessages)
    //     msgArray = JSON.parse(allMessages);

    // msgArray.push(newMsg)
    config.messages.push(newMsg)
    console.log("Setting Item")
    localStorage.setItem('subDay_' + 'messages', JSON.stringify(config.messages));


}

function handleCheckBox(checkBoxID) {
    $(`#${checkBoxID}`).change(function () {
        localStorage.setItem('subDay_' + checkBoxID, this.checked);
        updateConfig();
    });
}



$(document).ready(function () {

    updateConfig()
    updateFields()


    loadListToTable()

    handleCheckBox('subCheckBox')
    handleCheckBox('modCheckBox')
    handleCheckBox('vipCheckBox')
    handleCheckBox('allCheckBox')


    if ($("#channel").val() == '') {
        $("#channel").toggleClass('is-invalid')

        if (!$('.connect-invalid-feedback').hasClass('d-block'))
            $('.connect-invalid-feedback').addClass('d-block')
    } else {
        connectToTwitch();
        $('.connect-invalid-feedback').removeClass('d-block')
    }
    if ($("#command").val() == '') {
        $("#command").toggleClass('is-invalid')
    }
    if ($("#prefix").val() == '') {
        $("#prefix").toggleClass('is-invalid')
    }


    $("#command").on('input propertychange', function () {
        if ($(this).val() == '')
            $(this).toggleClass('is-invalid')
        else
            $(this).removeClass('is-invalid')
        localStorage.setItem('subDay_' + 'command', this.value);
        updateConfig();
    })

    $("#prefix").on('input propertychange', function () {
        if ($(this).val() == '')
            $(this).toggleClass('is-invalid')
        else
            $(this).removeClass('is-invalid')
        localStorage.setItem('subDay_' + 'prefix', this.value);
        updateConfig();
    })

    $("#channel").on('input propertychange', function () {
        disconnectFromTwitch();
        if ($(this).val() == '') {
            $(this).toggleClass('is-invalid')

            if (!$('.connect-invalid-feedback').hasClass('d-block'))
                $('.connect-invalid-feedback').addClass('d-block')
        }
        else {
            $(this).removeClass('is-invalid')
            $('.connect-invalid-feedback').removeClass('d-block')
        }

        localStorage.setItem('subDay_' + 'channel', this.value);
        updateConfig();
    })


    $('#connect').click(function () {
        connectToTwitch()
    })

});


function updateConfig() {
    if (localStorage.getItem('subDay_' + 'subCheckBox')) config.sub = localStorage.getItem('subDay_' + 'subCheckBox')
    if (localStorage.getItem('subDay_' + 'modCheckBox')) config.mod = localStorage.getItem('subDay_' + 'modCheckBox')
    if (localStorage.getItem('subDay_' + 'vipCheckBox')) config.vip = localStorage.getItem('subDay_' + 'vipCheckBox')
    if (localStorage.getItem('subDay_' + 'allCheckBox')) config.all = localStorage.getItem('subDay_' + 'allCheckBox')
    if (localStorage.getItem('subDay_' + 'command')) config.command = localStorage.getItem('subDay_' + 'command')
    if (localStorage.getItem('subDay_' + 'prefix')) config.prefix = localStorage.getItem('subDay_' + 'prefix')
    if (localStorage.getItem('subDay_' + 'channel')) config.channel = localStorage.getItem('subDay_' + 'channel')
}


function updateFields() {
    updateCheckBox('subCheckBox')
    updateCheckBox('modCheckBox')
    updateCheckBox('vipCheckBox')
    updateCheckBox('allCheckBox')

    $("#command").val(config.command)
    $("#prefix").val(config.prefix)
    $("#channel").val(config.channel)
}

function updateCheckBox(checkBoxID) {
    if (config[checkBoxID.substr(0, 3)] == true || config[checkBoxID.substr(0, 3)] == 'true')
        $(`#${checkBoxID}`).prop('checked', true);

}

function updateConnectStatus(connected) {
    config.connected = connected;
    console.log("Update Connect Status")
    console.log(config.connected)
    if (config.connected)
        $('#connect-status').html('<i class="fas fa-check text-success"></i>')
    else {
        $('#connect-status').html('<i class="fas fa-times text-danger"></i>')
        $('.connect-invalid-feedback').toggleClass('d-none')
    }
}


function removeMessage(msgID) {
    console.log(`Remove message call for [${msgID}]`)
    let message = config.messages.find(m => m.id == msgID);
    if (message) {
        console.log("find message")
        let i = config.messages.indexOf(message);
        console.log(config.messages)
        console.log(i)

        config.messages.splice(i, 1);
        console.log(config.messages)
        localStorage.setItem('subDay_' + 'messages', JSON.stringify(config.messages));

        loadListToTable();
    }
}

function getRandomID() {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 15);
};


function loadListToTable() {

    $("#messagesList").empty();
    config.messages = [];
    if (!localStorage.getItem('subDay_' + 'messages')) return;

    let commands = JSON.parse(localStorage.getItem('subDay_' + 'messages'))

    for (let i = 0; i < commands.length; i++) {
        let msg = commands[i];
        if (!msg) return; 4
        config.messages.push(msg);

        let images = ''

        if (msg.badges.includes('sub')) images += `<img src='./images/sub.png' class='badge-image'/>`
        if (msg.badges.includes('broadcaster')) images += `<img src='./images/broadcaster.png' class='badge-image'/>`
        if (msg.badges.includes('mod')) images += `<img src='./images/mod.png' class='badge-image'/>`
        if (msg.badges.includes('vip')) images += `<img src='./images/vip.png' class='badge-image'/>`



        var newNode = document.createElement('tr');
        newNode.className = 'row'

        newNode.dataset.id = msg.id;

        newNode.innerHTML =
            `<td  class='col-1'>${i + 1}</th>
        <td class='col-3'>${msg.username}</td>
        <td class='col-4'>${msg.message}</td>
        <td class='col-3'>${images}</td>
        <td class="col-1">
    <button class="btn btn-outline-danger" type="button" onclick="removeMessage('${msg.id}')"><i class="far fa-trash-alt"></i></button>
    </td>`;

        document.getElementById("messagesList").appendChild(newNode);

    }
}


function saveTxtFile() {
    let messages = JSON.parse(localStorage.getItem('subDay_' + 'messages'))

    const today = new Date();
    
    const month = ["January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"];

    const filename = `subDay_${today.getDate()}_${month[today.getMonth()]}_${today.getFullYear()}.txt`;

    let txtData = ''
    if (messages) {
        for (let i = 0; i < messages.length; i++) {
            let m = messages[i];
            console.log(m)
            txtData += `${i}. ${m.username}[${m.badges.join('|')}] - ${m.message}\n`
        }
    }

    var blob = new Blob([txtData], { type: "text/plain;charset=utf-8" });
    saveAs(blob, filename);
}

function saveExcelFile() {
    const today = new Date();

    const month = ["January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"];

    const badges = ['sub', 'vip', 'broadcaster', 'mod'];

    const filename = `subDay_${today.getDate()}_${month[today.getMonth()]}_${today.getFullYear()}.xlsx`;
    let data = [['#', 'Username', 'Game', 'Sub', 'Vip', 'Broadcaster', 'Mod']]
    let messages = JSON.parse(localStorage.getItem('subDay_' + 'messages'))

    if (messages) {
        for (let i = 0; i < messages.length; i++) {
            let m = messages[i];
            let row = []

            row.push(i + 1)
            row.push(m.username)
            row.push(m.message)

            for (let k = 0; k < 4; k++) {
                if(m.badges.includes(badges[k]))
                row.push(true)
                else
                row.push(false)
            }

            data.push(row);
        }
    }

    const ws_name = "SubDay";

    if (typeof console !== 'undefined') console.log(new Date());
    const wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(data);

    /* add worksheet to workbook */
    XLSX.utils.book_append_sheet(wb, ws, ws_name);

    /* write workbook */
    XLSX.writeFile(wb, filename);
}


