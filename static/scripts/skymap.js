﻿//	GLOBAL TODO: вынести стили в css

// Настройки
var MapCellPixels=40; // неплохо бы иметь это число всегда четным
var MaxMapCellPixels = 40;
var ShowPlanetImages=1;
var CacheSize=2;
var RulesH=12;
var RulesW=30;
var DrawRes=1;
var SmallPopUpShowTimeout = 500;
var SmallPopUpHideTimeout = 7000;
var MaxFleetsHeight = 250;
var ScrollSpeed = 75;
var ScrollInterval = 200;

var BorderColor = '#181818';
var Border5Color = '#404040';
var Border10Color = '#808080';
var SelectedBorderColor = 'white';
var TargetBorderColor = '#fffc00';

var ZoomIndex = 0;
var MapZooms = [40, 32, 24];
var BorderWidth = [1, 2, 1];
var CoordsSpan = [1, 1, 5];
var PlanetIconSize = [16, 16, 12];

// Константы
var RegionSize=30;
var PlanetLoading={i:'loading',s:0};
var Num2CustomColor = ['#00FFFF', '#00CCFF', '#0099FF', '#0066FF', '#0000FF', '#6600FF',
		'#9900FF', '#CC00FF', '#FF00FF', '#FF00CC', '#FF0099', '#FF0066',
		'#FF0000', '#FF6600', '#FF9900', '#FFCC00', '#FFFF00', '#CCFF00',
		'#99FF00', '#66FF00', '#00FF00', '#00FF66', '#00FF99', '#00FFCC',
		'#990000', '#996666', '#006600', '#669966', '#333366', '#990099',
		'#663366', '#336666', '#999900', '#999966'];

//	Раскаска планет по времени прибытия флота
var jumpColors = ['#998800', '#559900', '#007700', '#005500', '#003300'];
var notJumpable = 'transparent';

// Рабочие данные ==============================================================
// Здесь будут хранится уже загруженные регионы карты
var LoadedPlanets={};

// Здесь будут храниться запрошенные к загрузке регионы карты,
// чтобы по десять раз не подгружать
var RegionsInLoad={};

// Кеш изображений планет. Чтобы не перезагружались при прокрутке
var ImgCache={};

// Когда начинаем таскать карту - тут будет 1
var InDrag = 0;

var OffsetX=0;
var OffsetY=0;
var CellsX=10;
var CellsY=10;
var MapWidth=300;
var MapHeight=250;
var ShiftX=0;
var ShiftY=0;

var CursorX=0;
var CursorY=0;
var scale;
var bgColorExpr;
var bgColorExprStr='';
var bgColorExprGarrison=false;

var StickedObjects = new Array();
var CurrentInfoDiv;
var FleetsManageFrame;
var FleetChanged;
var RedrawFleetOnLoad;
var MassMove;
var MassDisband;
var MassAction;
var GatherUnitsForMassAction;
var SwitchSelection;

var GetLangMSG;

//
var body = null;
var tablecontainer = null;
var MapTable = null;
var windows = null;
var distSpan = null;

// ПроцеДуры&ПроцеДурочки... ===================================================
// То, что видно снаружи
function InitMap(X,Y){
	if( !window.parent.frames.flets_frame ||
		!window.parent.frames.flets_frame.FleetsByXY ||
		!window.parent.frames.foreighn_fleets_frame ||
		!window.parent.frames.foreighn_fleets_frame.ForeighnFleetsByXY ||
		!window.parent.jumpable_planets_frame ||
		!window.parent.UserPlanets ||
		!window.parent.Actions) {
		setTimeout('InitMap('+X+','+Y+')',200);
		return;
	}
	
	MapWidth=document.getElementById('tacticalmap').offsetWidth;
	MapHeight=document.getElementById('tacticalmap').offsetHeight;

	CellsX=Math.floor(MapWidth/MapCellPixels);
	CellsY=Math.floor(MapHeight/MapCellPixels);

	// Посчитаем, какая ячейка у нас попадает на левый-верхний угол
	var HalfVisibleCellsX=Math.ceil((MapWidth - MapCellPixels)/2/MapCellPixels)+100;
	var HalfVisibleCellsY=Math.ceil((MapHeight - MapCellPixels)/2/MapCellPixels)+100;
	var StartCellX=X-HalfVisibleCellsX;
	var StartCellY=Y-HalfVisibleCellsY;
	// Если ячейка видна лишь частично - высчитаем отрицательное смещение
	var ShiftX=Math.ceil(MapWidth/2)- HalfVisibleCellsX*MapCellPixels - MapCellPixels/2;
	var ShiftY=Math.ceil(MapHeight/2)- HalfVisibleCellsY*MapCellPixels - MapCellPixels/2;

	// Высчитаем смещение от верхнелевого угла ячейки планеты 1:1
	OffsetX=StartCellX*MapCellPixels-ShiftX;
	OffsetY=StartCellY*MapCellPixels-ShiftY;
//  document.getElementById('arrowscontaineer').style.clip= 'rect(0 '+MapWidth+'px '+MapHeight+'px 0)';
//  document.getElementById('arrowscontaineer').style.backgroundColor='gray';
	scale = MapCellPixels / MaxMapCellPixels;

	document.getElementById('hcoords').style.width = (MapWidth-30)+'px';
	DrawRulers(OffsetX,OffsetY);

	if(!body){
		//	Инициализируем только один раз
		RealInitMap(X, Y);
	}

	if(CurrentInfoDiv){
		//	Если есть блок информации о планете - закроем
		CloseInformer(CurrentInfoDiv.id);
	}

	RedrawMap(true);
}

function Zoom(Dir){
	//	Dir > 0 => zoom in
	//	Dir < 0 => zoom out
	if ((ZoomIndex == 0 && Dir > 0) || (ZoomIndex == MapZooms.length-1 && Dir < 0))
		return;
	var CurCenterX = Math.floor((OffsetX + MapWidth  / 2) / MapCellPixels);
	var CurCenterY = Math.floor((OffsetY + MapHeight / 2) / MapCellPixels);

	ZoomIndex = ZoomIndex + (Dir < 0 ? 1 : -1);
	MapCellPixels = MapZooms[ZoomIndex];
	if (Dir > 0){
		if(ZoomIndex == 0){
			document.getElementById('ZoomButtonP').getElementsByTagName('img')[0].src = StaticSiteName+'/img/zoom_p_d.gif';
		}
		document.getElementById('ZoomButtonM').getElementsByTagName('img')[0].src = StaticSiteName+'/img/zoom_m_e.gif';
	} else {
		if(ZoomIndex == MapZooms.length-1){
			document.getElementById('ZoomButtonM').getElementsByTagName('img')[0].src = StaticSiteName+'/img/zoom_m_d.gif';
		}
		document.getElementById('ZoomButtonP').getElementsByTagName('img')[0].src = StaticSiteName+'/img/zoom_p_e.gif';
	}
	InitMap(CurCenterX,CurCenterY);
}

function ZoomOut(){
}

function ScrollMapTo(X, Y){
  InitMap(X, Y);
  SetActivePlanet(X, Y);
  BlinkItem(X, Y);
}

function ScrollPrompt(){
	var Destination = prompt(parent.GetLangMSG(1291), parent.XY);
	if (!Destination)
		return;
	re=/(\d+)\D(\d+)/;
	if(!Destination.match(re)) {
		alert(parent.GetLangMSG(1292));
		return;
	}
	Coords = re.exec(Destination)
	ScrollMapTo(Coords[1], Coords[2]);
}

function bgColorExprPrompt(){
	var newExpr = prompt(GetLangMSG(1315)+':', bgColorExprStr);
	if(newExpr == null){
		return;
	}
	if(newExpr == ''){
		bgColorExpr = null;
		bgColorExprStr = newExpr;
		RedrawMap(true);
		return;
	}
	bgColorExprStr = newExpr;
	try {
		bgColorExpr = new Function('P', 'J', 'MF', 'FF', 'U', 'A', 'G', newExpr);
	}
	catch (e) {
		alert(e.description);
		bgColorExpr = null;
	}
	var re = /^\/\*G\*\//i; 
	if(re.exec(newExpr))
		bgColorExprGarrison = true;
	else
		bgColorExprGarrison = false;
	PlExprErrorDisabled = false;
	RedrawMap(true);
}

// То, что не видно снаружи ====================================================

function RealInitMap(X, Y){
	FleetsManageFrame = parent.frames.extended_fleets || parent.frames.all_fleets;
	FleetChanged = FleetsManageFrame.FleetChanged;
	RedrawFleetOnLoad = FleetsManageFrame.RedrawFleetOnLoad;
	MassMove = function(gid, FleetTo,DoneFunc,args){
		FleetsManageFrame.MassMove.call(this, gid, FleetTo,DoneFunc,args);
	};
	MassDisband = function(gid, FleetTo,DoneFunc,args){
		FleetsManageFrame.MassDisband.call(this, gid, FleetTo,DoneFunc,args);
	};
	MassAction = function(gid, ActionID, DoneFunc,mc,sc,cc,Cancel,FleetID,x,y){
		FleetsManageFrame.MassAction.call(this, gid, ActionID, DoneFunc,mc,sc,cc,Cancel,FleetID,x,y);
	};
	SwitchSelection = function(gid){
		FleetsManageFrame.SwitchSelection.call(this, gid);
	};
	GatherUnitsForMassAction = function(gid){
		return FleetsManageFrame.GatherUnitsForMassAction.call(this, gid);
	};

	GetLangMSG = parent.GetLangMSG;
	//	Заменим функцию готовности чужого флота
	_JSLoadEnd = _JSLoadEndLive;

	tablecontainer = document.getElementById('tablecontainer');
	body = document.getElementsByTagName('body')[0];
	windows = document.getElementById('windows');

	//	Раскомментировать эту строку для включения кнопки подсветки планет
//	document.getElementById('bgcolorBtn').style.display = 'table-cell';
	//	при необходимости доступа к гарнизону вначале выражения написать /*G*/
	//	примеры выражений подсведки:
	//	подсветка пригодны планет для сборщика астеройдов
	//		if (!P.s || P.s > 30) return 0; a = (95 - P.s*1.5)*(100-P.m)/8000; r = Math.round(a - 80); return 'rgb('+r+','+(255-r)+',0)';

	var tb = parent.document.getElementById('tb_skymap_frame');
	var targetCell = tb.rows[0].cells[1] || tb.rows[0].cells[0].firstChild.rows[0].cells[1];
	targetCell.innerHTML = targetCell.innerHTML + '<span id="dist_span" style="padding-left:2em;">'+X+':'+Y+' - '+X+':'+Y+'&nbsp;&nbsp;&nbsp;0</span>';
	distSpan = parent.document.getElementById('dist_span');

	//	Тут мы пытаемся хоть как-то убрать стандартный скролл iframe в опере
	window.onscroll = function(e){
		if(!e)
			e = windows.event;
		window.scrollBy(-1000, -1000);
		e.returnValue = false;
		e.cancelBubble = true;
		return false;
	};
}

function DrawLine(X1,Y1,X2,Y2,Mode){
  var ImgX=40;
  var ImgY=40;
  var ImgW=40;
  var ImgH=40;
  var StepX=40;
  var StepY=40;
  if (X1 > X2){
    var Tml=X2;
    X2=X1;
    X1=Tml;
    Tml=Y2;
    Y2=Y1;
    Y1=Tml;
  }
  var ImgPrefix=Y2<Y1?'':'r';

  var DX=Math.abs(X1 - X2);
  var DY=Math.abs(Y1 - Y2);
  if (DX > DY){
    if (DY == 0 || DX/DY >= 40){
      ImgY=1;
      ImgPrefix='';
    } else if (DX/DY > 40/3){
      ImgY=2;
    } else if (Math.round(DX/DY) > 40/6){
      ImgY=Math.round(DY/DX*40);
    } else if (Math.round(DX/DY) >= 2){
      ImgY=20;
    }
    ImgH=ImgY>5?Math.ceil(40*DY/DX):ImgY;
    StepY=40*DY/DX;
  } else if (DY > DX){
    if (DX == 0 || Math.round(DY/DX) > 40/2){
      ImgX=1;
      ImgPrefix='';
    } else if (Math.ceil(DY/DX) > 40/3){
      ImgX=2;
    } else if (Math.ceil(DY/DX) > 40/4){
      ImgX=3;
    } else if (Math.ceil(DY/DX) > 40/5){
      ImgX=4;
    } else if (Math.ceil(DY/DX) > 40/6){
      ImgX=5;
    } else if (Math.ceil(DY/DX) >= 2){
      ImgX=20;
    }
    ImgW=ImgX > 5?Math.ceil(40*DX/DY):ImgX;
    StepX=40*DX/DY;
  }

  var ImgFile=ImgPrefix+ImgX+'_'+ImgY+'_'+Mode;
//  document.getElementById('report').innerHTML+=ImgFile+' - '+ImgW+':'+ImgH+'<br>';

  var X=X1;
  var Y=Y1;
//  alert(X+':'+Y);
  var ZY=0;
  var Out = new Array();
//  document.getElementById('report').innerHTML='';
  var ID='track'+X1+'_'+Y1+'_'+X2+'_'+Y2;
  while (X < X2){
    var W=ImgW;
    var H=ImgH;
    var Scale=1;
    if (X+StepX > X2){
      Scale=1-(X+StepX - X2)/ImgW;
    } else if (Y+StepY > Y2) {
      Scale=1-(Y+StepY - Y2)/ImgH;
    }
    W=Math.round(W*Scale);
    H=Math.round(H*Scale);
    var PlaceOffsetY=Y2<Y1?H:0;
    var DY=Math.round(Y - OffsetY + RulesH + PlaceOffsetY);
    var DX=Math.round(X - OffsetX + RulesW);
    // Если линия попала в экран - реально картинку слепим. Иначе - лесом...
    if (DY + ImgH > 0 && DY < MapHeight || DX + ImgW > 0 && DX < MapWidth){
      if (!ZY){
        Out[Out.length]='<table callpadding="0" cellspacing=0" border="0" style="position:relative;top:'+(1 + DY - CellsY*MapCellPixels - CacheSize*2*MapCellPixels)+
          'px;left:'+(DX)+'px;width:1px;height:1px;" id="'+ID+'" height="2" border="0" id="'+ID+
          '"><tr>';
        ZY=DY;
        ShiftY=0;
      }
      var ShiftY=DY-ZY;
//      document.getElementById('report').innerHTML+=PlaceOffsetY+':'+DY+'<br>';

      Out[Out.length]='<td height="2" style="margin:0;padding:0;"><img src="'+StaticSiteName+'/img/arrows/'+
        ImgFile+'.gif" width="'+W+'" height="'+H+'" style="position:relative;top:'+ShiftY+'px;left:-1px;margin:0;" id="img_'+ID+
          '"></td>';
    }
//    document.getElementById('report').innerHTML+=DX+':'+DY+'<br>';
    X+=StepX;
    Y+=StepY;
  }
  if (Out.length){
    Out[Out.length]='</tr></table>';
  }
  return Out.join('');
}

