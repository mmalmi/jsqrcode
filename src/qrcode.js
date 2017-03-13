/*
   Copyright 2011 Lazar Laszlo (lazarsoft@gmail.com, www.lazarsoft.info)

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/


var qrcode = {};
qrcode.imagedata = null;
qrcode.width = 0;
qrcode.height = 0;
qrcode.debug = false;
qrcode.maxImgSize = 1024 * 1024;

qrcode.sizeOfDataLengthInfo = [[10, 9, 8, 8], [12, 11, 16, 10], [14, 13, 16, 12]];

qrcode.decodeFromCanvas = function (canvasElement)
{
	var width = canvasElement.width;
	var height = canvasElement.height;

    qrcode.width = width;
    qrcode.height = height;
    var context = canvasElement.getContext('2d');
    qrcode.imagedata = context.getImageData(0, 0, width, height);
    var result = qrcode.process(context);
    return result;
}

qrcode.decodeFromImageUrl = function (src, callback, canvasElement)
{
    var image = new Image();
    image.crossOrigin = "Anonymous";
    image.onload = function ()
    {
        if (!canvasElement) canvasElement = document.createElement('canvas');
        var context = canvasElement.getContext('2d');
        var height = image.height;
        var width = image.width;
        if (width * height > qrcode.maxImgSize)
        {
            var ir = width / height;
            height = Math.sqrt(qrcode.maxImgSize / ir);
            width = ir * height;
        }

        canvasElement.width = width;
        canvasElement.height = height;

        context.drawImage(image, 0, 0, width, height);

        qrcode.width = width;
        qrcode.height = height;

        try
        {
            qrcode.imagedata = context.getImageData(0, 0, width, height);
        }
        catch (e)
        {
            qrcode.result = "Cross domain image reading not supported in your browser! Save it to your computer then drag and drop the file!";
            if (callback != null) callback(qrcode.result);
            return;
        }

        try
        {
            qrcode.result = qrcode.process(context);
        }
        catch (e)
        {
            // console.log(e);
            qrcode.result = "error decoding QR Code";
        }

        if (callback != null) callback(qrcode.result);
    }
    image.src = src;
}

qrcode.process = function (ctx)
{
    var image = qrcode.grayScaleToBitmap();
    //var image = qrcode.binarize(128);

    if (qrcode.debug && ctx)
    {
        for (var y = 0; y < qrcode.height; y++)
        {
            for (var x = 0; x < qrcode.width; x++)
            {
                var point = (x * 4) + (y * qrcode.width * 4);
                qrcode.imagedata.data[point] = image[x + y * qrcode.width] ? 0 : 255;
                qrcode.imagedata.data[point + 1] = image[x + y * qrcode.width] ? 0 : 255;
                qrcode.imagedata.data[point + 2] = image[x + y * qrcode.width] ? 0 : 255;
            }
        }
        ctx.putImageData(qrcode.imagedata, 0, 0);
    }

    var detector = new Detector(image);
    var qRCodeMatrix = detector.detect();

    if (qrcode.debug && ctx) ctx.putImageData(qrcode.imagedata, 0, 0);

    var reader = Decoder.decode(qRCodeMatrix.bits);
    var str = bytesToStr(reader.DataByte);
    if (utf8 && utf8.decode)
    {
        str = utf8.decode(str);
    }
    return str;

    function bytesToStr(data)
    {
        var str = "";

        for (var i = 0; i < data.length; i++)
        {
            for (var j = 0; j < data[i].length; j++)
            {
                str += String.fromCharCode(data[i][j]);
            }
        }

        return str;
    }
}

qrcode.grayScaleToBitmap = function ()
{
    var grayScale = qrcode.grayscale();

    var middle = getMiddleBrightnessPerArea(grayScale);
    var sqrtNumArea = middle.length;
    var areaWidth = Math.floor(qrcode.width / sqrtNumArea);
    var areaHeight = Math.floor(qrcode.height / sqrtNumArea);
    var bitmap = new Array(qrcode.height * qrcode.width);

    for (var ay = 0; ay < sqrtNumArea; ay++)
    {
        for (var ax = 0; ax < sqrtNumArea; ax++)
        {
            for (var dy = 0; dy < areaHeight; dy++)
            {
                for (var dx = 0; dx < areaWidth; dx++)
                {
                    var index = areaWidth * ax + dx + (areaHeight * ay + dy) * qrcode.width;
                    bitmap[index] = grayScale[index] < middle[ax][ay];
                }
            }
        }
    }
    return bitmap;


    function getMiddleBrightnessPerArea(image)
    {
        var numSqrtArea = 4;
        //obtain middle brightness((min + max) / 2) per area
        var areaWidth = Math.floor(qrcode.width / numSqrtArea);
        var areaHeight = Math.floor(qrcode.height / numSqrtArea);
        var minmax = new Array(numSqrtArea);
        for (var i = 0; i < numSqrtArea; i++)
        {
            minmax[i] = new Array(numSqrtArea);
            for (var i2 = 0; i2 < numSqrtArea; i2++)
            {
                minmax[i][i2] = new Array(0, 0);
            }
        }
        for (var ay = 0; ay < numSqrtArea; ay++)
        {
            for (var ax = 0; ax < numSqrtArea; ax++)
            {
                minmax[ax][ay][0] = 255;
                for (var dy = 0; dy < areaHeight; dy++)
                {
                    for (var dx = 0; dx < areaWidth; dx++)
                    {
                        var target = image[areaWidth * ax + dx + (areaHeight * ay + dy) * qrcode.width];
                        if (target < minmax[ax][ay][0]) minmax[ax][ay][0] = target;
                        if (target > minmax[ax][ay][1]) minmax[ax][ay][1] = target;
                    }
                }
                //minmax[ax][ay][0] = (minmax[ax][ay][0] + minmax[ax][ay][1]) / 2;
            }
        }
        var middle = new Array(numSqrtArea);
        for (var i3 = 0; i3 < numSqrtArea; i3++)
        {
            middle[i3] = new Array(numSqrtArea);
        }
        for (var ay = 0; ay < numSqrtArea; ay++)
        {
            for (var ax = 0; ax < numSqrtArea; ax++)
            {
                middle[ax][ay] = Math.floor((minmax[ax][ay][0] + minmax[ax][ay][1]) / 2);
            }
        }

        return middle;
    }
}

qrcode.binarize = function (th)
{
    var ret = new Array(qrcode.width * qrcode.height);
    for (var y = 0; y < qrcode.height; y++)
    {
        for (var x = 0; x < qrcode.width; x++)
        {
            var gray = qrcode.getPixel(x, y);

            ret[x + y * qrcode.width] = gray <= th;
        }
    }
    return ret;
}

qrcode.grayscale = function ()
{
    var ret = new Array(qrcode.width * qrcode.height);
    for (var y = 0; y < qrcode.height; y++)
    {
        for (var x = 0; x < qrcode.width; x++)
        {
            var gray = qrcode.getPixel(x, y);

            ret[x + y * qrcode.width] = gray;
        }
    }
    return ret;
}

qrcode.getPixel = function (x, y)
{
    if (qrcode.width < x) throw "point error";
    if (qrcode.height < y) throw "point error";

    var index = (x * 4) + (y * qrcode.width * 4);
    var data = qrcode.imagedata.data;
    if (data[index + 3] < 255) return 255;
    var p = (data[index] * 33 + data[index + 1] * 34 + data[index + 2] * 33) / 100;
    return p;
}

function URShift(number, bits)
{
    if (number >= 0)
        return number >> bits;
    else
        return (number >> bits) + (2 << ~bits);
}
