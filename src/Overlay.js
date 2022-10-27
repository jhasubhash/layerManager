import { fabric } from "fabric";
import { useEffect } from "react";
import logo from './logo.svg';
import paper from './paper.jpg';
import graphy from './graphy.png';
import {makeLine, addLayerNode, connectLayerNode, disconnectLayerNode, NodeType, addAdjustmentNode} from './Operations';
import {useWindowDimensions} from "./Utils"
import {ListBox, Item, Section} from '@adobe/react-spectrum'
import { defaultTheme, Provider} from '@adobe/react-spectrum';


let canvasImage = "https://www.transparenttextures.com/patterns/graphy.png";
let canvas = undefined;
let selectedObj = undefined;
let  museIsDown = false;

fabric.Group.prototype.hasControls = false
fabric.Line.prototype.selectable = true;

export const Overlay = (props) => {

    const { height, width } = useWindowDimensions();

    useEffect(()=>{
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

            canvas.add(new fabric.IText('Tap and Type', { 
                fontFamily: 'arial black',
                left: 100, 
                top: 100 ,
              }));
            console.log("canvas created")

            addLayerNode(canvas, {x:400, y:400});
            addLayerNode(canvas, {x:500, y:500});
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
                    
                });
            });
        }
        //line.set('active', true);
        //let slected = canvas.getActiveObject();
        //slected.addWithUpdate(line);
        //canvas.setActiveObject(slected);
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
        if(p._objects){
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
        addAdjustmentNode(canvas,{x: 100,y:500})
    }

    const handleMenuChange = (e) => {
        if(e === "syncLayer"){

        }else if(e === "syncLayer"){

        }else if(e === "createLink"){
            connect();
        }else if(e === "deleteLink"){
            disconnect();
        }else if(e === "blurNode"){
            createBlurNode();
        }else if(e === "opacityNode"){

        }else if(e === "blendNode"){

        }
    }

    return ( 
    <div style={{position:'absolute', top:20, left:20}}>
    <Provider theme={defaultTheme}>
    <ListBox width="size-2400" aria-label="Alignment" onAction={(key) => handleMenuChange(key)}>
        <Section>
        <Item key={"syncLayer"}>Sync Layers</Item>
        <Item key={"createLink"}>Create Link</Item>
        <Item key={"deleteLink"}>Delete Link</Item>
        </Section>
        <Section>
        <Item key={"blurNode"}>Blur Node</Item>
        <Item key={"opacityNode"}>Opacity Node</Item>
        <Item key={"blendNode"}>Blend Node</Item>
        </Section>
    </ListBox>
    </Provider>
    </div>);
}