// Извлекает из LoadedPlanets данные для планеты
// если данных нет - создает запрос на загрузку и возвращает данные типа '?'
function GetPlanetData(X,Y){
	if (LoadedPlanets['p'+X+'_'+Y])
	{
		var P = LoadedPlanets['p'+X+'_'+Y];
		if (!P.n)
			P.n = 'N'+P.x+':'+P.y;
		return P;
	}
	RequestDataLoad(X,Y);
	return PlanetLoading;
}

function CoordToRegion(Coord){
	return Math.floor(Coord/RegionSize)*RegionSize + 1;
}

// Перерисовывает всю умещающуюся в окно карту
var PrevStartCellX = NaN;
var PrevStartCellY = NaN;
function RedrawMap(force){
	// Поглядим, какая у нас ячейка попала в верхний-левый
	var StartCellX=Math.floor(OffsetX/MapCellPixels);
	var StartCellY=Math.floor(OffsetY/MapCellPixels);

	// пропускаем перерисовку если карта не сдвинулась
	if(StartCellX == PrevStartCellX && StartCellY == PrevStartCellY && !force){
		return;
	}
	PrevStartCellX = StartCellX;
	PrevStartCellY = StartCellY;

	// И на сколько она отъехала от канонической позиции
	ShiftX=OffsetX - StartCellX*MapCellPixels;
	ShiftY=OffsetY - StartCellY*MapCellPixels;

	// Рисовать будем с запасом - по CacheSize с каждой стороны
	var TableOffsetX=ShiftX+CacheSize*MapCellPixels-RulesW;
	var TableOffsetY=ShiftY+CacheSize*MapCellPixels-RulesH;

	var TableWidth	= (CellsX+CacheSize*2)*MapCellPixels + 1;
	var TableHeight	= (CellsY+CacheSize*2)*MapCellPixels + 1;

//  alert(CellsX+':'+CellsY);
//	alert((CacheSize*2+CellsX)+':'+(CacheSize*2+CellsY)+"\n"+TableWidth+':'+TableHeight);
	var MapHTML=new Array();
	MapHTML[MapHTML.length]='<div '+
		'style="position:relative; top:-'+TableOffsetY+'px;left:-'+TableOffsetX+'px;'+
		'width:'+TableWidth+'px;height:'+TableHeight+'px;border: 0px;" id="MapTable">';

	for (var y = StartCellY-CacheSize; y < StartCellY+CacheSize+CellsY; y++){
		for (var x = StartCellX-CacheSize; x < StartCellX+CacheSize+CellsX; x++){
			MapHTML[MapHTML.length] = DrawCell(x, y, x == StartCellX + CacheSize + CellsX - 1);
		}
	}
	MapHTML[MapHTML.length] = '</div>';

	var PageCode=MapHTML.join('');
	tablecontainer.innerHTML=PageCode;
	MapTable=document.getElementById("MapTable");

	// отметим текущую планету
	var current = window.parent.XY.split(':');
	if(current[0] > StartCellX-CacheSize && current[0] < StartCellX+CacheSize+CellsX
		&& current[1] > StartCellY-CacheSize && current[1] < StartCellY+CacheSize+CellsY) {
		SetActivePlanet(current[0], current[1]);
	}

	// Ставим обработчики на tacticalmap
	var tacticalmap = document.getElementById('tacticalmap');
	tacticalmap.onclick		= mapClickHandler;
	tacticalmap.onmousemove	= mapMouseMoveHandler;
	tacticalmap.oncontextmenu = function (e) { return false; };

	Drag.init(tacticalmap, MapTable);
	MapTable.onDragEnd	= EndMapDrag;
	MapTable.onDrag		= MapDrag;
	MapTable.onContextMenu	= ContextMenu;
}

function EndMapDrag(){
	RedrawMap(false);
	setTimeout("InDrag=0", 50);
}

function MapDrag(DX, DY, X, Y){
	InDrag = 1;
	if (DX)
		OffsetX+=DX;
	if (DY)
		OffsetY+=DY;
	DrawRulers(OffsetX,OffsetY);

	//	Двигаем информер
	MovePlanetInfo(DX, DY);
}

var PrevX;
var PrevY;
function DrawRulers(OffsetX,OffsetY){
	var HRule=document.getElementById('hcoords');
	var VRule=document.getElementById('vcoords');

	// Поглядим, какая у нас ячейка попала в верхний-левый
	var StartCellX=Math.floor(OffsetX/MapCellPixels);
	var StartCellY=Math.floor(OffsetY/MapCellPixels);

	// И на сколько она отъехала от канонической позиции
	ShiftX = StartCellX*MapCellPixels - OffsetX;
	ShiftY = StartCellY*MapCellPixels - OffsetY;
	if (PrevX == StartCellX){
		document.getElementById('hrulert').style.left=ShiftX+'px';
	} else {
		var HRuleTable=new Array();
		var textAlign = CoordsSpan[ZoomIndex]-1 ? 'left' : 'center';
		HRuleTable[HRuleTable.length]='<table border="0" cellpadding="0" cellspacing="0"'+
			'" style="position:relative;top:0;left:'+ShiftX+'px;width:'+((CellsX+1)*MapCellPixels)+
			'px;height:10px;font-size:12px;border-bottom:1px solid gray;color:silver;" id="hrulert"><tr>';
		var stopCoord = StartCellX+CellsX;
		for (var i=StartCellX;i <= stopCoord;i++){
			var vColor = (i-1) % 5? BorderColor: (i-1) % 10 ? Border5Color : Border10Color;
			var skip = (i-1) % CoordsSpan[ZoomIndex];
			if(skip){
				if(i==StartCellX){
					HRuleTable[HRuleTable.length]='<td style="width:'+(MapCellPixels*(CoordsSpan[ZoomIndex]-skip)-1)+'px;border-left:1px solid '+vColor+';"> </td>';
				}
				continue;
			}
			var span = CoordsSpan[ZoomIndex];
			if(i + span > stopCoord + 1)
				span -= span - (stopCoord - i) - 1;
			var width = MapCellPixels*span - 1;
			var coordsText = CoordsSpan[ZoomIndex] > 1 && span < 2 ? '&nbsp;' : normCoords(i); //	Не показываем последние координаты если их не видно, чтобы не сдвигалась таблица
			HRuleTable[HRuleTable.length]='<td style="width:'+width+'px;border-left:1px solid '+vColor+';" align="'+textAlign+'">'+coordsText+'</td>';
		}
		HRuleTable[HRuleTable.length]='</tr></table>';
		HRule.innerHTML=HRuleTable.join('');
	}

	if (PrevY == StartCellY){
		document.getElementById('vrulert').style.top=(ShiftY+RulesH)+'px';
	} else {
		var VRuleTable=new Array();
		VRuleTable[VRuleTable.length]='<table border="0" cellpadding="0" cellspacing="0"'+
			'" style="position:relative;left:0;top:'+(ShiftY+RulesH)+'px;height:'+((CellsY+CacheSize+1)*MapCellPixels)+
			'px;width:100%;font-size:12px;border-right:1px solid gray;color:silver;" id="vrulert">';
		for (var i=StartCellY;i <= StartCellY+CellsY+CacheSize;i++){
			var hColor = (i-1) % 5? BorderColor: (i-1) % 10 ? Border5Color : Border10Color;
			VRuleTable[VRuleTable.length]='<tr><td style="height:'+(MapCellPixels-1)+'px;border-top:1px solid '+hColor+';" align="right">'+normCoords(i)+'</td></tr>';
		}
		VRuleTable[VRuleTable.length]='</table>';
		VRule.innerHTML=VRuleTable.join('');
	}
	PrevX=StartCellX;
	PrevY=StartCellY;
}

function RequestDataLoad(X,Y){
	X=CoordToRegion(X);
	Y=CoordToRegion(Y);
	if (LoadedPlanets['r'+X+'_'+Y]) return;
	if (RegionsInLoad['r'+X+'_'+Y]) return;
	parent.RequestProcessing(true);
	RegionsInLoad['r'+X+'_'+Y]=1;
	var Div=document.createElement('div');
	Div.setAttribute('id', 'mfd'+X+'_'+Y);
	document.getElementById('region_loaders_area').appendChild(Div);

	var f=document.createElement('iframe');
	f.setAttribute('src', '/blackframes/fetch_map_region/on/'+window.parent.PlayerId+'/?planetid='+X+':'+Y+'&t='+window.parent.TurnN);
	f.setAttribute('height', 0);
	f.setAttribute('width', 0);
	f.setAttribute('id', 'mf'+X+'_'+Y);
	document.getElementById('mfd'+X+'_'+Y).appendChild(f);
}

function LoadRegionEnd(Data,X,Y){
	for (var i=0;i<Data.length;i++){
		var Itm=Data[i];
		LoadedPlanets['p'+Itm.x+'_'+Itm.y]=Itm;
	}
	if (document.getElementById('mfd"+X+"_"+Y+"')){
		setTimeout("document.getElementById('mfd"+X+"_"+Y+"').innerHTML=''",1);
	}
	RedrawMap(true);
	parent.RequestProcessing(false);
}

