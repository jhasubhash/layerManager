import { fabric } from "fabric";
import { useEffect } from "react";
import logo from './logo.svg';
import paper from './paper.jpg';
import graphy from './graphy.png';
import {makeLine, addLayerNode, connectLayerNode, disconnectLayerNode, NodeType, addAdjustmentNode} from './Operations';
import {useWindowDimensions} from "./Utils"
import {ListBox, Item, Section,Text} from '@adobe/react-spectrum'
import { defaultTheme, Provider} from '@adobe/react-spectrum';
import { useHotkeys } from 'react-hotkeys-hook'


let canvasImage = "https://www.transparenttextures.com/patterns/graphy.png";
let canvas = undefined;
let selectedObj = undefined;
let  museIsDown = false;

const LAYER_AREA_TOP = 200
const LAYER_AREA_LEFT = 1000
const LAYER_AREA_BOTTOM = 1000
const LAYER_AREA_RIGHT = 1600

const PADDING = 100;
const CONTROL_LAYER_MARGIN = 400;
const CONTROL_LAYER_WIDTH = 300;

fabric.Group.prototype.hasControls = false
fabric.Line.prototype.selectable = true;

let layers;

export const Overlay = (props) => {

    const { height, width } = useWindowDimensions();
    useHotkeys('cmd+f', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fetchLayers()
    })
    useHotkeys('cmd+l',  (e) => {
        e.preventDefault();
        e.stopPropagation();
        connect()
    })
    useHotkeys('cmd+d, del',  (e) => {
        e.preventDefault();
        e.stopPropagation();
        disconnect()
    })

    useHotkeys('cmd+b',  (e) => {
        e.preventDefault();
        e.stopPropagation();
        createBlurNode()
    })
    useHotkeys('cmd+o',  (e) => {
        e.preventDefault();
        e.stopPropagation();
        createOpacityNode()
    })
    useHotkeys('cmd+a',  (e) => {
        e.preventDefault();
        e.stopPropagation();
        arrangeLayers()
    })


    useEffect(()=>{
        //TODO: make a connection to websocket server
        if(!canvas){
            canvas = new fabric.Canvas('canvas', 
            {
                targetFindTolerance: 15,
                preserveObjectStacking: true,
                perPixelTargetFind: true, }
            );
            canvas.setBackgroundColor({
                source: graphy,
                repeat: 'repeat'
              }, canvas.renderAll.bind(canvas));
            canvas.setDimensions({width:width, height:height});

            // Event handling
            canvas.on({
                'selection:created': selectionCreated,
                'selection:updated': selectionUpdated,
                'selection:cleared': selectionCleared,
                "mouse:up" : handleMouseUp,
                "mouse:down" : handleMouseDown,
                "mouse:move" : handleMouseMove,
                "mouse:over" : handleMouseOver,
                "object:moving" : handleObjectMove,
            });

            canvas.add(new fabric.IText('Layer Manager', { 
                fontFamily: 'arial black',
                left: 700, 
                top: 20 ,
              }));

            //add layer area
            var layerArea = new fabric.Rect({
                width: LAYER_AREA_RIGHT- LAYER_AREA_LEFT,
                height: LAYER_AREA_BOTTOM - LAYER_AREA_TOP,
                rx: 10,
                ry: 10,
                stroke: 'black',
                strokeWidth: 5,
                fill: 'rgba(0,0,0,0)',
                left: LAYER_AREA_LEFT, 
                top: LAYER_AREA_TOP ,
                selectable: false,
              });
            canvas.add(layerArea)
            canvas.sendToBack(layerArea)
            console.log("canvas created")
        }
        
    },[])

    useEffect(()=>{
        canvas.setDimensions({width:width, height:height});
    },[height, width])

    const connect = () => {
        let obj = canvas.getActiveObject();
        if(obj._objects && obj._objects.length >= 2){
            let controlObjs = obj._objects.filter((obj)=> obj.nodeType == NodeType.AdjustmentLayer)
            let layerObjs = obj._objects.filter((obj)=> obj.nodeType == NodeType.NormalLayer)
            controlObjs.forEach(obj1 => {
                layerObjs.forEach(obj2 => {
                    // two objects are selected. Connect them
                    let line = connectLayerNode(canvas, obj1, obj2);
                    // TODO: Make a call to websocker server to apply the edits to given layer
                });
            });
        }
    }

    const disconnect = () => {
        disconnectLayerNode(canvas);
    }

    const updateConnection = (p) => {
        p.startLines && p.startLines.forEach(element => {
            // let y = element.objects[1].top + element.objects[1].radius;
            // let x = element.objects[1].left + element.objects[1].radius;
            element.set({'x1': p.left + p.width/2, 'y1': p.top+ p.height/2})
            element.setCoords()
        });
        p.endLines && p.endLines.forEach(element => {
            // let y = element.objects[0].top + element.objects[0].radius;
            // let x = element.objects[0].left + element.objects[0].radius;
            element.set({'x2': p.left+ p.width/2, 'y2': p.top + p.height/2})
            element.setCoords()
        });
    }
    
    const handleObjectMove = (e) => {
        var p = e.target;
        if(p._objects && p.nodeType == undefined){
            p._objects.forEach(obj => {
                if(obj.nodeType != NodeType.Link){
                    let left = obj.left + obj.group.left + obj.group.width / 2
                    let top = obj.top + obj.group.top + obj.group.height / 2
                    //updateConnection(obj);
                    //console.log(left+" "+top)
                    updateConnection({'left':left, 'top': top, 'width': obj.width, 'height': obj.height, 'startLines': obj.startLines, 'endLines': obj.endLines});
                }
            });
        } else {
            if(p.nodeType != NodeType.Link)
                updateConnection(p);
        }
    }

    const selectionCreated= (e) => {
        console.log("selectionCreated")
        if(!e.selected || !e.selected.length) return;
        selectedObj = e.selected[0];
        if(selectedObj && selectedObj.nodeType == NodeType.Link)
            selectedObj.set({ stroke: 'blue' });
        e.selected.forEach(element => {
            if(element.nodeType == NodeType.Link){
                element.set('active', false);
                //element.selected = false;
            }
        });
    }

    const selectionUpdated = (e) => {
        console.log("selectionUpdated")
        if(!e.selected || !e.selected.length) return;
        if(selectedObj && selectedObj.nodeType == NodeType.Link){
            selectedObj.set({ stroke: 'black' });
        }
        selectedObj = e.selected[0];
        if(selectedObj && selectedObj.nodeType == NodeType.Link)
        selectedObj.set({ stroke: 'blue' });
        e.selected.forEach(element => {
            if(element.nodeType == NodeType.Link){
                element.set('active', false);
                //element.selected = false;
            }
        });
    }

    const selectionCleared = (e) => {
        console.log("selectionCleared")
        if(selectedObj && selectedObj.nodeType == NodeType.Link){
            selectedObj.set({ stroke: 'black' });
        }
    }

    const handleMouseOver = (e) => {
       if(e.target){
            let selectedObject = e.target;
            //if(selectedObject.nodeType == NodeType.NormalLayer){
                selectedObject.set('active', true);
                selectedObject.set('hasRotatingPoint', false);
                selectedObject.setControlsVisibility({ mtr: false })
                selectedObject.set('hasBorders', false);
                selectedObject.set('transparentCorners', false);
                selectedObject.setControlsVisibility({ tl: false, tr: false, br: false, bl: false });
            //}
        }
    }

    const handleMouseUp = (e) => {
        museIsDown = false;
        fabric.Line.prototype.selectable = true;
    }

    const handleMouseDown = (e) => {
        museIsDown = true;
    }

    const handleMouseMove = (e) => {
        if(museIsDown){ //drag
            fabric.Line.prototype.selectable = false;
        }
    }

    const createBlurNode = () => {
        let x = randomIntFromInterval(LAYER_AREA_LEFT - CONTROL_LAYER_MARGIN - CONTROL_LAYER_WIDTH, LAYER_AREA_LEFT - CONTROL_LAYER_MARGIN)
        let y = randomIntFromInterval(LAYER_AREA_TOP + PADDING, LAYER_AREA_BOTTOM - PADDING)
        addAdjustmentNode(canvas,{x: x,y:y}, "Blur")
    }

    const createOpacityNode = () => {
        let x = randomIntFromInterval(LAYER_AREA_LEFT - CONTROL_LAYER_MARGIN - CONTROL_LAYER_WIDTH, LAYER_AREA_LEFT - CONTROL_LAYER_MARGIN)
        let y = randomIntFromInterval(LAYER_AREA_TOP + PADDING, LAYER_AREA_BOTTOM - PADDING)
        addAdjustmentNode(canvas,{x: x,y:y}, "Opacity")
    }

    const createBlendNode = () => {
        let x = randomIntFromInterval(LAYER_AREA_LEFT - CONTROL_LAYER_MARGIN - CONTROL_LAYER_WIDTH, LAYER_AREA_LEFT - CONTROL_LAYER_MARGIN)
        let y = randomIntFromInterval(LAYER_AREA_TOP + PADDING, LAYER_AREA_BOTTOM - PADDING)
        addAdjustmentNode(canvas,{x: x,y:y}, "Blend")
    }

    function randomIntFromInterval(min, max) { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min)
      }
      
    const fetchLayers = () => {
        layers = ["Layer 1", "Layer 2", "Layer 3", "Layer 4"];
        // TODO: Make a call to websocker server to get layers info
        let x = LAYER_AREA_LEFT + (LAYER_AREA_RIGHT - LAYER_AREA_LEFT)/2 - PADDING;
        let yStep = (LAYER_AREA_BOTTOM - LAYER_AREA_TOP - PADDING)/layers.length;
        let cnt = 0;
        layers.forEach(element => {
            //let x = randomIntFromInterval(LAYER_AREA_LEFT + PADDING, LAYER_AREA_RIGHT - PADDING)
            let y = LAYER_AREA_TOP + PADDING + cnt*Math.min(50, yStep);
            cnt++;
            addLayerNode(canvas, {x:x, y:y}, element);
        });
    }

    const arrangeLayers = () => {
        var layers = canvas.getObjects().filter(obj =>  obj.nodeType === NodeType.NormalLayer);
        if(layers && layers.length){
            let yStep = (LAYER_AREA_BOTTOM - LAYER_AREA_TOP - PADDING)/layers.length;
            let cnt = 0;
            layers.forEach(element => {
                let y = LAYER_AREA_TOP + PADDING + cnt*Math.min(50, yStep);
                cnt++;
                element.set({top: y, left: LAYER_AREA_LEFT + (LAYER_AREA_RIGHT - LAYER_AREA_LEFT)/2 - PADDING})
                element.setCoords()
                updateConnection(element);
            });
            canvas.renderAll();
        }
    }

    const handleMenuChange = (e) => {
        if(e === "fetchLayer"){
            fetchLayers();
        }else if(e === "createLink"){
            connect();
        }else if(e === "deleteLink"){
            disconnect();
        }else if(e === "blurNode"){
            createBlurNode();
        }else if(e === "opacityNode"){
            createOpacityNode();
        }else if(e === "blendNode"){
            createBlendNode();
        }else if(e === "arrangeLayers"){
            arrangeLayers();
        }
    }

    return ( 
    <div style={{position:'absolute', top:70, left:40}}>
    <Provider theme={defaultTheme}>
    <ListBox width="size-2400" aria-label="Alignment" onAction={(key) => handleMenuChange(key)}>
        <Section>
        <Item key={"fetchLayer"}>
            <Text>Fetch Layers </Text>
            <Text slot="description">Cmd+F</Text>
        </Item>
        <Item key={"createLink"}>
            <Text>Create Link </Text>
            <Text slot="description">Cmd+L</Text>
        </Item>
        <Item key={"deleteLink"}>
            <Text>Delete Link </Text>
            <Text slot="description">Cmd+D</Text>
        </Item>
        <Item key={"arrangeLayers"}>
            <Text>Arrange Layers </Text>
            <Text slot="description">Cmd+A</Text>
        </Item>
        </Section>
        <Section>
        <Item key={"blurNode"}>
            <Text>Blur Node </Text>
            <Text slot="description">Cmd+B</Text>
        </Item>
        <Item key={"opacityNode"}>
            <Text>Opacity Node </Text>
            <Text slot="description">Cmd+O</Text>
        </Item>
        <Item key={"blendNode"}>Blend Node</Item>
        </Section>
    </ListBox>
    </Provider>
    </div>);
}
