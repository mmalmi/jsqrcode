var lastResult = null;
var scanFromWebCam = true;

//qrcode.debug = true;

function load()
{
	if (isCanvasSupported())
	{
		setupWebCam();
	}
	else
	{
		document.body.innerText = "sorry your browser is not supported";
	}
}

function isCanvasSupported()
{
	var elem = document.createElement('canvas');
	return !!(elem.getContext && elem.getContext('2d'));
}

function setupWebCam()
{
	document.getElementById("result").innerHTML="- scanning -";

	try
	{
		navigator.webkitGetUserMedia(
			{ video: true, audio: false },
			stream =>
			{
				var v = document.getElementById("v");

				var URL = window.URL || window.webkitURL;
				v.src = URL.createObjectURL(stream);

				captureToCanvas();
			},
			error =>
			{
				document.getElementById("result").innerHTML = error.toString() + ":" + error.name + ":" + error.message;
			});
	}
	catch(e)
	{
		console.log(e);

		document.getElementById("result").innerHTML = htmlEncode(e);
	}
}

function captureToCanvas()
{
	if (!scanFromWebCam) return;

	try
	{
		var v = document.getElementById("v");

		var gCanvas = document.getElementById("qr-canvas");
		var ctx = gCanvas.getContext("2d");

		ctx.drawImage(v, 0, 0, gCanvas.width, gCanvas.height);

		var result = qrcode.decodeFromCanvas(gCanvas);

		//result = utf8.decode(result);

		console.log(result);

		document.getElementById("result").innerHTML = htmlEncode(result);

		if (lastResult != result)
		{
			var gCanvas2 = document.getElementById("qr-canvas2");
			var ctx2 = gCanvas2.getContext("2d");
			ctx2.drawImage(gCanvas, 0, 0);

			beep();
		}

		lastResult = result;
	}
	catch(e)
	{
		console.log(e);
	}

	setTimeout(captureToCanvas, 100);
}

function beep()
{
	var a = document.getElementById("beep");
	a.play();
}

function htmlEncode(str)
{
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function btnLoadOnClick()
{
	var url = document.getElementById("url").value;
	decodeImage(url);
}

document.addEventListener('paste', paste_auto, false);

function paste_auto(e)
{
	if (e.clipboardData)
	{
		var items = e.clipboardData.items;
		if (!items) return;

		for (var i = 0; i < items.length; i++)
		{
			if (items[i].type.indexOf("image") !== -1)
			{
				//image
				var blob = items[i].getAsFile();
				var URLObj = window.URL || window.webkitURL;
				var url = URLObj.createObjectURL(blob);
				decodeImage(url);
				break;
			}
		}
		e.preventDefault();
	}
}

function decodeImage(url)
{
	scanFromWebCam = false;

	var gCanvas = document.getElementById("qr-canvas");

	qrcode.decodeFromImageUrl(url, result =>
	{
		console.log(result);
		document.getElementById("result").innerHTML = htmlEncode(result);

		var gCanvas2 = document.getElementById("qr-canvas2");
		var ctx2 = gCanvas2.getContext("2d");
		ctx2.clearRect(0, 0, gCanvas2.width, gCanvas2.height);

	}, gCanvas);
}