// Генерирует HTML для ячейки/планеты карты
function DrawCell(X, Y, last){
	X = normCoords(X);
	Y = normCoords(Y);
	var PlanetInfo	= GetPlanetData(X,Y);
	var vColor		= (X-1) % 5 ? BorderColor : (X-1) % 10 ? Border5Color : Border10Color;
	var hColor		= (Y-1) % 5 ? BorderColor : (Y-1) % 10 ? Border5Color : Border10Color;
	var cell_size	= MapCellPixels - BorderWidth[ZoomIndex];
	var borderW		= BorderWidth[ZoomIndex];
	var isJumpable	= parent.UserPlanets['a'+X+'_'+Y];
	//	Explorer без правильного доктайпа уменьшает div'ы.
	if(BrowserDetect.browser == 'Explorer'){
		cell_size += BorderWidth[ZoomIndex];
	}
	var Out = new Array();

	var bgColor = 0;
	if(bgColorExpr && !PlExprErrorDisabled){
		try{
			var P = PlanetInfo;
			var MyFleetsHere = window.parent.frames.flets_frame.FleetsByXY[X+':'+Y] || [];
			var ForeignFleetsHere = window.parent.frames.foreighn_fleets_frame.ForeighnFleetsByXY[X+':'+Y] || [];
			var U = window.parent.frames.units_frame.AllUnitsBase;
			var G;
			if(bgColorExprGarrison){
				G = FleetsManageFrame.FindFleetInTree(X+'_'+Y, FleetsManageFrame.H, true);
				if(G)
					G = G.f.d;
			}

			//	P - planet, J - isJumpable, MF - MyFleetsHere, FF - ForeignFleetsHere, U - units, A - actions, G - garrison
			bgColor = bgColorExpr(P, isJumpable, MyFleetsHere, ForeignFleetsHere, U, parent.Actions, G);
			if(!bgColor)
				bgColor = 'transparent';
		}
		catch(e) {
			if(!PlExprErrorDisabled){
				alert(e.description);
				PlExprErrorDisabled = true;
			}
		}
	}

	if (MapCellPixels == MaxMapCellPixels){
		if (PlanetInfo.x){
			//	Кеширование изображения планеты
			var PlNum = PlanetInfo.i + '' + PlanetInfo.is;
			var PlImg = StaticSiteName+'/img/planets/'+PlNum+'.gif';
			if(!ImgCache[PlNum]){
				ImgCache[PlNum] = new Image();
				ImgCache[PlNum].src=PlImg;
			}

			if(!bgColor)
				bgColor = 'transparent';
			Out[Out.length]='<div id="navigator_cell_'+X+'_'+Y+'" class="planet_cell" '+
					'style="border-left:'+borderW+'px solid '+vColor+';'+
					'border-top:'+borderW+'px solid '+hColor+'; height:'+cell_size+'px;width:'+cell_size+';float:left;'+
					'background-image:url('+PlImg+');position:relative;background-color:'+bgColor+';" cell_color="'+bgColor+'" bgcolor="black">';

			var InFog=PlanetInfo.a?'':'f';
			var pl_ico_src = '';
			if (PlanetInfo.lb){
				pl_ico_src = StaticSiteName+'/img/icons/dp_m/'+PlanetInfo.lb+InFog;
			} else {
				var MarkImgPrefix=StaticSiteName+'/img/'+(PlanetInfo.l?('logo/'+PlanetInfo.l+'/'):'');
				if (PlanetInfo.d == -10){
					pl_ico_src = MarkImgPrefix+'ico_dip_self';
				} else if (PlanetInfo.d == -1){
					pl_ico_src = MarkImgPrefix+'ico_dip_nn'+InFog;
				} else if (!isNaN(PlanetInfo.d)){
					pl_ico_src = MarkImgPrefix+'ico_dip_'+PlanetInfo.d+InFog+'l';
				} else if (PlanetInfo.a == 0){
					pl_ico_src = MarkImgPrefix+'ico_dip_fl';
				} else if (PlanetInfo.a > 0){
					pl_ico_src = MarkImgPrefix+'ico_dip_l';
				} else {
					pl_ico_src = null;
				}
			}
			if(pl_ico_src){
				Out[Out.length]='<img width="16" height="16" alt="" style="position:absolute;left:0px;top:0px;" src="'+pl_ico_src+'.gif"/>';
			}

			if(!isNaN(PlanetInfo.ic)){
				Out[Out.length]='<img width="16" height="16" alt="" style="position:absolute;left:0px;bottom:1px;" src="'+
					StaticSiteName+'/img/icons/p_m/'+PlanetInfo.ic+'p.gif"/>';
			}
			if(isJumpable){
				Out[Out.length]='<img width="16" height="1" alt="" style="position:absolute;left:0px;bottom:0px;" src="'+
					StaticSiteName+'/img/whitedot.gif"/>';
			}

			var fleetsFlags = DrawFleetsBtn(X, Y, ZoomIndex);
			if(fleetsFlags){
				Out[Out.length]='<div style="position: absolute; right:0px; text-align:right;" id="fleetsBtn_'+X+'_'+Y+'">';
				Out[Out.length]=fleetsFlags;
				Out[Out.length]='</div>';
			}

			if(PlanetInfo.inf == 1){
				Out[Out.length]='<img src="'+StaticSiteName+'/img/inf_st.gif'+'" width="12" height="13" alt="" style="position: absolute; right:0px; bottom:0px; text-align:right;"/>';
			}
			else if(!isNaN(PlanetInfo.inf) && PlanetInfo.inf == 0){
				Out[Out.length]='<img src="'+StaticSiteName+'/img/inf_o.gif'+'" width="12" height="13" alt="" style="position: absolute; right:0px; bottom:0px; text-align:right;"/>';
			}
/*
		Out[Out.length]='<tr><td valign="bottom">';
		var Color='dred';
		if (isNaN(PlanetInfo.lq) || !DrawRes){
			Color='empty';
		} else if (PlanetInfo.lq <= 0){
			Color='dred';
		} else if (PlanetInfo.lq <= 6){
			Color='lred';
		} else if (PlanetInfo.lq <= 17){
			Color='orange';
		} else if (PlanetInfo.lq <= 27){
			Color='yellow';
		} else if (PlanetInfo.lq > 27){
			Color='green';
		}
		Out[Out.length]='<img src="'+StaticSiteName+'/img/'+Color+'dot.gif" alt="" width="13" height="1" border="0"/></td>';

		Out[Out.length]='</td></tr>';
		Out[Out.length]='</table>';
//*/
		Out[Out.length]='</div>';
		} else {
			return '<div id="navigator_cell_'+X+'_'+Y+'" '+
				'style="border-left:'+borderW+'px solid '+vColor+';'+
				'border-top:'+borderW+'px solid '+hColor+'; height:'+cell_size+'px;width:'+cell_size+';float:left;'+
				'background-image:url('+StaticSiteName+'/img/unkn_planet.gif);position:relative;" bgcolor="black"></div>';
		}
	} else {
		//	Не максимальный масштаб

		var contentText = '';
		var pl_ico_src = '';

		if(PlanetInfo.x){
//			contentText = PlanetInfo.s > 0 ? PlanetInfo.s : PlanetInfo.is + 'x';

			var InFog=PlanetInfo.a?'':'f';
			if (!isNaN(PlanetInfo.lb)){
				pl_ico_src = StaticSiteName+'/img/icons/dp_ms/'+PlanetInfo.lb+InFog;
			} else {
				var MarkImgPrefix=StaticSiteName+(PlanetInfo.l ? ('/img/logo/'+PlanetInfo.l+'/') : '/img/id_s/');
				if (PlanetInfo.d == -10){
					pl_ico_src = MarkImgPrefix+'ico_dip_self';
				} else if (PlanetInfo.d == -1){
					pl_ico_src = MarkImgPrefix+'ico_dip_nn'+InFog;
				} else if (!isNaN(PlanetInfo.d)){
					pl_ico_src = MarkImgPrefix+'ico_dip_'+PlanetInfo.d+InFog+'l';
				} else if (PlanetInfo.a == 0){
					pl_ico_src = MarkImgPrefix+'ico_dip_fl';
				} else if (PlanetInfo.a > 0){
					pl_ico_src = MarkImgPrefix+'ico_dip_l';
				} else {
					pl_ico_src = null;
				}
			}

			if(!bgColor)
				bgColor = PlanetColor(X, Y);

/*			//	Цвет пригодности для нашей расы
			if (isNaN(PlanetInfo.lq) || !DrawRes){
				textColor	= null;
			} else if (PlanetInfo.lq <= 0){
				textColor	= '#AA0000';
			} else if (PlanetInfo.lq <= 6){
				textColor	= '#FFDFDF';
			} else if (PlanetInfo.lq <= 17){
				textColor	= '#D27C0D';
			} else if (PlanetInfo.lq <= 27){
				textColor	= '#FFFF00';
			} else if (PlanetInfo.lq > 27){
				textColor	= '#00FF00';
			}
*/
		} else {
			contentText = '*';
		}

		Out[Out.length]= '<div id="navigator_cell_'+X+'_'+Y+'" '+
			'style="border-left:'+borderW+'px solid '+vColor+';'+
			'border-top:'+borderW+'px solid '+hColor+';height:'+cell_size+'px;width:'+cell_size+'px;float:left;position:relative;'+
			'text-align: right; font-size: 12px;cursor:default;'+
			(pl_ico_src ? 'background-image:url('+pl_ico_src+'.gif);background-repeat:no-repeat;background-position:left top;' : '')+
			(bgColor ? 'background-color:'+bgColor+';' : '')+
			'"' + (bgColor ? 'cell_color="'+bgColor+'"' : '') +'>';

		if(!isNaN(PlanetInfo.ic)){
			Out[Out.length]='<img width="'+PlanetIconSize[ZoomIndex]+'" height="'+PlanetIconSize[ZoomIndex]+'" alt="" style="position:absolute;left:0px;bottom:2px;" src="'+
				StaticSiteName+'/img/icons/p_m/'+PlanetInfo.ic+'p.gif"/>';
		}
		if(isJumpable){
			Out[Out.length]='<img width="12" height="2" alt="" style="position:absolute;left:0px;bottom:0px;" src="'+
				StaticSiteName+'/img/whitedot.gif"/>';
		}

		var fleetsFlags = DrawFleetsBtn(X, Y, ZoomIndex);
		if(fleetsFlags){
			Out[Out.length]='<div style="position:absolute;right:0px;text-align:right;background-color:black;border-left:1px solid black;border-bottom:1px solid black;" id="fleetsBtn_'+X+'_'+Y+'">';
			Out[Out.length]=fleetsFlags;
			Out[Out.length]='</div>';
		}

		if(PlanetInfo.inf == 1){
			Out[Out.length]='<div style="position: absolute; right:0px; bottom:0px; text-align:right;">';
			Out[Out.length]='<img src="'+StaticSiteName+'/img/inf_st.gif'+'" width="11" height="12" alt=""/>';
			Out[Out.length]='</div>';
		}
		else if(!isNaN(PlanetInfo.inf) && PlanetInfo.inf == 0){
			Out[Out.length]='<div style="position: absolute; right:0px; bottom:0px; text-align:right;">';
			Out[Out.length]='<img src="'+StaticSiteName+'/img/inf_o.gif'+'" width="11" height="12" alt=""/>';
			Out[Out.length]='</div>';
		}
		Out[Out.length]= contentText;
		Out[Out.length]= '</div>';
	}
	return Out.join('');
}

function PlanetColor(X, Y){
	var PlanetInfo	= GetPlanetData(X,Y);
	return RelationColor(PlanetInfo.d,PlanetInfo.lb);
}

function RelationColor(rel,label){
	var color;
	if(!isNaN(label)){
		color = Num2CustomColor[label];
	}
	else if(!isNaN(rel)){
		if(rel == -1){			//	Не определено
			color = 'gray';
		} else if(rel == 0){	//	Враг
			color = '#FF0000';
		} else if(rel == 1){	//	Нейтральный
			color = 'blue';
		} else if(rel == 2){	//	Союзник
			color = 'lime';
		} else if(rel == 3){	//	Вассал
			color = 'aqua';
		} else if(rel == 4){	//	Лорд
			color = 'yellow';
		} else if(rel == -10){	//	Мы сами
			color = '#DDDDDD';
		}
	}
	return color;
}

function DrawFleetsBtn(X, Y, scale){
	var HasHidden;

	var MyFleetsHere=window.parent.frames.flets_frame.FleetsByXY[X+':'+Y] || [],
		ForeighnFleetsHere=window.parent.frames.foreighn_fleets_frame.ForeighnFleetsByXY[X+':'+Y] || [];
	var TotalFleets=MyFleetsHere.length+ForeighnFleetsHere.length;
	if (!TotalFleets){
		return ''; //'<img src="'+StaticSiteName+'/img/z.gif" alt="" width="1" height="1" hspace="0" vspace="0" border="0">';
	} else {
		for (var i=0;i<MyFleetsHere.length;i++){
			if (MyFleetsHere[i].h > 0){
				HasHidden=1;
				break;
			}
		}
		if(!HasHidden)
			for (var i=0;i<ForeighnFleetsHere.length;i++){
				if (ForeighnFleetsHere[i].h > 0){
					HasHidden=1;
					break;
				}
			}

		var Out=new Array();
		if (HasHidden){
			Out[Out.length]='<table border="0" cellpadding="0" cellspacing="0"><tr valign="bottom">'
		} else {
//			Out[Out.length]='<img src="'+StaticSiteName+'/img/z.gif" alt="" width="1" height="5" border="0">';
		}
		var MarkWidth=TotalFleets>18?1:TotalFleets>5?2:3;
		var MarksInLine=MarkWidth>1?6:TotalFleets>60?20:11;
		var Position=1;

		if(scale){
			var ForeighnFleetsCount = {'-1':0,'0':0,'1':0,'2':0,'3':0,'4':0};
			for(var i = 0; i < ForeighnFleetsHere.length; i++) {
				var Fleet = ForeighnFleetsHere[i];
				ForeighnFleetsCount[!isNaN(Fleet.rel) ? Fleet.rel : -1]++;
			}

			MarkWidth = scale < 2 || TotalFleets <= 4 ? 2 : 1;
			MarksInLine = 6;

			var MyMarks = MyFleetsHere.length ? MyFleetsHere.length <= 2 ? 1 : 2 : 0;
			for(var i = 0; i < MyMarks; i++){
				var NeedBreak=!(Position % MarksInLine);
				DrawFleetMark(Out,{},HasHidden,'whitedot',MarkWidth,MarksInLine,NeedBreak);
				Position=NeedBreak?1:Position+1;
			}

			for(var j = -1; j <= 4; j++){
				var AllienMarks = ForeighnFleetsCount[j] ? ForeighnFleetsCount[j] <= 2 ? 1 : 2 : 0;

				var MarkColor='graydot';
				if (/*Fleet.ta || */ j == 0){
					MarkColor='reddot';
				} else if (j == 1){
					MarkColor='bluedot';
				} else if (j == 2){
					MarkColor='greendot';
				} else if (j == 3){
					MarkColor='edot';
				} else if (j == 4){
					MarkColor='yellowdot';
				}

				for(var i = 0; i < AllienMarks; i++){
					var NeedBreak=!(Position % MarksInLine);
					DrawFleetMark(Out,{},HasHidden,MarkColor,MarkWidth,MarksInLine,NeedBreak);
					Position=NeedBreak?1:Position+1;
				}
			}
		}else{
			if(TotalFleets>120){
				var FHLimit=MyFleetsHere.length;
				if(FHLimit>10){
					FHLimit=ForeighnFleetsHere.length>10 ?
						Math.floor(120*MyFleetsHere.length/TotalFleets) :
						(120-ForeighnFleetsHere.length);
					if(MyFleetsHere.length>FHLimit) MyFleetsHere=MyFleetsHere.slice(0,FHLimit);
				}
				TotalFleets=120;
				FHLimit=TotalFleets-FHLimit;
				if(ForeighnFleetsHere.length>FHLimit) ForeighnFleetsHere=ForeighnFleetsHere.slice(0,FHLimit);
			}
			for (var i=0;i<MyFleetsHere.length;i++){
				var NeedBreak=!(Position % MarksInLine) || i==MyFleetsHere.length-1 && TotalFleets < 7 && ForeighnFleetsHere.length;
				DrawFleetMark(Out,MyFleetsHere[i],HasHidden,'whitedot',MarkWidth,MarksInLine,NeedBreak);
				Position=NeedBreak?1:Position+1;
			}
			for (var i=0;i<ForeighnFleetsHere.length;i++){
				var Fleet=ForeighnFleetsHere[i];
				var NeedBreak=!(Position % MarksInLine);
				var MarkColor='graydot';
				if(!isNaN(Fleet.l)) {
					MarkColor='icons/dc/'+Fleet.l;
				} else if (Fleet.ta || Fleet.rel == 0){
					MarkColor='reddot';
				} else if (Fleet.rel == 1){
					MarkColor='bluedot';
				} else if (Fleet.rel == 2){
					MarkColor='greendot';
				} else if (Fleet.rel == 3){
					MarkColor='edot';
				} else if (Fleet.rel == 4){
					MarkColor='yellowdot';
				}
				DrawFleetMark(Out,Fleet,HasHidden,MarkColor,MarkWidth,MarksInLine,NeedBreak);
				Position=NeedBreak?1:Position+1;
			}
		}

		if (HasHidden){
			Out[Out.length]='</tr></table>'
		}
		return Out.join('');
	}
}

