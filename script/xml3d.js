// Create global symbol org
var org;
if (!org)
	org = {};
else if (typeof org != "object")
	throw new Error("org already exists and is not an object");

// Create global symbol org.xml3d
if (!org.xml3d)
	org.xml3d = {};
else if (typeof org.xml3d != "object")
	throw new Error("org.xml3d already exists and is not an object");

org.xml3d.xml3dNS = 'http://www.xml3d.org/2009/xml3d';
org.xml3d.xhtmlNS = 'http://www.w3.org/1999/xhtml';
org.xml3d.webglNS = 'http://www.xml3d.org/2009/xml3d/webgl';
org.xml3d._xml3d = document.createElementNS(org.xml3d.xml3dNS, "xml3d");
org.xml3d._native = org.xml3d._xml3d.style !== undefined; 

if (!Array.forEach) {
	Array.forEach = function(array, fun, thisp) {
		var len = array.length;
		for ( var i = 0; i < len; i++) {
			if (i in array) {
				fun.call(thisp, array[i], i, array);
			}
		}
	};
}
if (!Array.map) {
	Array.map = function(array, fun, thisp) {
		var len = array.length;
		var res = [];
		for ( var i = 0; i < len; i++) {
			if (i in array) {
				res[i] = fun.call(thisp, array[i], i, array);
			}
		}
		return res;
	};
}
if (!Array.filter) {
	Array.filter = function(array, fun, thisp) {
		var len = array.length;
		var res = [];
		for ( var i = 0; i < len; i++) {
			if (i in array) {
				var val = array[i];
				if (fun.call(thisp, val, i, array)) {
					res.push(val);
				}
			}
		}
		return res;
	};
}

document.nativeGetElementById = document.getElementById;
document.getElementById = function(id) {
	var elem = document.nativeGetElementById(id);
	if(elem)
	{
		return elem;
	} else {
		return this.evaluate('//*[@id="' + id + '"]', this, function() {
			return org.xml3d.xml3dNS;
		}, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	}
};

(function() {
	var onload = function() {
		var x3ds = document.getElementsByTagNameNS(org.xml3d.xml3dNS, 'xml3d');
		x3ds = Array.map(x3ds, function(n) {
			return n;
		});
		
		var activateLog = false;
		for (var i = 0; i < x3ds.length; i++) {
			var showLog = x3ds[i].getAttributeNS(org.xml3d.webglNS, "showLog");
			if (showLog !== null && showLog == "true") {
				activateLog = true;
				break;
			}
		}
		if (activateLog) {
			org.xml3d.debug.activate();
		}
		org.xml3d.debug.logInfo("Found " + x3ds.length + " xml3d nodes...");
		
		if (x3ds.length) {
			org.xml3d._xml3d = x3ds[0];
			if (org.xml3d._native) {
				org.xml3d.debug.logInfo("Using native implementation...");
				return;
			}
		}
		
		for (i = 0; i < x3ds.length; i++) {
			var x3dcanvas = org.xml3d.document.createCanvas(x3ds[i]);
			if (x3dcanvas.gl === null) {
				var altDiv = document.createElement("div");
				altDiv.setAttribute("class", "xml3d-nox3d");
				var altP = document.createElement("p");
				altP
						.appendChild(document
								.createTextNode("WebGL is not yet supported in your browser. "));
				var aLnk = document.createElement("a");
				aLnk.setAttribute("href", "http://www.xml3d.org/");
				aLnk
						.appendChild(document
								.createTextNode("Follow link for a list of supported browsers... "));
				altDiv.appendChild(altP);
				altDiv.appendChild(aLnk);
				x3dcanvas.canvasDiv.appendChild(altDiv);
				if (x3dcanvas.statDiv) {
					x3dcanvas.canvasDiv.removeChild(x3dcanvas.statDiv);
				}
				var altImg = x3ds[i].getAttribute("altImg") || null;
				if (altImg) {
					var altImgObj = new Image();
					altImgObj.src = altImg;
					x3dcanvas.canvasDiv.style.backgroundImage = "url(" + altImg
							+ ")";
				} else {
				}
				continue;
			}
		}
		var ready = (function(eventType) {
			var evt = null;
			if (document.createEvent) {
				evt = document.createEvent("Events");
				evt.initEvent(eventType, true, true);
				document.dispatchEvent(evt);
			} else if (document.createEventObject) {
				evt = document.createEventObject();
				document.fireEvent('on' + eventType, evt);
			}
		})('load');
	};
	var onunload = function() {
		if (org.xml3d.document !== undefined)
			org.xml3d.document.onunload();
	};
	window.addEventListener('load', onload, false);
	window.addEventListener('unload', onunload, false);
	window.addEventListener('reload', onunload, false);

})();

//Some helper function. We don't have global constructors for 
//all implementations
createXML3DVec3 = function() {
	if (org.xml3d._xml3d === undefined) {
		return new XML3DVec3(); 
	}
	return org.xml3d._xml3d.createXML3DVec3();
};

createXML3DRotation = function() {
	if (org.xml3d._xml3d === undefined) {
		return new XML3DRotation(); 
	}
	return org.xml3d._xml3d.createXML3DRotation();
};

