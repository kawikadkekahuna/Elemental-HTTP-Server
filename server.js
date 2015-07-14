var http = require('http');
var HTTP_PAGE_404 = './public/404.html';
var HTTP_ERR_CODE_404 = 404;
var fs = require('fs');
var querystring = require('querystring');
var DATA = 'data';
var PeriodicTable = './PeriodicTable.json';
var HOMEPAGE = 'index.html'
var PORT = 8080;
var Method = {
  GET: 'GET',
  POST: 'POST',
  HEAD: 'HEAD',
  PUT: 'PUT',
  DELETE: 'DELETE'
}
var PUBLIC_DIR = './public/';
var ELEMENT_DIR = './public/elements/';
var ERR_NO_FILE_FOUND = 'no file found';
var ERR_INVALID_PUT_KEY = 'invalid put key';
var ERR_INVALID_DELETE_KEY = 'invalid delete key';
var ERR_DUPLICATE_FILE = 'duplicate file';
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
    uri = HOMEPAGE;
  }
  switch (request.method) {
    case Method.GET:
    case Method.HEAD:
      sendGetResponse(response, uri);
      break;

    case Method.POST:
      request.on(DATA, function(data) {
        sendPostResponse(response, data, uri);
      });
      break;

    case Method.PUT:
      request.on(DATA, function(data) {
        sendPutResponse(response, data, uri);
      });
      break;

    case Method.DELETE:
      sendDeleteResponse(request, response);
      break;
  }

}

function sendGetResponse(response, uri) {
  fs.readFile(PUBLIC_DIR + uri, function(err, data) {
    if (err) throw err;
    response.write(data);
    response.end();
  });
}

function sendPostResponse(response, data, uri) {
  fs.exists(ELEMENT_DIR + data.filename, function(exists) {
    if (!exists) {
      var postData = generatePOSTData(data);
      var newHTML = createHTML(postData);
      fs.writeFile(ELEMENT_DIR + postData.filename, newHTML, function(err) {
        if (err) throw err;
        writeFileSuccess(response);
        savePeriodicTable(postData.filename, postData.elementName);
        renderHomepage();
        response.end();
      });

    } else {
      writeFileFail(response, ERR_DUPLICATE_FILE, uri);
    }
  });

}

function sendPutResponse(response, data, uri) {
  fs.exists(ELEMENT_DIR + uri, function(exists) {
    if (exists) {
      if (validatePutRequest(data)) {
        var parsedData = generatePOSTData(data);
        var header = createHTMLHeader(parsedData.elementName);
        var body = createHTMLBody(parsedData.elementName, parsedData.elementSymbol, parsedData.elementAtomicNumber, parsedData.elementDescription);
        var newHTML = createHTML(header, body);

        var buffer = new Buffer(newHTML);

        fs.open(ELEMENT_DIR + uri, 'w+', function(err, fd) {

          fs.write(fd, buffer, 0, buffer.length, null, function(err) {
            if (err) throw err;

            writeFileSuccess(response);
            fs.close(fd, function() {

              console.log('done writing to ' + ELEMENT_DIR + uri);
              response.end();
            });
          });

        });

      } else {
        writeFileFail(response, ERR_INVALID_PUT_KEY, uri);

      }
    } else {
      writeFileFail(response, ERR_NO_FILE_FOUND, uri);

    }
  });

}

function sendDeleteResponse(request, response) {
  var uri = request.url;

  fs.exists(ELEMENT_DIR + uri, function(exists) {
    if (exists) {
      fs.unlink(ELEMENT_DIR + uri, function(err) {
        writeFileSuccess(response);
        deletePeriodicTable(uri);
        renderHomepage();
        response.end();
      });
    } else {
      writeFileFail(response, ERR_NO_FILE_FOUND, uri);
    }
  });
}


function renderHomepage() {
  var indexHTMLHeader = createIndexHeader();
  var indexHTMLBody = createIndexBody();
  var newIndexHTML = indexHTMLHeader + indexHTMLBody;
  var buffer = new Buffer(newIndexHTML);

  fs.open(PUBLIC_DIR + HOMEPAGE, 'w+', function(err, fd) {

    fs.write(fd, buffer, 0, buffer.length, null, function(err) {
      if (err) throw err;

      fs.close(fd, function() {
        console.log('done writing');
      });
    });

  });
}

function validatePutRequest(data) {
  var postData = querystring.parse(data.toString());
  var counter = 0;
  for (var key in DataKey) {
    if (Object.keys(postData)[counter] !== key) {
      return false;
    }
    counter++;
  }
  return true;
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
    case ERR_INVALID_DELETE_KEY:
      res = {
        error: 'Delete request must contain a URI key'
      }
      break;

    case ERR_DUPLICATE_FILE:
      res = {
        error: 'Cannot post.  File already exists'
      }
      break;
  }
  response.write(JSON.stringify(res));
  response.end();

}

function generatePOSTData(data) {
  var postData = querystring.parse(data.toString());
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

function createHTML(postData) {
  var generatedHTML = '<!DOCTYPE html>\
  ' + createHTMLHeader(postData.elementName) + '\
  ' + createHTMLBody(postData.elementName,postData.elementSymbol,postData.elementAtomicNumber,postData.elementDescription) + '\
<html lang="en">\
 </html>\
  ';
  return generatedHTML;
}

function createIndexHeader() {
  var length = Object.keys(JSON.parse(fs.readFileSync(PeriodicTable, 'utf8'))).length;
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
  <h3>There are ' + length + ' elements</h3>\
  <ol>';

  return header;

}

function createIndexBody() {

  var preExistingElements = '';

  var endBody = '</body>\
  </html>';

  var periodicTable = fs.readFileSync(PeriodicTable, 'utf8')
  if (periodicTable) {
    parsedJSON = JSON.parse(periodicTable);
  }

  for (var key in parsedJSON) {
    preExistingElements += parsedJSON[key];
  }

  var body = preExistingElements + endBody;

  return body;
}

function deletePeriodicTable(uri) {
  var preExistingElements = {};
  var preExistingTable = fs.readFileSync(PeriodicTable, 'utf8');
  var parsedJSON = JSON.parse(preExistingTable);
  for (var key in parsedJSON) {
    if (key !== uri.replace('/', '')) {
      preExistingElements[key] = parsedJSON[key];
    }
  }
  var convert = JSON.stringify(preExistingElements);
  var fd = fs.openSync(PeriodicTable, 'w+');
  fs.writeSync(fd, convert, function(err) {
    if (err) throw err;
  });

}

function savePeriodicTable(filename, element) {
  var newPeriodicElement = '<li><a href="/elements/' + filename + '">' + element + '</li>';

  var preExistingElements = {};
  var preExistingTable = fs.readFileSync(PeriodicTable, 'utf8');
  preExistingTable = JSON.parse(preExistingTable);
  for (var key in preExistingTable) {
    preExistingElements[key] = preExistingTable[key];
  }
  preExistingElements[filename] = newPeriodicElement;
  var convert = JSON.stringify(preExistingElements);
  var fd = fs.openSync(PeriodicTable, 'w+');
  fs.writeSync(fd, convert, function(err) {
    if (err) throw err;
  });

}

function sendHTTP404(response) {
  fs.readFile(HTTP_PAGE_404, function(err, data) {
    response.writeHead(HTTP_ERR_CODE_404);
    response.write(data);
    response.end();
  });
}


server.listen(PORT);