function DrawFleetMark(Out,Fleet,HasHidden,Color,MarkWidth,MarksInLine,NeedBreak){
	var ItmH=!Fleet.ta ? 5 : Fleet.h ? 4 : 2;
	var DivFromNext=MarksInLine<20 ? ' style="margin-right:1px;"' : '';
	var FleetTitle=(Fleet && Fleet.n) ? ' title="'+Fleet.n+(Fleet.ta ? ' ¦&gt;'+Fleet.ta+'&lt;¦' : '')+'"' : ' alt="untitled"';
	if(HasHidden){
		Out[Out.length]='<td>';
		if(Fleet.h){
			Out[Out.length]='<img src="'+StaticSiteName+'/img/lreddot.gif"'+FleetTitle+' width="'+MarkWidth+'" height="1" hspace="0" border="0"'+DivFromNext+'>';
			Out[Out.length]='<br><img src="'+StaticSiteName+'/img/z.gif"'+FleetTitle+' width="1" height="1" border="0"><br>';
			ItmH-=2;
		}
	}
	Out[Out.length]='<img src="'+StaticSiteName+'/img/'+Color+'.gif"'+FleetTitle+' width="'+MarkWidth+'" height="'+ItmH+'" hspace="0" border="0"'+DivFromNext+'>';
	if(HasHidden) Out[Out.length]='</td>';

	if(NeedBreak) Out[Out.length]=(HasHidden ? '</tr></table>' : '<br>')+
		'<img src="'+StaticSiteName+'/img/z.gif"'+FleetTitle+' width="1" height="1" border="0">'+
		(HasHidden ? '<table border="0" cellpadding="0" cellspacing="0"><tr valign="bottom">' : '<br>');
}

function GeoBlock(X, Y, show){
	var pl_geo = document.getElementById('pl_geo');

	if(show){
		var cell = document.getElementById('navigator_cell_'+X+'_'+Y);
		var PlanetInfo = GetPlanetData(X, Y);
		if(!PlanetInfo.s || pl_geo)
			return;

		var Out = new Array();
		var lq_color;

		if(PlanetInfo.lq<=0) lq_color='dred';
		else if(PlanetInfo.lq<=0.6) lq_color='lred';
		else if(PlanetInfo.lq<=1.7) lq_color='orange';
		else if(PlanetInfo.lq<=2.7) lq_color='yellow';
		else if(PlanetInfo.lq>2.7) lq_color='green';

		if(lq_color) Out[Out.length]='<img src="'+StaticSiteName+'/img/'+lq_color+'dot.gif" width="11" height="2" border="0"/>';
		Out[Out.length]='<img src="'+StaticSiteName+'/img/greendot.gif" alt="O: '+PlanetInfo.o+'" title="O: '+PlanetInfo.o+'" width="2" height="'+Math.floor(PlanetInfo.o*0.2)+'" class="graphimg"/>';
		Out[Out.length]='<img src="'+StaticSiteName+'/img/edot.gif" alt="E: '+PlanetInfo.e+'" title="E: '+PlanetInfo.e+'" width="2" height="'+Math.floor(PlanetInfo.e*0.2)+'" class="graphimg" style="margin-left:1px;"/>';
		Out[Out.length]='<img src="'+StaticSiteName+'/img/reddot.gif" alt="M: '+PlanetInfo.m+'" title="M: '+PlanetInfo.m+'" width="2" height="'+Math.floor(PlanetInfo.m*0.2)+'" class="graphimg" style="margin-left:1px;"/>';
		Out[Out.length]='<img src="'+StaticSiteName+'/img/yellowdot.gif" alt="T: '+PlanetInfo.t+'" title="T: '+PlanetInfo.t+'" width="2" height="'+Math.floor(PlanetInfo.t*0.2)+'" class="graphimg" style="margin-left:1px;"/>';

		var div = document.createElement('div');
		div.id				= 'pl_geo';
		div.style.position	= 'absolute';
		div.style.bottom	= '0px';
		div.style.right		= '1px';
		div.style.width		= '30px';
		div.className		= 'graphcell';
		cell.appendChild(div);
		div.innerHTML		= Out.join('');
	}
	else{
		if(pl_geo){
			pl_geo.parentNode.removeChild(pl_geo);
		}
	}
}

function RefreshFleetOnMap(FleetID, Fleet, X, Y, moveType){
	var oldFleetPos = document.getElementById('fleet_'+FleetID);
	var oldFleetRoot = oldFleetPos && oldFleetPos.parentNode;

	var oldOFleetPos = document.getElementById('ofleet_' + FleetID);
	var oldOFleetRoot = oldOFleetPos && oldOFleetPos.parentNode;
	var fX = Fleet.ta ? Fleet.fx : Fleet.prevX;
	var fY = Fleet.ta ? Fleet.fy : Fleet.prevY;

	var newFleetPos;
	var newFleetRoot;
	var newOFleetPos;
	var newOFleetRoot;
	var inc = document.getElementById('incubator');

	if(moveType == 0) {
		newFleetPos = oldFleetPos;
		newFleetRoot = oldFleetRoot;
		newOFleetPos = oldOFleetRoot;
		newOFleetRoot = oldOFleetPos;
	} else {
		var myFleetsBlockId = 'my_fleets_'+X+'_'+Y;
		var myFleetsBlock = document.getElementById(myFleetsBlockId+'_block');
		if(myFleetsBlock) {
			newFleetPos = null;
			newFleetRoot = myFleetsBlock;
		} else {
			var myFleetsSentinel = document.getElementById(myFleetsBlockId+'_sentinel');
			if(myFleetsSentinel) {
				//	Информер есть, а флотов нету - надо добавить
				var FleetsCanFly = [];
				var Html = DrawMyFleets(X, Y, FleetsCanFly);
				inc.innerHTML = Html;
				var el;
				while((el=inc.firstChild)){
					myFleetsSentinel.parentNode.insertBefore(el, myFleetsSentinel);
					if(inc.firstChild == el)
						inc.removeChild(el);
				}
				inc.innerHTML = '';
				if(FleetsCanFly.length)
					InitFleetDragControl(FleetsCanFly[0]);
			}
		}
		//
		if(Fleet.ta) {
			myFleetsBlockId = 'my_fleets_'+fX+'_'+fY;
			myFleetsBlock = document.getElementById(myFleetsBlockId+'_block');
			if(myFleetsBlock) {
				newOFleetPos = null;
				newOFleetRoot = myFleetsBlock;
			} else {
				var myFleetsSentinel = document.getElementById(myFleetsBlockId+'_sentinel');
				if(myFleetsSentinel) {
					//	Информер есть, а флотов нету - надо добавить
					var FleetsCanFly = [];
					var Html = DrawMyFleets(fX, fY, FleetsCanFly);
					inc.innerHTML = Html;
					var el;
					while((el=inc.firstChild)){
						myFleetsSentinel.parentNode.insertBefore(el, myFleetsSentinel);
						if(inc.firstChild == el)
							inc.removeChild(el);
					}
					inc.innerHTML = '';
					if(FleetsCanFly.length)
						InitFleetDragControl(FleetsCanFly[0]);
				}
			}
		}
	}

	if(newFleetRoot) {
		var oldFleetBlock = document.getElementById('fleet_'+FleetID+'_block');
		
		var FleetsCanFly = [];
		var Html = LDrawFleet(X, Y, Fleet, FleetsCanFly, false);
		inc.innerHTML = Html;
		newFleetRoot.insertBefore(inc.firstChild, newFleetPos);
		inc.innerHTML = '';
		document.getElementById('my_fleets_'+X+'_'+Y+'_count').innerHTML = MyFleetsCount(X, Y);
		if(FleetsCanFly.length)
			InitFleetDragControl(FleetsCanFly[0]);

		//	Откроем флот если он был открыт
		if(moveType != 1 && oldFleetBlock && oldFleetBlock.style.display != 'none') {
			ExpandSmallBlock('fleet_'+FleetID,null,X,Y);
		}
	}
	if(oldFleetRoot) {
		oldFleetRoot.removeChild(oldFleetPos);
		var count = document.getElementById('my_fleets_'+X+'_'+Y+'_count');
		if(!newFleetPos && count)
			count.innerHTML = MyFleetsCount(X, Y);
	}

	if(newOFleetRoot) {
		var Html = LDrawFleet(fX, fY, Fleet, FleetsCanFly, false);
		inc.innerHTML = Html;
		newOFleetRoot.insertBefore(inc.firstChild, newOFleetPos);
		document.getElementById('my_fleets_'+fX+'_'+fY+'_count').innerHTML = MyFleetsCount(fX, fY);
		inc.innerHTML = '';
	}
	if(oldOFleetRoot) {
		oldOFleetRoot.removeChild(oldOFleetPos);
		var count = document.getElementById('my_fleets_'+fX+'_'+fY+'_count');
		if(!newOFleetPos && count)
			count.innerHTML = MyFleetsCount(fX, fY);
	}

	//	Обновим трансферы
	if(moveType == 1)
		FleetsManageFrame.RefreshTransfers.call(this, fX, fY);
	else
		FleetsManageFrame.RefreshTransfers.call(this, X, Y);

	FixOperaInformerBorders(X+'_'+Y);
	FixOperaInformerWidth(X+'_'+Y);
	FixIEMaxHeight(X+'_'+Y);
	if(moveType != 0) {
		FixOperaInformerBorders(fX+'_'+fY);
		FixOperaInformerWidth(fX+'_'+fY);
		FixIEMaxHeight(fX+'_'+fY);
	}

	//	Обновим инфу о флотах над планетами
	if(moveType != 0) {
		RefreshFleetsBtn(X, Y);
		if(Fleet.fx){
			RefreshFleetsBtn(Fleet.fx, Fleet.fy);
		}
		if(Fleet.prevX){
			RefreshFleetsBtn(Fleet.prevX, Fleet.prevY);
		}
	}
}

function RefreshFleetsBtn(X, Y) {
	var pl = document.getElementById('navigator_cell_'+X+'_'+Y);
	if(pl){
		var FleetsBtn = DrawFleetsBtn(X, Y);
		var FleetsBtnDiv = document.getElementById('fleetsBtn_'+X+'_'+Y);
		if(FleetsBtnDiv){
			FleetsBtnDiv.innerHTML = FleetsBtn;
		} else if(FleetsBtn) {
			var div = document.createElement('div');
			div.id = 'fleetsBtn_'+X+'_'+Y;
			div.style.position	= 'absolute';
			div.style.right		= '0px';
			div.style.textAlign	= 'right';
			pl.appendChild(div);
			div.innerHTML = FleetsBtn;
		}
	}
}

function ContextMenu(clientX, clientY){	
	var planet = WndToMapCoords(clientX, clientY);
	TogglePlanetInfo(planet.x, planet.y, true);
}

