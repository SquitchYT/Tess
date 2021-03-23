const RPC = require('discord-rpc')
const { parentPort } = require('worker_threads')

const rpc = new RPC.Client({
    transport : "ipc"
});

/*
    Fix, crash at load, add error management
*/

rpc.on('ready',() => {
    rpc.setActivity({
        details : "Writting command...",
        largeImageKey : "icon",
        startTimestamp : new Date()
    })

    parentPort.postMessage('Discord RPC is set !')
})

rpc.login({
    clientId : "811294906517422130"
})