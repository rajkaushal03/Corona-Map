//what is that?
var g_googleChromeBrowser = true;
var g_AsyncNativeCalls = true;
var g_resourceStrings= {};
var g_optionString = {};
var g_optionBool = {};
function __noop(){};
var fnAnnotate = __noop;
var fnShowWarning = __noop;

function getSystemOptionBool(strName, defVal)
{
	var bVal = g_optionBool[strName];
	if(typeof(bVal)=="undefined") return defVal;
	return bVal;
}

function getSystemOptionString(strName, defStr)
{ 
	var strVal = g_optionString[strName];
	if(typeof(strVal)=="undefined") return defStr;
	return strVal;
}

function setSystemOptionString(strName, strVal)
{ 
	chrome.extension.sendRequest( {command : "set option", optName : strName, optVal: strVal}, function ( response ) { } );   
}

var g_Callback = __noop;
function hashStringCallback(args)
{
	if(!g_Callback) return;	
	
	args.domdoc = window.document;
	g_Callback(args);
	
	g_Callback = __noop;
}

function hashString(str, seed, args, fnCallback)
{ 
	g_Callback = fnCallback;
	chrome.extension.sendRequest( {command : "hash string", strVal : str, strSeed: seed, callbackArgs:args}, hashStringCallback);   
}

function GetL10NString(nResID)
{
	var strVal = g_resourceStrings[nResID];
	if(typeof(strVal)=="undefined") return "";
	return strVal;
}

function ReportStat(szStatType,szStats)
{
     chrome.extension.sendRequest({ command : "report stat",statType : szStatType, stats: szStats}, function ( response ) { });    	
}

function executeCommand(nCommandID, strParams)
{ 
	chrome.extension.sendRequest( {command : "execute command", CommandID: nCommandID, Params: strParams}, function ( response ) { });   
}
function handleSASite() {
	var wlAnchor = document.getElementById("DontWarn");
	if( wlAnchor && wlAnchor.href.indexOf("about:blank") != -1  ) {
		var strOrigUrl = wlAnchor.href;
		//Set the href to empty javascript funciton, so that the page doesn't navigate to any page.
		wlAnchor.href = "javascript:function _sa_(){};";
		wlAnchor.addEventListener("click" , function(){ handleSpecialURL(strOrigUrl); });
	}
}
function handleSpecialURL(strUrl) {
	chrome.extension.sendRequest({command : "handle sa url", url: strUrl});
}
function handleChromeDssRequest(doc, url, requestListData, callback) {
	var subList = requestListData.slice(0,49);
    var dsspostdata = subList.join("\t");
    chrome.extension.sendRequest({command: "dss query", dssUrl: url, dssData: dsspostdata}, function (response) { callback(response.dssResponse, null); });    
}
function onResourcesReady(response){
	//hack: replace all of the inline sacore:empty.gif images with the inline data representation
	try
	{
		response.htmlRes["balloon.html"] = response.htmlRes["balloon.html"].replace(new RegExp("sacore:empty.gif","g"), response.imageDatamap["empty.gif"]);
	 
		// for now...store the res strings and settings in globals which are defined in safe_chrome_def_proxies.js
		// this needs to be revisited, but don't have time now
		g_resourceStrings 	= response.resStrings;
		g_optionString 		= response.optionString;
		g_optionBool		= response.optionBool;
		eval( response.safejs );
		if ( typeof(annotate) != "undefined" )
			fnAnnotate = annotate;
		if ( typeof(showWarningBanner) != "undefined" )
			fnShowWarning = showWarningBanner;
		
		for (var strKey in response.imageDatamap)
		{
			SetImageMapValue(strKey, response.imageDatamap[strKey]);
		}
		
		for (var strKey in response.htmlRes)
		{
			SetHtmlCachedContent(strKey, response.htmlRes[strKey]);
		}
		fnAnnotate({originalTarget: window.document});

		chrome.extension.sendRequest({ command: "on doc complete", sub: (window != window.top) });
	}
	catch(e)
	{
		console.log("Exception in onResRdy: " + e);
	}
};

handleWBPage();
function handleWBPage()
{
	var url = null;
	url = window.location.href;
	if(url != null && url.match(/blockpagegc.html|warnpromptpagegc.html/i) != null)
		return;
		
	chrome.extension.sendRequest({ command: "get resources" }, onResourcesReady);
}