var PrevInfoX = NaN;
var PrevInfoY = NaN;
function TogglePlanetInfo(X, Y, show){
	var cell	= document.getElementById('navigator_cell_'+X+'_'+Y);
	var PlanetInfo = GetPlanetData(X, Y);
	if(!PlanetInfo.x || !cell)
		return;

	var newId = 'pl_info_'+X+'_'+Y;
	var OpendDiv = document.getElementById(newId);

	if((PrevInfoX == X && PrevInfoY == Y) || show) {
		if(CurrentInfoDiv) {
			var InformerCoors = CurrentInfoDiv.planet.split('_');
			CloseInformer(CurrentInfoDiv.id);
			if(InformerCoors[0] == X && InformerCoors[1] == Y && show)
				return;
		}
		if(OpendDiv) {
			CloseInformer(newId);
			if(newId == OpendDiv.id && !show)
				return;
		}
	}
	else {
		PrevInfoX = X;
		PrevInfoY = Y;
		return;
	}

	//	создадим div для вывода информации о планете
	var InfoDiv = document.createElement('div');
	InfoDiv.id					= newId;
	InfoDiv.planet				= X+'_'+Y;
	InfoDiv.planetName			= PlanetInfo.n;

	InfoDiv.style.position		= 'absolute';
	InfoDiv.style.border		= '1px solid #EEEEEE';
	InfoDiv.style.color			= 'white';
	InfoDiv.style.cursor		= 'default';
	InfoDiv.style.padding		= '0px';
	InfoDiv.style.zIndex		= ++MaxInforerZIndex;
	InfoDiv.onmousedown			= PutInformerOnTop;
	windows.appendChild(InfoDiv);
	PrevInformerId = newId;
	CurrentInfoDiv = InfoDiv;

	InfoDiv.style.display	= 'block';
	InfoDiv.style.left		= '0px';
	InfoDiv.style.top		= '0px';

	var Out = new Array();
	Out[Out.length] = '<table cellspacing="0" cellpadding="0" style="border:0px;font-size:12px;white-space:nowrap;" cols="1">';
	Out[Out.length] = '<tr><td style="height:14px;background-color:#DDDDDD;white-space:nowrap;"><span style="padding:0px 2em;color:black;">'+PlanetInfo.n+'</span></td></tr>';

	Out[Out.length] = '<tr id="'+newId+'_block"><td style="white-space:nowrap;padding: 3px 1px 1px 3px;background-color:black;'+
						(BrowserDetect.browser == 'Explorer' ? 'filter:alpha(opacity=85)' : 'opacity:0.85')+';">';
	Out[Out.length] = '<span style="font-weight: bold;font-size:110%;">'+PlanetInfo.n+'</span> <span style="display:none">'+X+':'+Y+' </span>';
	Out[Out.length] = '<input type="text" style="text-align:center;height:12px;border:0px;padding:0px;'+
						'width:60px;color:#66CCFF;background-color:transparent;'+
						(BrowserDetect.browser == 'Explorer' ? 'position:relative;top:-2px;' : '')+'" '+
						'value="'+X+':'+Y+'" onclick="this.select()" oncontextmenu="this.select();return true;" readonly="readonly"/>';
	Out[Out.length] = '<a href="javascript:FleetsManageFrame.openPlanetLogs('+X+','+Y+');" class="nounder" title="'+GetLangMSG(1323)+'">[?]</a><br/>';

	if(PlanetInfo.on)
		Out[Out.length] = window.parent.GetLangMSG(1288)+': <a href="javascript:HelpWnd(\''+WorldHost(PlanetInfo.oi)+'/frames/playerinfo/on/'+PlanetInfo.oi+'/\')">'+PlanetInfo.on+'</a><br/>';
	if(PlanetInfo.s)
		Out[Out.length] = '<span class="o" title="O">'+PlanetInfo.o+'</span>; '+
						'<span class="e" title="E">'+PlanetInfo.e+'</span>; '+
						'<span class="m" title="M">'+PlanetInfo.m+'</span>; '+
						'<span class="t" title="T">'+PlanetInfo.t+'</span>; '+
						'<span title="S">'+PlanetInfo.s+'</span>; '+
						(isNaN(PlanetInfo.lq) ? '' : (PlanetInfo.lq > 0 ? '+' : '') + (PlanetInfo.lq / 10) + '%<br/>');
	else
		Out[Out.length] = window.parent.GetLangMSG(1289)+': ~'+PlanetInfo.is+'x<br/>';

	var MyFleetsHere = window.parent.frames.flets_frame.FleetsByXY[X+':'+Y] || [];
	var MyOutgoingFleetsHere = window.parent.frames.flets_frame.OutgoingFleetsByXY[X+':'+Y] || [];
	var ForeighnFleetsHere = window.parent.frames.foreighn_fleets_frame.ForeighnFleetsByXY[X+':'+Y] || [];
	var FleetsCanFly = [];

	Out[Out.length] = '<div id="'+newId+'_fleets_container" style="margin-bottom:0px;max-height:'+MaxFleetsHeight+'px; overflow: auto; padding: 1px 18px 1px 1px;">';
	var myFleetsBlockId = 'my_fleets_'+X+'_'+Y;
	if(MyFleetsHere.length || MyOutgoingFleetsHere.length || PlanetInfo.d == -10) {
		Out[Out.length] = DrawMyFleets(X, Y, FleetsCanFly);
	}
	Out[Out.length] = '<div id="' + myFleetsBlockId + '_sentinel"></div>';

	var foreighnFleetsBlockId = 'foreighn_fleets_'+X+'_'+Y;
	if(ForeighnFleetsHere.length){
		Out[Out.length] = '<a style="font-size:120%;" class="small_spoiler_white" href="#" onclick="ExpandSmallBlock(\''+foreighnFleetsBlockId+'\',null,'+X+','+Y+')"><img src="'+StaticSiteName+'/img/collapse_small.gif" alt="" width="10" height="13" border="0" id="'+foreighnFleetsBlockId+'_arrow"/> '+parent.GetLangMSG(1290)+' - ';
		Out[Out.length] = '<span id="'+foreighnFleetsBlockId+'_count">';
		var ForeighnFleetsCounterRow = Out.length;
		Out[Out.length] = '';
		Out[Out.length] = '</span>';
		Out[Out.length] = '</a>';

		var ForeighnFleetsCount = {'-1':0,'0':0,'1':0,'2':0,'3':0,'4':0};
		Out[Out.length] = '<div id="'+foreighnFleetsBlockId+'_block" style="display: block;">';
		for(var i = 0; i < ForeighnFleetsHere.length; i++) {
			var Fleet = ForeighnFleetsHere[i];
			Out[Out.length] = LDrawFleet(X, Y, Fleet, null, true);
			ForeighnFleetsCount[!isNaN(Fleet.rel) ? Fleet.rel : -1]++;
		}
		Out[Out.length] = '</div>';

		var CountHtml = [];
		var rels = [0, 1, 2, 3, 4, -1];
		for(var rel_i in rels){
			var rel = rels[rel_i];
			CountHtml[CountHtml.length] = '<span class="allien_fleet_' + (rel == -1 ? 'nn' : rel) + '">' + ForeighnFleetsCount[rel] + '</span>';
		}
		Out[ForeighnFleetsCounterRow] = CountHtml.join(', ');
	}
	Out[Out.length] = '<div id="' + foreighnFleetsBlockId + '_sentinel"></div>';

	Out[Out.length] = '</div></td></tr>';
	Out[Out.length] = '</table>';

	InfoDiv.innerHTML = Out.join('');

	FixIEMaxHeight(newId);

	//	init fleet drag controls
	for(var i = 0; i < FleetsCanFly.length; i++) {
		var Fleet = FleetsCanFly[i];
		InitFleetDragControl(Fleet);
	}

	//	on drag convert to draggable "fleets manager"
	Drag.init(InfoDiv.getElementsByTagName('td')[0], InfoDiv);
	InfoDiv.onDragStart = PinInformer;

	//	Подвинем див, если он вылез за пределы области
//	FixOperaInformerWidth(newId);
	RePositionPlanetInfo(X, Y);

	PrevInfoX = X;
	PrevInfoY = Y;
}
function RePositionPlanetInfo(X, Y){
	var InfoDiv = document.getElementById('pl_info_'+X+'_'+Y);
	var cell	= document.getElementById('navigator_cell_'+X+'_'+Y);
	if(!InfoDiv || !cell)
		return;
	var newLeft = MapTable.offsetLeft + cell.offsetLeft + MapCellPixels + 1;
	var newTop = MapTable.offsetTop + cell.offsetTop;

	var table = InfoDiv.firstChild;
	if(newLeft + InfoDiv.clientWidth >= tacticalmap.clientWidth)
		InfoDiv.style.left	= (MapTable.offsetLeft + cell.offsetLeft - InfoDiv.clientWidth - 2) + 'px';
	else
		InfoDiv.style.left	= newLeft + 'px';

	if(newTop + InfoDiv.clientHeight >= tacticalmap.clientHeight)
		InfoDiv.style.top	= (MapTable.offsetTop + cell.offsetTop - InfoDiv.clientHeight) + 'px';
	else
		InfoDiv.style.top	= newTop + 'px';
}

function MovePlanetInfo(DX, DY){
	if(!CurrentInfoDiv || CurrentInfoDiv.style.display == 'none')
		return;

	var x = parseInt(CurrentInfoDiv.style.left) - DX;
	var y = parseInt(CurrentInfoDiv.style.top) - DY;

	if(x + CurrentInfoDiv.clientWidth < 0 || x > tacticalmap.clientWidth ||
		y + CurrentInfoDiv.clientHeight < 0 || y > tacticalmap.clientHeight){
		CloseInformer(CurrentInfoDiv.id);
		return;
	}

	CurrentInfoDiv.style['left'] = x + 'px';
	CurrentInfoDiv.style['top'] = y + 'px';
}

function PinInformer() {
	this.onDragStart = new Function();
	CurrentInfoDiv = null;

	var coords = this.planet.split('_');
	var X = coords[0], Y = coords[1];
	this.getElementsByTagName('td')[0].innerHTML =
		'<div style="background-color:#DDDDDD;border:0px;color:black;font-size:1em;width:2em;float:left;">' +
		'<a href="javascript:ExpandSmallBlock(\''+this.id+'\',OnInformerToggle)" class="super_black" ><img src="'+StaticSiteName+'/img/collapse_small_b.gif" alt="" width="10" height="10" border="0" id="'+this.id+'_arrow"/>&nbsp;&nbsp;</a></div>' +
		'<div style="float:left;color:black;"> ' + this.planetName + ' </div>' +
		'<div style="width:27px;white-space:nowrap;padding-left:5px;padding-right:4px;float:right;">' +
//			'<a href="#" class="super_black">✔</a> ' +
			'<a href="javascript:ScrollMapTo('+X+','+Y+')" onmouseover="BlinkItem('+X+','+Y+')" class="super_black"><img src="'+StaticSiteName+'/img/black_dot.gif" alt="->" style="width:11px;height:11px;border:0px;margin-right:5px;"/></a>' +
			'<a href="javascript:CloseInformer(\''+this.id+'\')" class="super_black"><img src="'+StaticSiteName+'/img/close_info.gif" alt="[X]" style="width:11px;height:11px;border:0px;"/></a>' +
		'<div>';
}

function CloseInformer(id) {
	var InfoDiv = document.getElementById(id);
	if(InfoDiv) {
		InfoDiv.parentNode.removeChild(InfoDiv);
		if(CurrentInfoDiv && CurrentInfoDiv.id == id)
			CurrentInfoDiv = null;
	}
}

var MaxInforerZIndex = 110;
var PrevInformerId;
function PutInformerOnTop() {
	if(this.id == PrevInformerId)
		return;
	this.style.zIndex = ++MaxInforerZIndex;
	PrevInformerId = this.id;
}

function ExpandSmallBlock(id, onToggle, plX, plY) {
	var block = document.getElementById(id + '_block');
	var arrow = document.getElementById(id + '_arrow');
	if(!block)
		return;
	if(block.style.display == 'none'){
/*		var display = 'block';
		if(block.tagName.toLowerCase() == 'tr')
			display = 'table-row';
		else if(block.tagName.toLowerCase() == 'td')
			display = 'table-cell';
*/
		block.style.display = '';
		if(arrow)
			arrow.src = arrow.src.replace('expand', 'collapse');
		if(onToggle)
			onToggle(id, true);
	} else {
		if(onToggle)
			onToggle(id, false);
		block.style.display = 'none';
		if(arrow)
			arrow.src = arrow.src.replace('collapse', 'expand');
	}

	if(plX)
		FixOperaInformerWidth(plX+'_'+plY);
	else
		FixOperaInformerWidth(id);
	
	if(plX)
		FixIEMaxHeight(plX+'_'+plY);
	else
		FixIEMaxHeight(id);
//	FixOperaInformerBorders(id);
	//	Unfocus <a>
	if(document.activeElement && document.activeElement.tagName.toLowerCase() == 'a')
		document.activeElement.blur();
}

