import { fabric } from "fabric";
import uuidv4 from 'uuidv4';

export const NodeType = {
  NormalLayer : 0,
  AdjustmentLayer : 1,
  Link: 2
}


export const makeLine = (coords) => {
    return new fabric.Line(coords, {
      fill: 'red',
      stroke: 'red',
      strokeWidth: 2,
      selectable: true,
      evented: false,
      padding: 10,
      hasBorders: false,
      hasControls: false,
    });
}

const LineWithArrow = fabric.util.createClass(fabric.Line, {
  type: 'line_with_arrow',

  initialize(element, options) {
    options || (options = {});
    this.callSuper('initialize', element, options);

    // Set default options
    this.set({
      hasBorders: false,
      hasControls: false,
    });
  },

  _render(ctx) {
    this.callSuper('_render', ctx);
  },
});

export const addLayerNode = (canvas, pos) => {
  var rect = new fabric.Rect({
    top : pos.y,
    left : pos.x,
    width: 100,
    height: 30,
    rx: 10,
    ry: 10,
    fill : 'red'
  });
  rect.set({
      cornerSize: 6,
      cornerStyle: 'circle',
      transparentCorners: false
    });
  //circle.hasControls = false;
  rect.nodeType = NodeType.NormalLayer;
  rect.id = uuidv4();
  canvas.add(rect);
}

export const addAdjustmentNode = (canvas, pos) => {
  var rect = new fabric.Rect({
    top : pos.y,
    left : pos.x,
    width: 100,
    height: 30,
    rx: 10,
    ry: 10,
    fill : 'grey'
  });
  rect.set({
      cornerSize: 6,
      cornerStyle: 'circle',
      transparentCorners: false
    });
  //circle.hasControls = false;
  rect.nodeType = NodeType.AdjustmentLayer;
  rect.id = uuidv4();
  canvas.add(rect);
}

export const connectLayerNode = (canvas, obj1, obj2) => {
      let l1 = obj1.left + obj1.group.left + obj1.group.width / 2 + obj1.width/2
      let t1 = obj1.top + obj1.group.top + obj1.group.height / 2 + obj1.height/2
      let l2 = obj2.left + obj2.group.left + obj2.group.width / 2 + obj2.width/2
      let t2 = obj2.top + obj2.group.top + obj2.group.height / 2 + obj2.height/2
      //let line = makeLine([l1, t1, l2, t2]);

      let line = new LineWithArrow([l1, t1, l2, t2], {
        strokeWidth: 2,
        stroke: 'black',
      });
      line.objects = [obj1, obj2];
      line.id = uuidv4();
      line.lockMovementX = true;
      line.lockMovementY = true;
      line.nodeType = NodeType.Link;
      canvas.add(line);
      canvas.sendToBack(line)
      if(!obj1.startLines){
          obj1.startLines = []
      }
      obj1.startLines.push(line)
      if(!obj2.endLines){
          obj2.endLines = []
      }
      obj2.endLines.push(line)
      return line;
}


export const disconnectLayerNode = (canvas) => {
  let line = canvas.getActiveObject();
  if(!line.objects) return;
  line.objects[0].startLines = line.objects[0].startLines.filter(x => {
      return x.Id != line.id;
  })
  line.objects[1].endLines = line.objects[1].endLines.filter(x => {
      return x.Id != line.id;
  })
  canvas.remove(line);
}