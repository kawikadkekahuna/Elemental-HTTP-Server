var http = require('http');
var HTTP_PAGE_404 = './public/404.html';
var fs = require('fs');
var querystring = require('querystring');
var PORT = 8080;
var PeriodicElements = require('./PeriodicTable.js').PeriodicElements;
var Method = {
  GET: 'GET',
  POST: 'POST',
  HEAD: 'HEAD',
  PUT: 'PUT',
  DELETE: 'DELETE'
}
var PUBLIC_DIR = './public/';
var ELEMENT_DIR = './public/elements/';
var ELEMENT_COUNT = (2 + Object.keys(PeriodicElements).length) || 2;
var ERR_NO_FILE_FOUND = 'no file found';
var ERR_INVALID_PUT_KEY = 'invalid put key'
var DataKey = {
  elementName: '',
  elementSymbol: '',
  elementAtomicNumber: '',
  elementDescription: ''
}

var server = http.createServer(handleRequest);


function handleRequest(request, response) {
  var uri = request.url;
  if (uri === '/') {
    uri = 'index.html';
  }
  if ([Method.GET, Method.HEAD].indexOf(request.method) >= 0) {

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
      var body = createHTMLBody(postData.elementName, postData.elementSymbol, postData.elementAtomicNumber, postData.elementDescription);
      var newHTML = createHTML(header, body);
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

  if (request.method === Method.PUT) {
    request.on('data', function(data) {
      fs.exists(ELEMENT_DIR + uri, function(exists) {
        if (exists) {
          var parsedData = querystring.parse(data.toString());
          var keys = Object.keys(DataKey);
          for (var i = 0; i < keys.length; i++) {
            if (!(keys[i] in parsedData)) {
              writeFileFail(response, ERR_INVALID_PUT_KEY, uri);
              response.end();
              return;

            }
          }

          var header = createHTMLHeader(parsedData.elementName);
          var body = createHTMLBody(parsedData.elementName, parsedData.elementSymbol, parsedData.elementAtomicNumber, parsedData.elementDescription);
          var newHTML = createHTML(header, body);
          var buffer = new Buffer(newHTML);

          fs.open(ELEMENT_DIR + uri, 'w+', function(err, fd) {

            fs.write(fd, buffer, 0, buffer.length, null, function(err) {
              if (err) throw err;

              fs.close(fd, function() {
                writeFileSuccess(response);
                console.log('done writing to ' + ELEMENT_DIR + uri);

                response.end();
              });
            });

          });
        } else {
          writeFileFail(response, ERR_NO_FILE_FOUND, uri);
          response.end();
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
  savePeriodicTable();
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
    });

  });
}

function writeFileSuccess(response) {
  response.writeHead(200, {
    'Content-Type': 'application/json'
  });
  var res = {
    success: true
  }

  response.write(JSON.stringify(res));
}

function writeFileFail(response, code, uri) {
  response.writeHead(500, {
    'Content-Type': 'application/json'
  });
  var res;
  switch (code) {

    case ERR_INVALID_PUT_KEY:
      res = {
        error: 'invalid Keys in PUT request'
      }
      break;

    case ERR_NO_FILE_FOUND:
      res = {
        error: uri + ' was not found'
      }
      break;

  }
  response.write(JSON.stringify(res));
}

function generatePOSTData(data) {
  var postData = querystring.parse(data.toString());
  //Validates POST input.  If none match DataKey, throw error
  var counter = 0;
  for (var key in DataKey) {
    if (Object.keys(postData)[counter] !== key) {
      throw new TypeError('Invalid POST Request');
    }
    counter++;
  }
  postData.filename = postData.elementName + '.html';

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
  <h3>There are ' + ELEMENT_COUNT + ' elements</h3>\
  <ol>';

  return header;

}

function createIndexBody(newElement) {

  var preExistingElements = '';
  var body = '<li><a href ="/hydrogen.html">Hydrogen</a></li>' +
    '<li><a href="/helium.html"> Helium </a></li>';

  var endBody = '</body>\
  </html>';

  for (var key in PeriodicElements) {
    preExistingElements += PeriodicElements[key];

  }
  body = body + preExistingElements + endBody;
  return body;

}

function savePeriodicTable() {
  fs.open('PeriodicTable.js', 'w+', function(err, fd) {
    var toBuffer = 'module.exports.PeriodicElements =' + JSON.stringify(PeriodicElements);
    var buffer = new Buffer(toBuffer);
    fs.write(fd, buffer, 0, buffer.length, null, function(err) {
      if (err) throw err;

      fs.close(fd, function() {
        console.log('table done writing');
      });
    });

  });


}


server.listen(PORT);