function OnInformerToggle(id, show){
	var InfoDiv = document.getElementById(id);
	var cell = InfoDiv.childNodes[0].rows[0].cells[0];
	if(!show) {
		var width = cell.offsetWidth;// - (BrowserDetect.browser == 'Explorer' ? 0 : 1);
		cell.style.width = width+'px';
//		InfoDiv.style.maxWidth = width+'px';
	} else {
		cell.style.width = '';
//		InfoDiv.style.maxWidth = '';
	}
}

function DrawMyFleets(X, Y, FleetsCanFly){
	var MyFleetsHere = window.parent.frames.flets_frame.FleetsByXY[X+':'+Y] || [];
	var MyOutgoingFleetsHere = window.parent.frames.flets_frame.OutgoingFleetsByXY[X+':'+Y] || [];
	var Out = [];
	var myFleetsBlockId = 'my_fleets_'+X+'_'+Y;

	Out[Out.length] = '<a style="font-size:120%;" class="small_spoiler_white" href="javascript:ExpandSmallBlock(\''+myFleetsBlockId+'\',null,'+X+','+Y+')"><img src="'+StaticSiteName+'/img/collapse_small.gif" alt="" width="10" height="13" border="0" id="'+myFleetsBlockId+'_arrow"/> '+parent.GetLangMSG(637)+' - ';
	Out[Out.length] = '<span id="'+myFleetsBlockId+'_count">';
	Out[Out.length] = MyFleetsCount(X, Y);
	Out[Out.length] = '</span>';
	Out[Out.length] = '</a>';

	Out[Out.length] = '<span id="new_fleet_btn_'+X+'_'+Y+'">';
	Out[Out.length] = NewFleetButton(X, Y);
	Out[Out.length] = '</span>';

	Out[Out.length] = '<div id="'+myFleetsBlockId+'_block" style="display:block;">';
	for(var i = 0; i < MyFleetsHere.length; i++) {
		var Fleet = MyFleetsHere[i];
		Out[Out.length] = LDrawFleet(X, Y, Fleet, FleetsCanFly);
	}

	for(var i = 0; i < MyOutgoingFleetsHere.length; i++) {
		var Fleet = MyOutgoingFleetsHere[i];
		Out[Out.length] = LDrawFleet(X, Y, Fleet);
	}
	Out[Out.length] = '</div>';
	return Out.join('');
}

function MyFleetsCount(X, Y){
	var IncomingCount = 0;
	var MyFleetsHere = window.parent.frames.flets_frame.FleetsByXY[X+':'+Y] || [];
	var MyOutgoingFleetsHere = window.parent.frames.flets_frame.OutgoingFleetsByXY[X+':'+Y] || [];
	for(var i = 0; i < MyFleetsHere.length; i++) {
		if(MyFleetsHere[i].ta)
			IncomingCount++;
	}
	return '<span style="color:#ffffff;">' + (MyFleetsHere.length - IncomingCount) +
			'</span>, <span style="color:#bbbdbf">' + IncomingCount +
			'</span>, <span style="color:#427376">' + MyOutgoingFleetsHere.length + '</span>';
}

function NewFleetButton(X, Y){
	return ' <a class="small nounder" href="javascript:parent.CreateFleetQuick(FleetsManageFrame.RedrawFleetOnLoad,{x:'+X+',y:'+Y+'})">['+GetLangMSG(1314)+']</a></span>';
}

var IncomingFleetPseudoId = 1;
function LDrawFleet(X, Y, Fleet, FleetsCanFly, allien) {
	var Out = [];
	var outgoing = Fleet.ta && !Fleet.it && Fleet.fx == X && Fleet.fy == Y;
	var blink_scroll = (outgoing ? Fleet.x+','+Fleet.y : Fleet.fx+','+Fleet.fy);
	var htmlId = (allien ? 'a' : outgoing ? 'o' : '')+'fleet_' + (Fleet.i || IncomingFleetPseudoId++);

	var MarkClass = Fleet.rn == -1 ? 'allien_fleet_nn' : Fleet.l ? 'dlbl_' + Fleet.l : 'allien_fleet_' + Fleet.rn;

//	TODO: check width
	Out[Out.length] = '<table cellpadding="0" cellspacing="0" border="0" style="margin-left:5px;width:98%;"';
	if(Fleet.i)
		Out[Out.length] = ' id="'+htmlId+'"';
	if(Fleet.ta)
		Out[Out.length] = ' onmouseover="BlinkItem('+blink_scroll+')"';
	Out[Out.length] = '><tr style="font-size:80%;">';

	if(!allien) {
		Out[Out.length] = '<td style="text-align:right;padding-right:'+(allien ? '0' : '3')+'px;width:13px;">';
		Out[Out.length] = '<div style="white-space:nowrap;">';
		if(!Fleet.ta && Fleet.un.length && !Fleet.fa.length && !parent.Actions['f'+Fleet.i] && !Fleet.fa.a2 && !Fleet.fa.a1) {
			FleetsCanFly.push(Fleet);
			Out[Out.length] = '<div id="fleet_dragger_'+(Fleet.i)+'" style="display:block;"><img src="'+StaticSiteName+'/img/fleet_dragger.gif" style="border:0px;width:13px;height:14px;"/></div>';
		} else if(Fleet.ta && !Fleet.it) {
			Out[Out.length] = '<a href="javascript:parent.CancelJumpQuick('+Fleet.i+',FleetsManageFrame.RedrawFleetOnLoad)"><img src="'+StaticSiteName+'/img/cancel_jump.gif" style="border:0px;width:13px;height:14px;"/></a>';
		} else {
			if (FleetsManageFrame.HasActions(Fleet))
				Out[Out.length]=' <span class="o">+</span><br/>';
			Out[Out.length] = '<img src="'+StaticSiteName+'/img/z.gif" alt="" width="13" height="1" border="0">';
		}
		Out[Out.length] = '</div>';
		Out[Out.length] = '</td>';
	}
	else {
		Out[Out.length] = '<td style="width:17px;"></td>';
	}

	Out[Out.length] = '<td style="padding: 0px 1px; white-space:nowrap;width:99%;">';
	var expander = allien && !Fleet.ta ? 'ExpandAlienFleet' : 'ExpandSmallBlock';
	Out[Out.length] = '<a class="small_spoiler_white" style="white-space:nowrap;" href="javascript:'+expander+'(\''+htmlId+'\',null,'+Fleet.x+','+Fleet.y+');"><div style="float:left"><img src="'+StaticSiteName+'/img/expand_small.gif" alt="" width="10" height="13" border="0" id="'+htmlId+'_arrow"/></div>';
	if(Fleet.oi)
		Out[Out.length]='<b class="'+MarkClass+'">{</b>';

	Out[Out.length] = '<span style="white-space:nowrap;" class="'+(Fleet.ta > 0?'grayed':'')+'">';
	Out[Out.length] = (Fleet.n ? Fleet.n : parent.GetLangMSG(244));
	if(allien) {
		var fleet_class = 'allien_fleet_nn';
		if(Fleet.l)
			fleet_class = 'dlbl_' + Fleet.l;
		else if(Fleet.rel != -1)
			fleet_class = 'allien_fleet_' + Fleet.rel;
		Out[Out.length] = ' <span class="'+fleet_class+'">('+Fleet.s+', '+Fleet.w+')</span>';
	}
	else {
		Out[Out.length] = ' ('+Fleet.s+', '+ Fleet.cb + (Fleet.i != 0 && Fleet.cc != 0 ? '/'+Fleet.cc:'') + ', '+Fleet.tb + (Fleet.i != 0 && Fleet.tc != 0 ? '/'+Fleet.tc:'')+') ' + Fleet.sp.toFixed(2);
	}
	if(allien && Fleet.sh){
		Out[Out.length] = '<span class="o bold">*</span>';
	}

	if(Fleet.m) {
		Out[Out.length]=' <small><span class="'+(Fleet.o > 0?'ok">(S)':'hot1"><b>(S)</b>')+'</span></small>';
	} else if (Fleet.sa > 0) {
		Out[Out.length]=' <small> (s)</small>';
	}
	if(Fleet.h > 0) {
		Out[Out.length]=' <span class="'+(allien ? 'hot1' : 'silver')+'">h'+(Fleet.t?'<span class="hot1 bold">'+Fleet.t+'</span>':'')+(allien && !Fleet.rs && !Fleet.sh ? '*' : '')+'</span>';
	}
	Out[Out.length] = '</span>';

	if (Fleet.oi)
		Out[Out.length]='<b class="'+MarkClass+'">}</b>';

	Out[Out.length] = '</a>';
	if(Fleet.ta) {
		Out[Out.length] = ' <a href="javascript:ScrollMapTo('+blink_scroll+');" style="white-space:nowrap;">'+(outgoing ? '-&gt;' : '&lt;-') + Fleet.ta + '</a>';
	}

	Out[Out.length] = '</td></tr>';

	Out[Out.length] = '<tr id="'+htmlId+'_block" style="display:none;"><td colspan="2" class="live_fleet_manager">';
	Out[Out.length] = LDrawFleetManager(X, Y, Fleet, FleetsCanFly, allien);
	Out[Out.length] = '</td></tr>';
	Out[Out.length] = '</table>';

	return Out.join('');
}

function LDrawFleetManager(X, Y, Fleet, FleetsCanFly, allien) {
	var Out = [];
	if(allien) {
		Out[Out.length] = '<div style="font-size:80%;border-top:1px solid white;margin-top:1px;">';
		if(Fleet.ta > 0) {
			Out[Out.length] = GetLangMSG(136)+'<a href="javascript:ScrollMapTo('+Fleet.fx+','+Fleet.fy+')" onmouseover="BlinkItem('+Fleet.fx+','+Fleet.fy+')">'+Fleet.fpln+'</a>.';
			
			Out[Out.length] = '<table border="0" cellpadding="0" cellspacing="0" width="80%">'
			Out[Out.length] = '<tr><th class="reporttable" align="left" colspan="2">'+GetLangMSG(237)+'</th></tr>'
			Out[Out.length] = '<tr><td class="reporttable">'+GetLangMSG(238)+'</td>';
			Out[Out.length] = '<td class="reporttable" align="right">'+Fleet.s+'</td></tr>';
			Out[Out.length] = '<tr><td class="reporttable">'+GetLangMSG(239)+'</td>';
			Out[Out.length] = '<td class="reporttable" align="right">'+Fleet.w+'</td></tr>';
			if(Fleet.h > 0){
				Out[Out.length] = '<tr><td class="reporttable" colspan="2"><span class="hot2">'+GetLangMSG(427)+'</span></td></tr>';
			}
			Out[Out.length] = '</table>';
		}
		else {
			Out[Out.length] = '<div>';
			Out[Out.length] = GetLangMSG(1288)+': <a href="javascript:HelpWnd(\''+WorldHost(Fleet.p)+'/frames/playerinfo/on/'+Fleet.p+'/\')" target="_top">'+Fleet.pn+'</a>';
			Out[Out.length] = ' (<strong>'+FleetsManageFrame.dips['d'+Fleet.rel]+'</strong>)';
			Out[Out.length] = '</div>';
			Out[Out.length] = '<div id="allien_fleet_'+Fleet.i+'"></div>';
		}
		Out[Out.length] = '</div>';
	}
	else {
		Out[Out.length] = '<table class="fleetstate" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid white;margin-top:1px;padding-left:6px">';
		if (Fleet.oi){
			Out[Out.length]='<tr><td style="background-color:grey;color:white;" colspan="2"><small>'+GetLangMSG(1288)+': <a href="javascript:HelpWnd(\''+WorldHost(Fleet.oi)+'/frames/playerinfo/on/'+Fleet.oi+'/\')" target="_top">'+Fleet.on+'</a></small></td></tr>';
		}
		if (Fleet.un.length){
			Out[Out.length] = '<tr><td><small style="white-space:nowrap;">'+GetLangMSG(166)+': '+Fleet.r.toFixed(2);
			if (Fleet.st){
				Out[Out.length]='<br/>'+GetLangMSG(430)+': '+Fleet.st.toFixed(2);
			}
			
			Out[Out.length]='</small></td><td align="right">';
			if (Fleet.ta || Fleet.fa.length || FleetsManageFrame.HasActions(Fleet) || Fleet.fa.a2 || Fleet.fa.a1){
				Out[Out.length]='&nbsp;';
			} else {
				var IsAtHome=Fleet.oi || Fleet.hm?1:0;
				Out[Out.length]='<input type="button" value="'+GetLangMSG(137)+'…" onclick="parent.JumpFleetToQuick('+Fleet.i+','+Fleet.r+','+Fleet.sp+','+IsAtHome+','+Fleet.x+','+Fleet.y+',RedrawFleetOnLoad)" class="longbutn">';
			}
			Out[Out.length]='</td></tr>';
			
			if (Fleet.st && !Fleet.ta){
				FleetsManageFrame.Out.length = 0;
				Out[Out.length] = '<tr><td colspan="2">';
				FleetsManageFrame.HideFleetLink(Fleet);
				Out[Out.length] = FleetsManageFrame.Out.join('');
				Out[Out.length]='</td></tr>'
			}
			
			if(!Fleet.ta){
				FleetsManageFrame.Out.length = 0;
				Out[Out.length] = '<tr><td colspan="2">';
				FleetsManageFrame.FleetBehaviour(Fleet);
				Out[Out.length] = FleetsManageFrame.Out.join('');
				if(BrowserDetect.browser == 'Explorer' || (BrowserDetect.browser == 'Firefox' && BrowserDetect.version < 3))
					Out[Out.length-1] = Out[Out.length-1].replace(/ExpandNewsItem\('([^']*)'\)/g, 'ExpandNewsItemWraper(\'$1\','+X+','+Y+')');
				Out[Out.length]='</td></tr>'
			}
			Out[Out.length] = '</td></tr></table>';
		
			Out[Out.length]='<table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size:85%;">';
			FleetsManageFrame.Out.length = 0;
			FleetsManageFrame.DrawUnitsList(Fleet,true);
			Out[Out.length] = FleetsManageFrame.Out.join('');
			if(BrowserDetect.browser == 'Explorer' || (BrowserDetect.browser == 'Firefox' && BrowserDetect.version < 3))
				Out[Out.length-1] = Out[Out.length-1].replace(/ExpandNewsItem\('([^']*)'\)/g, 'ExpandNewsItemWraper(\'$1\','+X+','+Y+')');
		} else {
			Out[Out.length]='<small>'+'('+GetLangMSG(96)+')</small>';
		}
		Out[Out.length]='</table>';
	}
	return Out.join('');
}

