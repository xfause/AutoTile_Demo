var AutoTileImgs = [];
var ImgNames = [];
var MapInfo = [];
var SelectedImgInfo;

var MapLayer = document.querySelector("#mapLayer")
var DrawLayer = document.querySelector("#drawLayer")
var BgLayer = document.querySelector("#bgLayer")
var PreDraw = document.querySelector("#preDraw")

var POS = {
    LEFT: 1,           // 0000 0001
    RIGHT: 2,          // 0000 0010
    TOP: 4,            // 0000 0100
    BOTTOM: 8,         // 0000 1000
    LEFT_TOP: 16,      // 0001 0000
    RIGHT_TOP: 32,     // 0010 0000
    LEFT_BOTTOM: 64,   // 0100 0000
    RIGHT_BOTTOM: 128  // 1000 0000
};

function GetMappingIndex(state) {
    switch (state) {
        // RB/LB/RT/LT/B/T/R/L
        case "00000000": return 47;

        case "00001000": return 42;     case "00000010": return 43;     case "00000100": return 44;     case "00000001": return 45;
        
        case "00001100": return 32;     case "00000011": return 33;
        case "10001010": return 34;     case "00001010": return 35;     case "01001001": return 36;     case "00001001": return 37;
        case "00010101": return 38;     case "00000101": return 39;     case "00100110": return 40;     case "00000110": return 41;

        case "10101110": return 16;     case "10001110": return 17;     case "00101110": return 18;     case "00001110": return 19;
        case "11001011": return 20;     case "01001011": return 21;     case "10001011": return 22;     case "00001011": return 23;
        case "01011101": return 24;     case "00011101": return 25;     case "01001101": return 26;     case "00001101": return 27;
        case "00110111": return 28;     case "00100111": return 29;     case "00010111": return 30;     case "00000111": return 31;

        case "00001111": return 15;     case "00011111": return 14;     case "00101111": return 13;     case "00111111": return 12;
        case "10001111": return 11;     case "10011111": return 10;     case "10101111": return 9;      case "10111111": return 8;
        case "01001111": return 7;      case "01011111": return 6;      case "01101111": return 5;      case "01111111": return 4;
        case "11001111": return 3;      case "11011111": return 2;      case "11101111": return 1;     case "11111111": return 0;
        
        default: return 46;
    }
}

var MappingTable = [
    [26,27,32,33], //0
    [4,27,32,33],  //1
    [26,5,32,33],  //2
    [4,5,32,33],   //3
    [26,27,32,11], //4
    [4,27,32,11],  //5
    [26,5,32,11],  //6
    [4,5,32,11],   //7
    [26,27,10,33], //8
    [4,27,10,33],  //9
    [26,5,10,33],  //10
    [4,5,10,33],   //11
    [26,27,10,11], //12
    [4,27,10,11],  //13
    [26,5,10,11],  //14
    [4,5,10,11],   //15
    [24,25,30,31], //16
    [24,5,30,31],  //17
    [24,25,30,11], //18
    [24,5,30,11],  //19
    [14,15,20,21], //20
    [14,15,20,11], //21
    [14,15,10,21], //22
    [14,15,10,11], //23
    [28,29,34,35], //24
    [28,29,10,35], //25
    [4,29,34,35],  //26
    [4,29,10,35],  //27
    [26,27,44,45], //28
    [4,39,44,45],  //29
    [38,5,44,45],  //30
    [4,5,44,45],   //31
    [24,29,30,35], //32
    [14,15,44,45], //33
    [12,13,18,19], //34
    [12,13,18,11], //35
    [16,17,22,23], //36
    [16,17,10,23], //37
    [40,41,46,47], //38
    [4,41,46,47],  //39
    [36,37,42,43], //40
    [36,5,42,43],  //41
    [12,17,18,23], //42
    [12,13,42,43], //43
    [36,41,42,47], //44
    [16,17,46,47], //45
    [12,17,42,47], //46
    [12,17,42,47]  //47
];

for (i = 0; i < 15; i++) {
    ImgNames[i] = i + 1
}

var LoadImg = function (url) {
    return new Promise(function (resolve, reject) {
        var img = new Image();
        img.src = url;
        img.onload = function () {
            resolve(img);
        }
        img.onerror = function () {
            reject(new Error('Load image error at ' + url));
        }
    })
}

var LoadAllImg = function () {
    var p = ImgNames.map(function (im) {
        var url = 'assets/autotile' + im + '.png'
        return LoadImg(url).then(function (image) {
            var autotile = {}
            autotile.id = im
            autotile.image = image
            AutoTileImgs.push(autotile)
        }).catch(function (err) {
            console.log("image load error", err)
        })
    })

    return Promise.all(p)
}
var init = function () {
    LoadAllImg().then(function () {
        ImgDataInit();
        MapInit();
        Listen();
    })
}

