
function embeddedMozillaObject(url, width, height)
{
  return (
    '<object type="video/x-ms-asf" data="' + url + '" width="0" height="1">'
    + ' <param name="src" value="' + url + '" valuetype="data" />'
    + ' <param name="autostart" value="true" valuetype="data" />'
    + ' <param name="autorewind" value="true" valuetype="data" />'
    + ' <param name="loop" value="true" valuetype="data" />'
    + ' <param name="controls" value="VolumeSlider" valuetype="data" />'
    + ' <embed src="' + url + '" controls="volumelever" autostart="true" loop="true" width="' + width + '" height="' + height + '" pluginspage="http://www.microsoft.com/windows/windowsmedia/mp10/previousversions.aspx" />'
    + '</object>'
  );
}

function embeddedIExplorerObject(url, width, height)
{
  return (
    '<embed type="video/x-ms-asf" src="' + url + '" autostart="true" hidden="true" loop="true" width="0" height="1" pluginspage="http://www.microsoft.com/windows/windowsmedia/mp10/previousversions.aspx" />'
  );
}

function embeddedOtherBrowserObject(url, width, height)
{
  return (
    '<object data="' + url + '" width="0" height="1">'
    + ' <param name="src" value="' + url + '" valuetype="data" />'
    + ' <param name="autostart" value="true" valuetype="data" />'
    + ' <param name="autorewind" value="true" valuetype="data" />'
    + ' <param name="loop" value="true" valuetype="data" />'
    + ' <param name="controls" value="VolumeSlider" valuetype="data" />'
    + ' <embed src="' + url + '" controls="volumelever" autostart="true" loop="true" width="' + width + '" height="' + height + '" pluginspage="http://www.microsoft.com/windows/windowsmedia/mp10/previousversions.aspx" />'
    + '</object>'
  );
}

function embedPlayer(source) {

  document.getElementById('player').innerHTML = '<p>Por favor, espere unos instantes mientras se carga el video...</p>';

  var videoData = {}; 
  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function () {
    if ( httpRequest.readyState == 4 && httpRequest.status == 200 ) {
      videoData = JSON.parse( httpRequest.responseText );
      playASF(videoData.url, videoData.width, videoData.height);
    }
  }
  httpRequest.open( 'GET', '/stream/' + source, true );
  httpRequest.send();

}

function playASF(url, width, height) {

  /*
  var inner  = (
    '<OBJECT ID="WinMedia" classid="CLSID:22d6f312-b0f6-11d0-94ab-0080c74c7e95" CODEBASE= "http://activex.microsoft.com/activex/controls/mplayer/en/nsmp2inf.cab#Version=5,1,52,701" width=' + width + ' height=' + height + ' standby="Loading Microsoft Windows Media Player components..." type="application/x-oleobject">'
	+ '<PARAM NAME="FileName" VALUE="' + url + '">'
	+ '<PARAM NAME="AutoStart" Value="true">'
	+ '<PARAM NAME="ShowControls" Value="true">'
	+ '<Embed type="application/x-mplayer2" pluginspage="http://www.microsoft.com/Windows/MediaPlayer/" src="' + url + '" Name=MediaPlayer AutoStart=0 Width=' + width + ' Height=' + height + ' autostart=1 ShowControls=1></embed>'
	+ '</OBJECT>'
  );
  */

  var inner = (
    '<video width="' + width + '" height="' + height + '" controls autoplay>'
    + '<source src="' + url + '"  type="video/mp4" />'
    + '</video>'
  );

  /*
  if (navigator.appName=="Microsoft Internet Explorer")
    inner = embeddedIExplorerObject(url, width, height);
  else if (navigator.appName=="Opera")
    inner = embeddedIExplorerObject(url, width, height);
  else if (navigator.appName=="Netscape")
    inner = embeddedMozillaObject(url, width, height);
  else
    inner = embeddedOtherBrowserObject(url, width, height);
  */
  document.getElementById('player').innerHTML = inner;

}