function ExpandNewsItemWraper(i,X,Y){
	ExpandNewsItem(i);
	FixIEMaxHeight(X+'_'+Y);
	FixOperaInformerWidth(X+'_'+Y);
}

function ExpandAlienFleet(id, onToggle, plX, plY){
	ExpandSmallBlock(id, onToggle, plX, plY);

	var fleetId = /(\d+)/.exec(id)[1];
	var IfDiv = document.getElementById('allien_fleet_'+fleetId);
	if(IfDiv.innerHTML.length)
		return;
	if(AllienFleetsLoaded['m'+fleetId]){
		IfDiv.innerHTML=AllienFleetsLoaded['m'+fleetId];
		return;
	}
	if(IfDiv)
		IfDiv.innerHTML='<div class="loading">'+FleetsManageFrame.msgLoading+'...<iframe src="/blackframes/load_allien_fleet/on/'+fleetId+'/" name="iframe_allien_fleet_'+fleetId+'" id="iframe_allien_fleet_'+id+'" width="0" height="1" marginheight="0" marginwidth="0" scrolling="Auto" vspace="0" hspace="0" frameborder="0"></iframe></div>';
}

function _JSLoadEndLive(ItemID,Name,DivName){
	var IfDif=document.getElementById(DivName+ItemID);
	if(IfDif)
		document.getElementById(DivName+ItemID).innerHTML=AllienFleetsLoaded['m'+ItemID]=window['iframe_'+Name+'_'+ItemID].document.body.innerHTML.replace(/(height|width)="?40"?/g, '$1="20"');
}

function InitFleetDragControl(Fleet){
	var FleetID = Fleet.i;
	var Dragger = document.getElementById('fleet_dragger_'+FleetID);
	Drag.init(Dragger, Dragger, true);
	var jumpInfo;
	var Planet;
	var RealDrawRes = DrawRes;
	var scrollArrows = [];

	Dragger.onDragStart = function() {
		InDrag = true;
		//	Прицепим драгер к контейнеру окон
		this.style.position = 'absolute';
		this.style.left = (this.DrugMouseX - 7)+'px';
		this.style.top = (this.DrugMouseY - 7)+'px';
		if(this.realParent) 
			return;
		//	Это первая инициализация (последующие возникают когда курсор покидает iframe и возвращается назад)
		this.realParent = this.parentNode;
		this.parentNode.removeChild(this);
		windows.appendChild(this);
		this.style.zIndex = 2030;

		jumpInfo = document.createElement('div');
		jumpInfo.style.position		= 'absolute';
		jumpInfo.style.left			= '20px';
		jumpInfo.style.top			= '20px';
		jumpInfo.style.border		= '1px solid #EEEEEE';
		jumpInfo.style.color		= 'white';
		jumpInfo.style.padding		= '2px';
		jumpInfo.style.backgroundColor = 'black';
		jumpInfo.style.opacity		= '0.80';
		if(BrowserDetect.browser == 'Explorer')
			jumpInfo.style.filter	= 'alpha(opacity=80)';
		jumpInfo.style.textAlign	= 'center';
		jumpInfo.style.fontSize		= '10px';
		jumpInfo.style.whiteSpace	= 'nowrap';

		var PlanetData = GetPlanetData(Fleet.x, Fleet.y);
		jumpInfo.innerHTML = '<span style="font-weight: bold; font-size: 110%;">'+Fleet.pn+
			(PlanetData.on ? ' (<span style="color:'+PlanetColor(Fleet.x, Fleet.y)+';">'+PlanetData.on+'</span>)' : '')+'</span><br/>'+parent.GetLangMSG(103)+': 0 (0/'+Fleet.r+')';
		this.appendChild(jumpInfo);
		RePositionJumpInfo(this.DrugMouseX, this.DrugMouseY, jumpInfo);

		Planet = {x: Fleet.x, y: Fleet.y, informer: 1};
		//	Выключим прорисовку ресурсов - в ФФ меньше лагов будет.
		DrawRes = false;

		CollapsInformers(true);
		ColorJumpablePlanets(Fleet);
		ColorTargetPlanet(Fleet.x, Fleet.y);
		
		//	Покажем стрелки прокрутки карты
		var base_img = document.createElement('img');
		base_img .style.position = 'absolute';
		var tm = document.getElementById('tacticalmap');
		var hc = document.getElementById('hcoords');
		var vc = document.getElementById('vcoords');
		var ch = ['u', 'd', 'l', 'r'];
		var pos = [[tm.offsetWidth/2 - 30, hc.offsetHeight], [tm.offsetWidth/2 - 30, tm.offsetHeight - 20],
				   [vc.offsetWidth, tm.offsetHeight/2 - 30], [tm.offsetWidth - 20, tm.offsetHeight/2 - 30]];
		
		for(var i = 0; i < 4; i++){
			var img = base_img.cloneNode(false);
			img.src = StaticSiteName+'/img/arrow_'+ch[i]+'.gif';
			img.style.left = Math.round(pos[i][0])+'px';
			img.style.top = Math.round(pos[i][1])+'px';
			img.style.width = (i < 2 ? 60 : 20)+'px';
			img.style.height = (i < 2 ? 20 : 60)+'px';
			img.scrollDir = ch[i];
			scrollArrows[i] = img;
			windows.appendChild(img);
		}
	}
	Dragger.onDragEnd = function(e) {
		InDrag = false;
		if(!(Fleet.x == Planet.x && Fleet.y == Planet.y))
			parent.JumpFleetToQuick(FleetID, Fleet.r, Fleet.sp, Fleet.oi || Fleet.hm?1:0, Fleet.x, Fleet.y, FleetsManageFrame.RedrawFleetOnLoad, Planet.x+':'+Planet.y, true);

		//	востановим позицию драгера
		this.style.position = 'static';
		this.style.left = '0px';
		this.style.top = '0px';
		this.parentNode.removeChild(this);
		this.realParent.appendChild(this);
		this.realParent = null;
		this.style.zIndex = '';

		this.removeChild(jumpInfo);
		jumpInfo = null;
		DrawRes = RealDrawRes;

		//	Уберём стрелки прокрутки
		for(var i = 0; i < scrollArrows.length; i++){
			windows.removeChild(scrollArrows[i]);
		if(Scrolling) {
			clearInterval(Scrolling);
			Scrolling = false;
			EndMapDrag();
		}

		CollapsInformers(false);
		UnColorJumpablePlanets();
		UnColorTargetPlanet(Planet.x, Planet.y);
		}
		scrollArrows.length = 0;
	}
	//	Покажем инфу о времени полёта и т.п.
	var PrevPlanet = {x: Fleet.x, y: Fleet.y};
	var Scrolling = false;
	Dragger.onDrag = function() {
		var clientX = this.DrugMouseX;
		var clientY = this.DrugMouseY;
		Planet = null;

//		console.log("DrugMouseX = %d", clientX);
//		console.log("DrugMouseY = %d", clientY);

		//	пробежимся по информерам
		var informers = document.getElementById('windows').childNodes;
		var top_zIndex = 0;
		var onScroller = false;
		for(var i = 0; i < informers.length; i++) {
			var informer = informers[i];
			if(informer.offsetLeft < clientX && informer.offsetLeft + informer.offsetWidth > clientX &&
				informer.offsetTop < clientY && informer.offsetTop + informer.offsetHeight > clientY) {
					if(informer.scrollDir) {
						onScroller = informer.scrollDir;
						break;
					}
					else if(informer.id && informer.id.match(/^pl_info/) &&
						top_zIndex < informer.style.zIndex) {
						//	похоже надо отправить флот на планету этого информера
						var coords = informer.planet.split('_');
						Planet = {x: coords[0], y: coords[1]};
						top_zIndex = informer.style.zIndex;
					}
				}
		}
		if(onScroller && !Scrolling){
			//	Запускаем прокрутку
			var dx = onScroller == 'l' ? -ScrollSpeed : onScroller == 'r' ? ScrollSpeed : 0;
			var dy = onScroller == 'u' ? -ScrollSpeed : onScroller == 'd' ? ScrollSpeed : 0;
			Scrolling = setInterval(function() {
				var x = parseInt(MapTable.style.left);
				var y = parseInt(MapTable.style.top);

				MapTable.style['left'] = (x - dx) + 'px';
				MapTable.style['top'] = (y - dy) + 'px';
				MapDrag(dx, dy); }, ScrollInterval);
			return;
		}
		else if(!onScroller && Scrolling) {			
			clearInterval(Scrolling);
			Scrolling = false;
			EndMapDrag();
			ColorJumpablePlanets(Fleet);
		}
		//	если в информер не попали - значит попали в планету
		if(!Planet) {
			Planet = WndToMapCoords(this.DrugMouseX, this.DrugMouseY);
		}
//		console.log("[x, y] = [%d, %d]", Planet.x, Planet.y);

		if(PrevPlanet.x == Planet.x && PrevPlanet.y == Planet.y) {
			RePositionJumpInfo(this.DrugMouseX, this.DrugMouseY, jumpInfo);
			return;
		}

		var dist = distance(Planet.x, Planet.y, Fleet.x, Fleet.y);
		var tta = (CanJump(Fleet, Planet.x, Planet.y) ? '<span class="ok bold">' : '<span class="m bold">')+Math.ceil(dist / Fleet.sp);
		var PlanetData = GetPlanetData(Planet.x, Planet.y);
		jumpInfo.innerHTML = '<span style="font-weight: bold; font-size: 110%;">'+PlanetData.n+
			(PlanetData.on ? ' (<span style="color:'+PlanetColor(Planet.x, Planet.y)+';">'+PlanetData.on+'</span>)' : '')+'</span><br/>'+
			parent.GetLangMSG(103)+': '+tta+'</span> ('+Math.ceil(dist*100)/100+'/'+Math.ceil(Fleet.r*100)/100+')';
		RePositionJumpInfo(this.DrugMouseX, this.DrugMouseY, jumpInfo);

		UnColorTargetPlanet(PrevPlanet.x, PrevPlanet.y);
		ColorTargetPlanet(Planet.x, Planet.y);
		PrevPlanet = Planet;
	}
}

function RePositionJumpInfo(clientX, clientY, jumpInfo){
	//	Подвинем информер, если он вылез за пределы области
	if(clientX + jumpInfo.clientWidth + 20 > tacticalmap.clientWidth){
		jumpInfo.style.left = -(clientX + jumpInfo.clientWidth - tacticalmap.clientWidth)+'px';
	} else if(jumpInfo.style.left != '20px') {
		jumpInfo.style.left = '20px';
	}
	if(clientY + jumpInfo.clientHeight + 20 > tacticalmap.clientHeight){
		jumpInfo.style.top = '';
		jumpInfo.style.bottom = '20px';
	} else if(jumpInfo.style.bottom) {
		jumpInfo.style.top = '20px';
		jumpInfo.style.bottom = '';
	}
}

var CollapsedInformers = [];
function CollapsInformers(collaps) {
	if(collaps) {
		var informers = document.getElementById('windows').childNodes;
		for(var i = 0; i < informers.length; i++) {
			var informer = informers[i];
			if(informer.id && informer.id.match(/^pl_info/) &&
			   document.getElementById(informer.id + '_block').style.display != 'none') {
				ExpandSmallBlock(informer.id, OnInformerToggle);
				CollapsedInformers.push(informer.id);
			}
		}
	} else {
		for(var i in CollapsedInformers) {
			ExpandSmallBlock(CollapsedInformers[i], OnInformerToggle);
		}
		CollapsedInformers.length = 0;
	}
}

