var http = require('http');
var HTTP_PAGE_404 = './public/404.html';
var fs = require('fs');
var querystring = require('querystring');
var PORT = 8080;
var PeriodicElements = {};
var Method = {
  GET: 'GET',
  POST: 'POST',
  HEAD: 'HEAD'
}
var PUBLIC_DIR = './public/';
var ELEMENT_DIR = './public/elements/';
var ELEMENT_COUNT = 2;

var postDataKey = {
  elementName: '',
  elementSymbol: '',
  elementAtomicNumber: '',
  elementDescription: ''
}

var server = http.createServer(handleRequest);


function handleRequest(request, response) {
  if ([Method.GET, Method.HEAD].indexOf(request.method) >= 0) {
    var uri = request.url;
    if (uri === '/') {
      uri = 'index.html';
    }

    fs.exists(PUBLIC_DIR + uri, function(exists) {

      if (exists) {
        fs.readFile(PUBLIC_DIR + uri, function(err, data) {
          if (err) throw err;
          response.write(data);
          response.end();
        });
      } else {
        fs.readFile(HTTP_PAGE_404, function(err, data) {
          response.writeHead(404);
          response.write(data);
          response.end();
        });
      }
    });

  }

  if (request.method === Method.POST) {
    /**
     * -Grab Data that is being Posted
     * -Parse the data using query string
     *
     * If file does not exist
     *   -using data from query string, create:
     *     -in head
     *       <title> The Elements - ELEMET_NAME </title>
     *     -in body
     *     <h1> ELEMENT NAME </h1>
     *     <h2> ELEMENT SYMBOL </h2>
     *     <h3> ATOMIC NUMBER </h3>
     *     <p> ELEMENT DESCRIPTION </p>
     *     <p><a href= "/">Back</a></p>
     *     
     *   -write the new file to the PUBLIC directory
     *     -name the file after the element's name.  Save as .html
     *   -update index.html to reflect the recently created element
     *
     * If file does exist
     *   -do nothing
     *
     * 
     */
    request.on('data', function(data) {

      var postData = generatePOSTData(data);
      var header = createHTMLHeader(postData.elementName);
      var body = createHTMLBody(postData.elementSymbol, postData.elementAtomicNumber, postData.elementDescription);
      var newHTML = createHTML(header, body);
      console.log('newHTML', newHTML);
      fs.exists(ELEMENT_DIR + postData.filename, function(exists) {
        if (!exists) {
          fs.writeFile(ELEMENT_DIR + postData.filename, newHTML, function(err) {
            if (err) {
              response.write('err');
              response.end();
            } else {
              writeFileSuccess(response);
              renderHomepage(postData);
              response.end();
            }

          });

        }
      });

    });


  }

}

/**
 * Create an HTML template that could be easily dynamic.
 * 
 */
function renderHomepage(postData) {
  var indexHTMLHeader = createIndexHeader();
  var newPeriodicElement = '<li><a href="/elements/' + postData.filename + '">' + postData.elementName + '</li>';
  PeriodicElements[postData.filename] = newPeriodicElement;
  // console.log('PeriodicElements', PeriodicElements);
  var indexHTMLBody = createIndexBody(newPeriodicElement);
  var newIndexHTML = indexHTMLHeader + indexHTMLBody;
  var buffer = new Buffer(newIndexHTML);
  // fs.readFile(PUBLIC_DIR+'index.html',function(err,data){
  //    console.log('data.toString()',data.toString()); 
  // });

  fs.open(PUBLIC_DIR + 'index.html', 'w+', function(err, fd) {

    fs.write(fd, buffer, 0, buffer.length, null, function(err) {
      if (err) throw err;

      fs.close(fd, function() {
        console.log('done writing');
      });
    })

  });
}

function writeFileSuccess(response) {
  response.writeHead(200, {
    'Content-Type': 'text/html'
  });
  response.write('success:true');


}

function generatePOSTData(data) {
  var postData = querystring.parse(data.toString());
  //Validates POST input.  If none match postDataKey, throw error
  var counter = 0;
  for (var key in postDataKey) {
    if (Object.keys(postData)[counter] !== key) {
      throw new TypeError('Invalid POST Request');
    }
    counter++;
  }
  postData.filename = postData.elementName + '.html';
  ////////////////////////////////////////////////////////////////////
  return postData;

}



function createHTMLHeader(elementName) {
  var header = '<head>\
  <meta charset="UTF-8">\
  <title>The Elements - ' + elementName + '</title>\
  <link rel="stylesheet" href="/css/styles.css">\
</head>';
  return header;
}

function createHTMLBody(elementName, elementSymbol, elementAtomicNumber, elementDescription) {
  var body = '<body>\
  <h1>' + elementName + '</h1>\
  <h2>' + elementSymbol + '</h2>\
  <h3>' + elementAtomicNumber + '</h3>\
  <p>' + elementDescription + '</p>\
  <p><a href="/">back</a></p>\
</body>';
  return body;
}

function createHTML(header, body) {
  var generatedHTML = '<!DOCTYPE html>\
  ' + header + '\
  ' + body + '\
<html lang="en">\
 </html>\
  ';

  return generatedHTML;

}

function createIndexHeader() {
  var header = '<!DOCTYPE html>\
<html lang="en">\
<head>\
  <meta charset="UTF-8">\
  <title>The Elements</title>\
  <link rel="stylesheet" href="/css/styles.css">\
</head>\
<body>\
  <h1>The Elements</h1>\
  <h2>These are all the known elements.</h2>\
  <h3>These are ' + ELEMENT_COUNT++ + '</h3>\
  <ol>';

  return header;

}

function createIndexBody(newElement) {

  console.log('newElement', newElement);

  var body = '<li>\
    <a href ="/hydrogen.html"> Hydrogen</a></li>' +
    '<li><a href="/helium.html"> Helium </a></li>';


  var endBody = '</body>\
</html>';

  var preExistingElements = '';
  for (var key in PeriodicElements) {
    preExistingElements += PeriodicElements[key];
  }
  console.log('body', body);
  body = body + preExistingElements + endBody;
  // console.log('body',body); 
  return body;

}


server.listen(PORT);