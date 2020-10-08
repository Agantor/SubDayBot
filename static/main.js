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


function connectToTwitch() {
    config.connected = false;
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

    // Connect the client to the server..
    client.connect().then(
        (msg) => {
            console.log(msg)

            client.join(config.channel).then((msg) => { console.log(`Connected to Twitch [${config.channel}]`); config.connected = true; updateConnectStatus() })
                .catch(msg => console.error(msg))
        }).catch(msg => { console.error(msg); config.connected = false; updateConnectStatus() });

    // client.on("connected", () => { console.log(`Connected to Twitch [${config.channel}]`);})
    client.on("disconnected", () => { console.log(`Disconnected from Twitch`); config.connected = false; updateConnectStatus() });

    client.on("message", (channel, userstate, message, self) => processMessage(channel, userstate, message, self))
}


function processMessage(channel, userstate, message, self) {

    console.log(config)
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
    }

    if ((config.sub && user.isSub) || (config.mod && user.isMod) || (config.vip && user.isVip) || user.isBroadcaster)
        addToList(user, words.slice(1).join(" "))

}


function addToList(user, msg) {

    let images = ''

    let newMsg = {
        id: getRandomID(),
        message: msg,
        badges: [],
        username: user.username
    }

    if (user.isSub) newMsg.badges.push('sub')
    if (user.isBroadcaster) newMsg.badges.push('broadcaster')
    if (user.isMod) newMsg.badges.push('mod')
    if (user.isVip) newMsg.badges.push('vip')


    if (user.isSub) images += `<img src='../images/sub.png' class='badge-image'/>`
    if (user.isBroadcaster) images += `<img src='../images/broadcaster.png' class='badge-image'/>`
    if (user.isMod) images += `<img src='../images/mod.png' class='badge-image'/>`
    if (user.isVip) images += `<img src='../images/vip.png' class='badge-image'/>`



    var newNode = document.createElement('tr');
    newNode.className = 'row'

    newNode.dataset.id = newMsg.id;

    newNode.innerHTML =
        `<th  class='col-1'>${config.messages.length + 1}</th>
    <td class='col-4'>${newMsg.username}</td>
    <td class='col-4'>${newMsg.message}</td>
    <td class='col-3'>${images}</td>`;
    document.getElementById("messagesList").appendChild(newNode);

    // fs.appendFileSync('../list.txt', combinedMessage);
    allMessages = localStorage.getItem('messages')
    let msgArray = [];
    if (allMessages)
        msgArray = JSON.parse(allMessages);

    msgArray.push(newMsg)
    config.messages.push(newMsg)
    console.log("Setting Item")
    localStorage.setItem('messages', JSON.stringify(JSON.parse(msgArray)));


}

function handleCheckBox(checkBoxID) {
    $(`#${checkBoxID}`).change(function () {
        localStorage.setItem(checkBoxID, this.checked);
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

    $("#command").on('input propertychange', function () {
        localStorage.setItem('command', this.value);
        updateConfig();
    })

    $("#prefix").on('input propertychange', function () {
        localStorage.setItem('prefix', this.value);
        updateConfig();
    })

    $("#channel").on('input propertychange', function () {
        localStorage.setItem('channel', this.value);
        updateConfig();
    })


    $('#connect').click(function () {
        connectToTwitch()
    })

});


function updateConfig() {
    if (localStorage.getItem('subCheckBox')) config.sub = localStorage.getItem('subCheckBox')
    if (localStorage.getItem('modCheckBox')) config.mod = localStorage.getItem('modCheckBox')
    if (localStorage.getItem('vipCheckBox')) config.vip = localStorage.getItem('vipCheckBox')
    if (localStorage.getItem('allCheckBox')) config.all = localStorage.getItem('allCheckBox')
    if (localStorage.getItem('command')) config.command = localStorage.getItem('command')
    if (localStorage.getItem('prefix')) config.prefix = localStorage.getItem('prefix')
    if (localStorage.getItem('channel')) config.channel = localStorage.getItem('channel')
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

function updateConnectStatus() {
    console.log("Update Connect Status")
    console.log(config.connected)
    if (config.connected)
        $('#connect-status').html('✔')
    else
        $('#connect-status').html('X')
}


function removeMessage(msg) {
    let message = config.messages.find(m => m.id == msg.id);
    if (message) {
        let i = config.messages.indexOf(message);
        config.messages.slice(i, 1);
        localStorage.setItem('messages', JSON.stringify(config.messages));
    }
}

function getRandomID() {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9);
};


function loadListToTable() {

    if (!localStorage.getItem('messages')) return;

    let commands = JSON.parse(localStorage.getItem('messages'))

    for (let i = 0; i < commands.length; i++) {
        let msg = commands[i];
        if(!msg) return;4
        config.messages.push(msg);

        let images = ''

        if (msg.badges.includes('sub')) images += `<img src='../images/sub.png' class='badge-image'/>`
        if (msg.badges.includes('broadcaster')) images += `<img src='../images/broadcaster.png' class='badge-image'/>`
        if (msg.badges.includes('mod')) images += `<img src='../images/mod.png' class='badge-image'/>`
        if (msg.badges.includes('vip')) images += `<img src='../images/vip.png' class='badge-image'/>`



        var newNode = document.createElement('tr');
        newNode.className = 'row'

        newNode.dataset.id = msg.id;

        newNode.innerHTML =
            `<td  class='col-1'>${i}</th>
        <td class='col-4'>${msg.username}</td>
        <td class='col-4'>${msg.message}</td>
        <td class='col-3'>${images}</td>`;

        document.getElementById("messagesList").appendChild(newNode);

    }
}