var MapInit = function () { // 初始化地图背景层及其数组
    var cxt = BgLayer.getContext('2d');
    var colors = ["#f8f8f8", "#cccccc"];

    for (var y = 0; y < 13; y++) {
        MapInfo[y] = [];
        for (var x = 0; x < 13; x++) {
            MapInfo[y][x] = 0; // init map info to 0

            //13*13 bg
            cxt.fillStyle = colors[(x + y + 1) % 2];
            cxt.fillRect(y * 32, x * 32, 32, 32);
        }
    }
}
var ImgDataInit = function () {
    var cxt = PreDraw.getContext('2d')
    var x = 1, y = 0;
    var pos = {};
    PreDraw.height = 8 * 4 * 32;
    for (var i = 0; i < AutoTileImgs.length; i++) {
        if (i > 7 && x == 1) {
            x += 3;
            y = 0;
        }
        cxt.drawImage(AutoTileImgs[i].image, x * 32, y * 32)
        pos = { x: x, y: y };
        AutoTileImgs[i].pos = JSON.parse(JSON.stringify(pos));
        y += 4;
    }
}

var DrawMap = function () {
    var cxt = MapLayer.getContext("2d");

    function IsAutoTile(id){
        return Boolean(id)
    }

    function DrawTile(cxt, x, y, tileInfo)
    {
        cxt.clearRect(x*32, y*32, 32, 32);
        if(tileInfo == 0) return;
        // if want to draw other img can set here
    }

    function GetAutoTileAroundId(currId, x, y) {
        if (x >= 0 && y >= 0 && x < 13 && y < 13 && MapInfo[y][x] == currId)
            return 1;
        else if (x < 0 || y < 0 || x > 12 || y > 12)
            return 1;
        else
            return 0;
    }
    
    function DrawBlockByIndex(ctx, dx, dy, AutoTileImg, index) {
        var sx = 16 * (index % 6) 
        var sy = 16 * Math.floor(index / 6);
        console.log(sx, sy)
        ctx.drawImage(AutoTileImg, sx, sy, 16, 16, dx, dy, 16, 16);
    }

    function GetBinaryKey(state) {
        var key = "";
        for (var i = 7; i >= 0; i--) {
            key += (state >> i) & 1;
        }
        return key;
    }

    function CheckAround(x, y) {
        var currId = MapInfo[y][x];
        var state = 0;

        // Check the four main sides
        if (GetAutoTileAroundId(currId, x, y - 1)) state |= POS.TOP;
        if (GetAutoTileAroundId(currId, x + 1, y)) state |= POS.RIGHT;
        if (GetAutoTileAroundId(currId, x, y + 1)) state |= POS.BOTTOM;
        if (GetAutoTileAroundId(currId, x - 1, y)) state |= POS.LEFT;

        // Check the corners, but only if the relevant sides are present
        if ((state & POS.TOP) && (state & POS.LEFT) && GetAutoTileAroundId(currId, x - 1, y - 1)) state |= POS.LEFT_TOP;
        if ((state & POS.TOP) && (state & POS.RIGHT) && GetAutoTileAroundId(currId, x + 1, y - 1)) state |= POS.RIGHT_TOP;
        if ((state & POS.BOTTOM) && (state & POS.LEFT) && GetAutoTileAroundId(currId, x - 1, y + 1)) state |= POS.LEFT_BOTTOM;
        if ((state & POS.BOTTOM) && (state & POS.RIGHT) && GetAutoTileAroundId(currId, x + 1, y + 1)) state |= POS.RIGHT_BOTTOM;

        return GetBinaryKey(state);
    }

    function DrawAutoTile(ctx, x, y, AutoTileImg) {
        var state = CheckAround(x, y);
        var mappingIndex = GetMappingIndex(state)
        var blocks = MappingTable[mappingIndex];
        console.log(blocks)
        for (var i = 0; i < 4; i++) {
            var index = blocks[i];
            var dx = x*32 + 16*(i%2), dy = y*32 + 16*(~~(i/2));
            DrawBlockByIndex(ctx, dx, dy, AutoTileImg, index);
        }
    }

    function GetImgById(id)
    {
        for (var i=0;i<AutoTileImgs.length;i++)
        {
            if (AutoTileImgs[i].id == id)
            {
                return AutoTileImgs[i].image;
            }
        }
    }

    for (var y = 0; y < 13; y++) {
        for (var x = 0; x < 13; x++) {
            var id = MapInfo[y][x];
            if (IsAutoTile(id)) {
                DrawAutoTile(cxt, x, y, GetImgById(id));
            } else {
                DrawTile(cxt, x, y, id)
            }
        }
    }
}

