var lz_poll_server = "<!--server-->";
var lz_poll_url = "<!--server-->server.php";
var lz_poll_website = "<!--website-->";
var lz_poll_frequency = <!--poll_frequency-->;
var lz_poll_file_chat = "<!--file_chat-->";
var lz_window_width = "<!--width-->";
var lz_window_height = "<!--height-->";
var lz_area_code = "<!--area_code-->";
var lz_user_name = "<!--user_name-->";
var lz_user_email = "<!--user_email-->";
var lz_user_company = "<!--user_company-->";
var lz_user_question = "<!--user_question-->";
var lz_user_phone = "<!--user_phone-->";
var lz_user_customs = [<!--user_customs-->];
var lz_user_language = "<!--user_language-->";
var lz_user_header = "<!--user_header-->";
var lz_user_website = "<!--website-->";
var lz_getp_track = "<!--get_track_params-->";
var lz_getp_chat = "<!--get_chat_params-->";
var lz_alert_html = '<!--alert_html-->';
var lz_is_ie = <!--is_ie-->;
var lz_overlay_chat_available = <!--is_ovlc-->;
var lz_overlays_possible = <!--is_ovlpos-->;
var lz_direct_login = <!--direct_login-->;
var lz_geo_error_span = <!--connection_error_span-->;
var lz_geo_data_count = 6;
var lz_geo_resolution = null;
var lz_geo_resolution;
var lz_geo_resolution_needed = <!--geo_resolute-->;
var lz_user_id = "<!--user_id-->";
var lz_browser_id = "<!--browser_id-->";
var lz_server_id = "<!--server_id-->";
var lz_geo_url = "<!--geo_url-->";
var lz_mip = "<!--mip-->";
var lz_oak = '';
var lz_is_mobile = <!--is_mobile-->;
var lz_server_time = <!--server_time-->;
<!--calcoak-->

var lz_resources = [false,false,false,false,false,false];
LazyLoad=function(x,h){function r(b,a){var c=h.createElement(b),d;for(d in a)a.hasOwnProperty(d)&&c.setAttribute(d,a[d]);return c}function k(b){var a=i[b],c,d;if(a){c=a.callback;d=a.urls;d.shift();l=0;if(!d.length){c&&c.call(a.context,a.obj);i[b]=null;j[b].length&&m(b)}}}function w(){if(!e){var b=navigator.userAgent;e={async:h.createElement("script").async===true};(e.webkit=/AppleWebKit\//.test(b))||(e.ie=/MSIE/.test(b))||(e.opera=/Opera/.test(b))||(e.gecko=/Gecko\//.test(b))||(e.unknown=true)}}function m(b,
a,c,d,s){var n=function(){k(b)},o=b==="css",f,g,p;w();if(a){a=typeof a==="string"?[a]:a.concat();if(o||e.async||e.gecko||e.opera)j[b].push({urls:a,callback:c,obj:d,context:s});else{f=0;for(g=a.length;f<g;++f)j[b].push({urls:[a[f]],callback:f===g-1?c:null,obj:d,context:s})}}if(!(i[b]||!(p=i[b]=j[b].shift()))){q||(q=h.head||h.getElementsByTagName("head")[0]);a=p.urls;f=0;for(g=a.length;f<g;++f){c=a[f];if(o)c=r("link",{charset:"utf-8","class":"lazyload",href:c,rel:"stylesheet",type:"text/css"});else{c=
r("script",{charset:"utf-8","class":"lazyload",src:c});c.async=false}if(e.ie)c.onreadystatechange=function(){var t=this.readyState;if(t==="loaded"||t==="complete"){this.onreadystatechange=null;n()}};else if(o&&(e.gecko||e.webkit))if(e.webkit){p.urls[f]=c.href;u()}else setTimeout(n,50*g);else c.onload=c.onerror=n;q.appendChild(c)}}}function u(){var b=i.css,a;if(b){for(a=v.length;a&&--a;)if(v[a].href===b.urls[0]){k("css");break}l+=1;if(b)l<200?setTimeout(u,50):k("css")}}var e,q,i={},l=0,j={css:[],js:[]},
v=h.styleSheets;return{css:function(b,a,c,d){m("css",b,a,c,d)},js:function(b,a,c,d){m("js",b,a,c,d)}}}(this,this.document);
var getResJS = "?t=js&1=jscript/jsglobal.min.js&2=jscript/jsbox.min.js&3=jscript/jstrack.min.js";
var getResCSS = "?t=css&1=style.min.css";

if(lz_overlay_chat_available)
{
    getResCSS += "&2=overlays/chat<!--ovlv-->/style.min.css";
    getResJS += "&4=overlays/chat<!--ovlv-->/jscript/jsextern.min.js";
}

LazyLoad.js(lz_poll_server + "resource.php" + getResJS, function () {lz_resources[0]=true;lz_resources[1]=true;lz_resources[2]=true;lz_resources[4]=true;});
LazyLoad.css(lz_poll_server + "resource.php" + getResCSS, function (arg) {}, '');