function ColorJumpablePlanets(Fleet){
	parent.BlockBlink(true);
	for(var i in MapTable.childNodes) {
		var cell = MapTable.childNodes[i];
		if(!cell.id)
			continue;

		var coords = cell.id.split('_');
		var X = coords[2];
		var Y = coords[3];
		var color;
		if(X == Fleet.x && Y == Fleet.y) {
			color = 'transparent';
		} else {
			var dist = distance(X, Y, Fleet.x, Fleet.y);
			var tta = Math.ceil(dist / Fleet.sp);
			var maxTurns = Math.ceil(Fleet.r / Fleet.sp);
//			var part = Math.round((jumpColors.length - 1) * tta / maxTurns);
//			console.log('dist = %d, tta = %d, maxTurns = %d, part = %d', dist, tta, maxTurns, part);
			if(!CanJump(Fleet, X, Y))
				color = notJumpable;
			else {
				if(tta > 10)
					color = jumpColors[4];
				else if (tta > 3)
					color = jumpColors[3];
				else
					color = jumpColors[tta - 1];
			}
		}
		cell.style.backgroundColor = color;
	}
}

function UnColorJumpablePlanets(){
	for(var i in MapTable.childNodes) {
		var cell = MapTable.childNodes[i];
		if(!cell.id)
			continue;
		var cell_color = cell.getAttribute('cell_color');
		cell.style.backgroundColor = cell_color ? cell_color : 'transparent';
	}
	parent.BlockBlink(false);
}

function ColorTargetPlanet(X, Y){
	ColorPlanetBorder(X, Y, 'target');
	FixOperaMapRedraw();
}

function UnColorTargetPlanet(X, Y){
	if(X == ActivePlX && Y == ActivePlY)
		ColorPlanetBorder(X, Y, 'active');
	else {
		ColorPlanetBorder(X, Y, 'restore');
		if(Math.abs(X - ActivePlX) == 1 || Math.abs(Y - ActivePlY) == 1)
			ColorPlanetBorder(ActivePlX, ActivePlY, 'active');
	}
}

function CanJump(Fleet, X, Y){
	var dist = distance(X, Y, Fleet.x, Fleet.y);
	if(dist > Fleet.r || (!(Fleet.oi || Fleet.hm) && (!parent.UserPlanets['a'+X+'_'+Y] && !parent.UserPlanets['a'+Fleet.x+'_'+Fleet.y])))
		return false;
	return true;
}

function WndToMapCoords(clientX, clientY){
	//	Переводим оконные координаты в координаты планеты
	var planetX = Math.floor((OffsetX + clientX - RulesW) / MapCellPixels);
	var planetY = Math.floor((OffsetY + clientY - RulesH) / MapCellPixels);
	planetX = normCoords(planetX);
	planetY = normCoords(planetY);
	return {x: planetX, y:planetY};
}

function normCoords(c){
	return c < 1 ? MapSize + c : c > MapSize ? c - MapSize : c;
}

function mapClickHandler(e){
	if(InDrag)
		return;
	if (!e)
		e = window.event;
	//	Посчитали по какой планет кликнули
	var planet = WndToMapCoords(e.clientX, e.clientY);
	SetActivePlanet(planet.x, planet.y);
	TogglePlanetInfo(planet.x, planet.y);
}

var PrevMoveX = NaN;
var PrevMoveY = NaN;
function mapMouseMoveHandler(e){
	if(InDrag)
		return;
	if (!e)
		e = window.event;

	//	Сохраним координаты курсора
	CursorX = e.clientX;
	CursorY = e.clientY;

	//	Посчитаем над какой планетой мы водим мышкой
	var planetCoords = WndToMapCoords(e.clientX, e.clientY);
	planetX = planetCoords.x;
	planetY = planetCoords.y;

	//	и вызовем обработчики событий
	if(PrevMoveX != planetX || PrevMoveY != planetY) {
		showPlanetsDist(planetX, planetY);
		if(DrawRes && MapCellPixels == MaxMapCellPixels){
			if(PrevMoveX)
				GeoBlock(PrevMoveX, PrevMoveY, false);
			GeoBlock(planetX, planetY, true);
		}
	}

	PrevMoveX = planetX;
	PrevMoveY = planetY;
}

function showPlanetsDist(X, Y){
	distSpan.innerHTML = ActivePlX+':'+ActivePlY+' - '+X+':'+Y+'&nbsp;&nbsp;&nbsp;'+Math.ceil(distance(ActivePlX, ActivePlY, X, Y)*100)/100;
}

//	Выбираем текущую планету
var ActivePlX;
var ActivePlY;
function SetActivePlanet(X, Y){
	//	Восстановим бордеры предыдущей выбраной планеты
	var PrevActivePlanet = document.getElementById('navigator_cell_'+ActivePlX+'_'+ActivePlY);
	if(PrevActivePlanet){
		ColorPlanetBorder(ActivePlX, ActivePlY, 'restore');
	}
	//	Нарисуем бордеры для новой выбраной планеты
	ColorPlanetBorder(X, Y, 'active');

	FixOperaMapRedraw();

	window.parent.XY = X+':'+Y;
	window.parent.SetPlanetTabTo(X, Y);

	ActivePlX = X;
	ActivePlY = Y;
}

function ColorPlanetBorder(X, Y, type) {
	X = parseInt(X);
	Y = parseInt(Y);
	var Planet = document.getElementById('navigator_cell_'+X+'_'+Y);
	if(! Planet)
		return;
	
	if(type == 'active') {
		color = SelectedBorderColor;
		type = 'dashed';
	} else if(type == 'restore') {
		color = false;
		type = 'solid';
	} else if(type == 'target') {
		color = TargetBorderColor;
		type = 'solid';
	}

	var borderW = BorderWidth[ZoomIndex];
	var vColor = color ? color : (X-1) % 5 ? BorderColor : (X-1) % 10 ? Border5Color : Border10Color;
	var hColor = color ? color : (Y-1) % 5 ? BorderColor : (Y-1) % 10 ? Border5Color : Border10Color;
	Planet.style.borderLeft	= borderW+'px '+type+' '+vColor;
	Planet.style.borderTop	= borderW+'px '+type+' '+hColor;

	var PlanetR = document.getElementById('navigator_cell_'+normCoords(X+1)+'_'+Y);
	var PlanetB = document.getElementById('navigator_cell_'+X+'_'+normCoords(Y+1));
	var vColorR = color ? color : X % 5 ? BorderColor : X % 10 ? Border5Color : Border10Color;
	var hColorB = color ? color : Y % 5 ? BorderColor : Y % 10 ? Border5Color : Border10Color;
	if(PlanetR)
		PlanetR.style.borderLeft	= borderW+'px '+type+' '+vColorR;
	if(PlanetB)
		PlanetB.style.borderTop	= borderW+'px '+type+' '+hColorB;
}

function FixOperaMapRedraw(){
	//	Нам надо заставить Оперу перерисовать рамки
	if(BrowserDetect.browser == 'Opera' && BrowserDetect.version < 9.50){
		var img = document.createElement('img');
		img.style.width		= '1px';
		img.style.height	= '1px';
		img.src				= StaticSiteName+'/img/z.gif';
		tablecontainer.appendChild(img);
		tablecontainer.removeChild(img);
	}
}

function FixOperaInformerBorders(id){
	//	Нам надо заставить Оперу перерисовать рамки
	if(BrowserDetect.browser == 'Opera' && BrowserDetect.version < 9.50){
		var coords = /(\d+)_(\d+)/.exec(id);
		if(coords) {
			var InfoDiv = document.getElementById('pl_info_'+coords[1]+'_'+coords[2]);
			if(InfoDiv) {
				InfoDiv.style.width = InfoDiv.offsetWidth+'px';
				InfoDiv.style.width = '';
			}
		}
	}
}

function FixOperaInformerWidth(id){
	//	Зафиксируем ширину информера и будем её пересчитывать при необходимости
	if(BrowserDetect.browser == 'Opera') {
		return;

		var coords = /(\d+)_(\d+)/.exec(id);
		if(coords) {
			var InfoDiv = document.getElementById('pl_info_'+coords[1]+'_'+coords[2]);
			if(InfoDiv) {
				var tab = InfoDiv.firstChild;
				var oldX = parseInt(InfoDiv.style.left);
				var oldY = parseInt(InfoDiv.style.top);
				InfoDiv.style.width = '';
				InfoDiv.style.maxWidth = '';
				InfoDiv.style.left = '-2000px';
				InfoDiv.style.top = '-2000px';
	
				var table = InfoDiv.firstChild;
				var width = table.offsetWidth;
				InfoDiv.style.width = width+'px';
				InfoDiv.style.maxWidth = width+'px';
				InfoDiv.style.left = oldX;
				InfoDiv.style.top = oldY;
			}
		}
	}
	if(BrowserDetect.browser == 'Firefox' && BrowserDetect.version < 3) {
		var coords = /(\d+)_(\d+)/.exec(id);
		if(coords) {
			var InfoDiv = document.getElementById('pl_info_'+coords[1]+'_'+coords[2]);
			if(InfoDiv) {
				var h = parseInt(InfoDiv.clientHeight);
				
				InfoDiv.style.height = h+1+'px';
				setTimeout("document.getElementById('pl_info_"+coords[1]+"_"+coords[2]+"').style.height=''", 1);
			}
		}
	}
}

function FixIEMaxHeight(id){
	if(BrowserDetect.browser == 'Explorer') {
		var coords = /(\d+)_(\d+)/.exec(id);
		if(coords) {
			var div = document.getElementById('pl_info_'+coords[1]+'_'+coords[2]+'_fleets_container');
			if(div) {
				if(div.scrollHeight > MaxFleetsHeight)
					div.style.height = MaxFleetsHeight+'px';
				else
					div.style.height = 'auto';
			}
		}
	}
}

var Drag = {
	obj : null,

	init : function(o, oRoot, keepCursor)
	{
		o.onmousedown	= Drag.start;
		o.root = oRoot && oRoot != null ? oRoot : o ;
		o.changeCursor = !keepCursor;

		if (isNaN(parseInt(o.root.style.left)))
			o.root.style.left   = "0px";
		if (isNaN(parseInt(o.root.style.top)))
			o.root.style.top    = "0px";

		o.root.onDragStart	= new Function();
		o.root.onDragEnd	= new Function();
		o.root.onDrag		= new Function();
		o.root.onContextMenu= new Function();
	},

	start : function(e)
	{
		var o = Drag.obj = this;
		e = Drag.fixE(e);
		var x = parseInt(o.root.style.left);
		var y = parseInt(o.root.style.top);

		if(e.which == 3 || e. button == 2){
			// обработчик правой кнопкой
			//	Чтобы опера не выдавала своё меню нам надо нарисовать и удалить кнопку под указателем. Финт ушами, иногда не срабатывет.
			if(BrowserDetect.browser == 'Opera'){
				var b = document.getElementById('opera_menu_killer');
				if(!b)
					b = document.createElement('input');
				b.id			= 'opera_menu_killer';
				b.type			= 'button';
				b.style.width	= '1px';
				b.style.height	= '1px';
				b.style.border	= '0px';
				b.style.position	= 'absolute';
				o.appendChild(b);
				b.style.left	= e.clientX + 'px';
				b.style.top		= e.clientY + 'px';

				document.onmousemove	= Drag.operaContextFixDrag;
				document.onmouseup		= Drag.operaContextFixEnd;
			}

			o.root.onContextMenu(e.clientX, e.clientY);
			return false;
		}

		o.DrugMouseX	= e.clientX;
		o.DrugMouseY	= e.clientY;

		o.root.onDragStart(x, y);

		document.onmousemove	= Drag.drag;
		document.onmouseup		= Drag.end;

		return false;
	},

	drag : function(e)
	{
		e = Drag.fixE(e);
		var o = Drag.obj;

		var x = parseInt(o.root.style.left);
		var y = parseInt(o.root.style.top);

		var DX=o.DrugMouseX - e.clientX;
		var DY=o.DrugMouseY - e.clientY;

		o.root.style['left'] = (x - DX) + 'px';
		o.root.style['top'] = (y - DY) + 'px';
		
		o.DrugMouseX	= e.clientX;
		o.DrugMouseY	= e.clientY;

		o.root.onDrag(DX, DY, e.clientX, e.clientY);
		
		if(o.changeCursor && (DX || DY)){
			o.style.cursor = 'move';
		}
		return false;
	},

	end : function(e)
	{
		e = Drag.fixE(e);
		var o = Drag.obj;
		
		document.onmousemove = null;
		document.onmouseup   = null;
		o.root.onDragEnd(e);
		Drag.obj = null;

		if(o.changeCursor)
			o.style.cursor = 'default';
	},

	fixE : function(e)
	{
		if (typeof e == 'undefined') e = window.event;
		if (typeof e.layerX == 'undefined') e.layerX = e.offsetX;
		if (typeof e.layerY == 'undefined') e.layerY = e.offsetY;
		if (typeof e.target == 'undefined') e.target = e.srcElement;
		return e;
	},

	operaContextFixDrag : function(e)
	{
		e = Drag.fixE(e);
		var b = document.getElementById('opera_menu_killer');
		if(b){
			b.style.left	= e.clientX + 'px';
			b.style.top		= e.clientY + 'px';
		}
	},

	operaContextFixEnd : function(e)
	{
		e = Drag.fixE(e);
		document.onmousemove = null;
		document.onmouseup   = null;
		var b = document.getElementById('opera_menu_killer');
		if(b){
			b.parentNode.removeChild(b);
		}
	}
};
