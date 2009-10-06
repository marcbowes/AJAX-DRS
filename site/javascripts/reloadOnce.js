var reloaded = false;
var loc=""+document.location;
loc = loc.indexOf("?reloaded=")!=-1?loc.substring(loc.indexOf("?reloaded=")+10,loc.length):"";
loc = loc.indexOf("&")!=-1?loc.substring(0,loc.indexOf("&")):loc;
reloaded = loc!=""?(loc=="true"):reloaded;

function reloadOnceOnly() {
    if (!reloaded) 
        window.location.replace(window.location+"?reloaded=true");
}