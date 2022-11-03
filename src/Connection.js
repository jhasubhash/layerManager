
let portOpen = false;
let socket;    
let server;  
let resultPromise, promiseResolve,promiseReject;

const prepareSocket = () => {
    socket.onopen = function(e) {
        console.log("[open] Connection established");
        console.log("Sending to server");
        socket.send("My name is John");
    };
    
    socket.onmessage = function(event) {
        console.log(`[message] Data received from server: ${event.data}`);
        console.log(event.data)
        if(resultPromise){
            //const res = String.fromCharCode.apply(null, new Uint8Array(event.data));
            const res = event.data.text().then((op)=>{
                console.log(op)
                promiseResolve(JSON.parse(op));

            })
        }
    };
      
    socket.onclose = function(event) {
        if (event.wasClean) {
            console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            // e.g. server process killed or network down
            // event.code is usually 1006 in this case
            console.log('[close] Connection died');
        }
    };
    
    socket.onerror = function(error) {
        console.log(`[error] ${error.message}`);
    };  
}


export const getPhotoshopLayers = async () => {

    let layerProperties = {
    commandType: "info",
    commandName: "Fetch Layer",
    command: { _obj: "multiGet",
        _target: {_ref: [{_ref: "document", _enum: "ordinal"}]},
        extendedReference: [["name"], {_obj: "layer", index:1, count:-1}],
        options: {failOnMissingProperty:false, failOnMissingElement: false}
    }};
    resultPromise =  new Promise(function(resolve, reject){
        promiseResolve = resolve;
        promiseReject = reject;
    });
    socket.send(JSON.stringify(layerProperties))
    let result = await resultPromise;
    //console.log("getPhotoshopLayers result")
    //console.log(result)
    //result = await require("photoshop").action.batchPlay([layerProperties], {});
    return result[0].list.reverse();
}

export const selectLayer = async (layerName) => {
    let command = {
        commandType: "mutate",
        commandName: "Select Layer",
        command: {
        _obj: "select",
        _target: [
           {
              _ref: "layer",
              _name: layerName
           }
        ],
        makeVisible: false,
        _options: {
           dialogOptions: "dontDisplay"
        }
     }}
     resultPromise =  new Promise(function(resolve, reject){
         promiseResolve = resolve;
         promiseReject = reject;
     });
     socket.send(JSON.stringify(command))
     //let result = await resultPromise;
     //return result[0];
}

export const applyBlur = async (layerName) => {
    // select layer
    await selectLayer(layerName);
    // apply blur
    let command = {
        commandType: "mutate",
        commandName: "Apply Blur",
        command: {
            _obj: "gaussianBlur",
            radius: {
                _unit: "pixelsUnit",
                _value: 3
            },
            _options: {
                dialogOptions: "dontDisplay"
            }
          
     }}

     resultPromise =  new Promise(function(resolve, reject){
         promiseResolve = resolve;
         promiseReject = reject;
     });
     socket.send(JSON.stringify(command))
     let result = await resultPromise;
     console.log(result)
     return result[0];
    
}

export const applyOpacity = async (layerName) => {
    // select layer
    await selectLayer(layerName);

    // apply opacity
    let command = {
        commandType: "mutate",
        commandName: "Apply Opacity",
        command: {
        _obj: "set",
        _target: [
           {
              _ref: "layer",
              _enum: "ordinal",
              _value: "targetEnum"
           }
        ],
        to: {
           _obj: "layer",
           opacity: {
              _unit: "percentUnit",
              _value: 50
           }
        },
        _options: {
           dialogOptions: "dontDisplay"
        }
     }}

     resultPromise =  new Promise(function(resolve, reject){
         promiseResolve = resolve;
         promiseReject = reject;
     });
     socket.send(JSON.stringify(command))
     let result = await resultPromise;
     console.log(result)
     return result[0];
}

export const openPort = () => {
    if(portOpen) return;
    portOpen = true;
    console.log("openport")
    socket = new WebSocket('ws://localhost:8080/browser');
    prepareSocket();
}

export const closePort = () => {
    if(!portOpen) return;
    portOpen = false;
    console.log("closeport")
    socket.close(1000, "Work complete");
}