var Listen = function () {
    var cxt = DrawLayer.getContext('2d');

    function FillPos(pos) {
        cxt.fillStyle = '#' + ~~(Math.random() * 8) + ~~(Math.random() * 8) + ~~(Math.random() * 8);
        cxt.fillRect(pos.x * 32 + 12, pos.y * 32 + 12, 8, 8);
    }//draw random color block to display draw area

    function EventToLoc(e) {
        var loc = { 'x': e.clientX - DrawLayer.offsetLeft, 'y': e.clientY - DrawLayer.offsetTop, 'size': 32 };
        return loc;
    }// return component-inside location

    function LocToPos(loc) {
        pos = { 'x': ~~(loc.x / loc.size), 'y': ~~(loc.y / loc.size) }
        return pos;
    }

    var HoldingPath = 0;
    var StepPostfix = null;// save path

    var MouseOutCheck = 2;
    function ClearCanvas() {
        if (MouseOutCheck > 1) {
            MouseOutCheck--;
            setTimeout(ClearCanvas, 500);
            return;
        }
        HoldingPath = 0;
        StepPostfix = [];
        cxt.clearRect(0, 0, 416, 416);
    }//clear draw path when mouse move out canvas

    DrawLayer.onmousedown = function (e) {
        HoldingPath = 1;
        MouseOutCheck = 2;
        setTimeout(ClearCanvas);
        e.stopPropagation();
        cxt.clearRect(0, 0, 416, 416);
        var loc = EventToLoc(e);
        pos = LocToPos(loc)
        StepPostfix = [];
        StepPostfix.push(pos);
        FillPos(pos);
    }

    DrawLayer.onmousemove = function (e) {
        if (HoldingPath == 0) { return; }
        MouseOutCheck = 2;
        e.stopPropagation();
        var loc = EventToLoc(e);
        var pos = LocToPos(loc);
        var pos0 = StepPostfix[StepPostfix.length - 1]
        var directionDistance = [pos.y - pos0.y, pos0.x - pos.x, pos0.y - pos.y, pos.x - pos0.x]
        var max = 0, index = 4;
        for (var i = 0; i < 4; i++) {
            if (directionDistance[i] > max) {
                index = i;
                max = directionDistance[i];
            }
        }
        pos = [{ 'x': 0, 'y': 1 }, { 'x': -1, 'y': 0 }, { 'x': 0, 'y': -1 }, { 'x': 1, 'y': 0 }, false][index]
        if (pos) {
            pos.x += pos0.x;
            pos.y += pos0.y;
            StepPostfix.push(pos);
            FillPos(pos);
        }
    }

    DrawLayer.onmouseup = function (e) {
        HoldingPath = 0;
        e.stopPropagation();
        var loc = EventToLoc(e);
        if (StepPostfix.length) {
            console.log(StepPostfix);
            for (var ii = 0; ii < StepPostfix.length; ii++)
                MapInfo[StepPostfix[ii].y][StepPostfix[ii].x] = typeof SelectedImgInfo == 'object' ? SelectedImgInfo.id : SelectedImgInfo;
            // console.log(map);
            DrawMap();
        }
    }

    PreDraw.onmousedown = function (e) {
        e.stopPropagation();
        var scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft
        var scrollTop = document.documentElement.scrollTop || document.body.scrollTop
        var loc = {
            'x': scrollLeft + e.clientX + imgSource.scrollLeft - imgSource.offsetLeft,
            'y': scrollTop + e.clientY + imgSource.scrollTop - imgSource.offsetTop,
            'size': 32
        };
        var pos = LocToPos(loc);
        console.log(pos)
        if (pos.x < 1) {
            pos.y = 0
            selectedInfo = 0;
        } else {
            for (var i = 0; i < AutoTileImgs.length; i++) {
                var py = AutoTileImgs[i].pos.y;
                var px = AutoTileImgs[i].pos.x;
                if (pos.x < 4) {
                    if (px < 4 && pos.y >= py && pos.y < py + 4) {
                        pos.x = 1;
                        pos.y = py;
                        SelectedImgInfo = AutoTileImgs[i];
                        break;
                    }
                } else {
                    if (pos.y >= 7 * 4) {
                        pos.y = pos.y - 3
                    }
                    if (px >= 4 && pos.y >= py && pos.y < py + 4) {
                        pos.x = 4;
                        pos.y = py;
                        SelectedImgInfo = AutoTileImgs[i];
                        break;
                    }
                }
            }
        }
        imgSelection.style.left = pos.x * 32 + 'px';
        imgSelection.style.top = pos.y * 32 + 'px';
    }
}

init();