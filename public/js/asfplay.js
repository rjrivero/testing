
function embeddedMozillaObject(url, width, height)
{
  return (
    '<object type="video/x-ms-asf" data="' + url + '" width="0" height="1">'
    + ' <param name="src" value="' + url + '" valuetype="data" />'
    + ' <param name="autostart" value="true" valuetype="data" />'
    + ' <param name="autorewind" value="true" valuetype="data" />'
    + ' <param name="loop" value="true" valuetype="data" />'
    + ' <param name="controls" value="VolumeSlider" valuetype="data" />'
    + ' <embed type="' + url + '" controls="volumelever" autostart="true" loop="true" width="' + width + '" height="' + height + '" pluginspage="http://www.microsoft.com/windows/windowsmedia/mp10/previousversions.aspx" />'
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
  var url = 'test';
  var width = '1280';
  var height = '720';
  var player = document.getElementById('player');
  var inner  = '';
  if (navigator.appName=="Microsoft Internet Explorer")
    inner = embeddedIExplorerObject(url, width, height);
  else if (navigator.appName=="Opera")
    inner = embeddedIExplorerObject(url, width, height);
  else if (navigator.appName=="Netscape")
    inner = embeddedMozillaObject(url, width, height);
  else
    inner = embeddedOtherBrowserObject(url, width, height);
  player.innerHTML = inner;
}
