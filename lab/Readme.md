# Problem

Pages like golem.de or spiegel.de redirect the user to another page to accept the cookies.  
While analyzing the golem site I noticed the following script which includes AES and RSA implementations.  
`https://data-62650cd9a5.golem.de/sensor.modern.ncl.min.js`

After debugging I noticed that it contains a userAgentBlacklist:

```JSON
{

    "config": {
        "check": {
            "urlWhitelist": true,
            "userAgentBlacklist": true,
        "userAgentWhitelist": true
        },
        "[...]"
        "publicRSA": "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3ZHQckZQiLJNitYm/4LS/04C6R35BXXodJYpzN+yYHy472xn5bDAqODroQactIlDVP3FNXaX4yYn1MqyxHOrlCgf2Lnotq7yuAIZP0WiAZlfUks2OAfgPf5m/1lLCFZpzDrPdPsZrT5bFGAkH9RWeatNJq73SvM9zsX3x3vvQwIDAQAB",
        "[...]"
        "userAgentBlacklist": "applebot|bingbot|bingpreview|blp_bbot|cuil|cxensebot|europarchive.org|google web previ|googlebot|headlesschrome|AdsBot-Google|heritrix|homesidespider|httrack|mediobot|ivw-crawler|msnbot|phantomjs|pingbot|server.py|splash safari|voilabot|yandeximages",
        "userAgentWhitelist": "mozilla|air_mosaic|alcatel|amiga-aweb|apache|benq|blackberry|cafi|docomo|enhanced_mosaic|^ivw-audit\\/[A-Za-z0-9]{8,16}$|iotest[A-Za-z0-9]{10,24}$|hbbtv|htc|ibrowse|ice|iemobile|java|kddi-|lg-|lg/|lge|lotus-notes|lynx|macweb|microsoft outloo|miixpc|mitsu|mot-|msfrontpage|msproxy|nativehost|navipress|nec|netscape|nokia|nsca mosaic|omniweb|opera|outlook express|pirelli|quaterdeck.mosai|sagem|samsung|sch|sec-|sgh-|sie-|sitekiosk|sonyericsson|spry?mosaic?v9|spry_mosaic|squid|staroffice|symbianos|vodafone|wget|xda"
    }

}
```

## But how to recognize this kind of cookie banner?

In the case of golem and spiegel, you are redirected to the consent page directly after calling up the page with the help of the http header or JavaScript.

### Golem

**Request**
```
GET / HTTP/1.1
Host: www.golem.de
Connection: close
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36
[...]
```


**Response**
```
HTTP/1.1 302 Moved Temporarily
Server: nginx
Date: Sat, 06 Feb 2021 10:52:39 GMT
Content-Type: text/html
Connection: close
Keep-Alive: timeout=3
Location: https://www.golem.de/sonstiges/zustimmung/auswahl.html?from=https%3A%2F%2Fwww.golem.de%2F
X-UPSTREAM: unix:/var/run/php-fpm-www.sock
Content-Length: 0
```


If you now change the user agent as follows:  
```
User-Agent: googlebot Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36
```
So you get a `HTTP/1.1 200 OK` as response.


In the case of spiegel, this redirection is done using JavaScript. Here the user agent must also be adapted as follows, so that one is not redirected:
```
User-Agent: googlebot
```


## Recognize idea

If it is detected that the page redirects the user right at the beginning, two iframes are created.
One with the normal user agent and one with the googlebot useragent. If the behavior is different and one of the following keywords is in the redirection URL of the normal user agent **or** if the previous url is contained in a get parameter, the user agent for the page is adjusted so that the user is no longer redirected.

**Proof of concept**
```js
keywords = [ "consent", "zustimmung" ]

if (keywords.find(keyword => location.href.indexOf(keyword) > -1)) {
    console.log("Possible cookies banner");
}
```

```js
referrer = encodeURIComponent("https://www.golem.de/")

if (location.search.split("&").map(e => e.split("=")[1]).find(e => e === referrer))  {
  console.log("Possible forwarding");
}
```