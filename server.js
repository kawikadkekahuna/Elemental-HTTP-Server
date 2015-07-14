var http = require('http');
var HTTP_PAGE_404 = './public/404.html';
var HTTP_ERR_CODE_404 = 404;
var fs = require('fs');
var querystring = require('querystring');
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
// var ELEMENT_COUNT = (2 + Object.keys(PeriodicElements).length) || 2;
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
    uri = 'index.html';
  }
  console.log('request.method', request.method);
  switch (request.method) {
    case Method.GET:
    case Method.HEAD:
      sendGetResponse(response, uri);
      break;

    case Method.POST:
      request.on('data', function(data) {
        sendPostResponse(response, data, uri);
      });
      break;

    case Method.PUT:
      request.on('data', function(data) {
        fs.exists(ELEMENT_DIR + uri, function(exists) {
          if (exists) {
            if (validatePutRequest(parsedData, response, uri)) {
              sendPutResponse(response, parsedData, uri);
            } else {
              writeFileFail(response, ERR_INVALID_PUT_KEY, uri);
              response.end();
            }
          } else {
            writeFileFail(response, ERR_NO_FILE_FOUND, uri);
            response.end();
          }
        });
      });
      break;

    case Method.DELETE:
      deletePeriodicTable();
      sendDeleteResponse(request, response);
      break;
  }

}

/**
 * Create an HTML template that could be easily dynamic.
 * 
 */
function sendGetResponse(response, uri) {
  fs.readFile(PUBLIC_DIR + uri, function(err, data) {
    if (err) throw err;
    response.write(data);
    response.end();
  });
}

function sendHTTP404(response, uri) {
  fs.readFile(HTTP_PAGE_404, function(err, data) {
    response.writeHead(HTTP_ERR_CODE_404);
    response.write(data);
    response.end();
  });
}

function renderHomepage(postData) {
  var indexHTMLHeader = createIndexHeader();
  var newPeriodicElement = '<li><a href="/elements/' + postData.filename + '">' + postData.elementName + '</li>';
  savePeriodicTable(postData.filename, newPeriodicElement);
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

function validatePutRequest(parsedData, response, uri) {
  var keys = Object.keys(DataKey);

  for (var i = 0; i < keys.length; i++) {
    if (!(keys[i] in parsedData)) {
      return false;
    }
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
  <h3>There are ' + '2' + ' elements</h3>\
  <ol>';

  return header;

}

function createIndexBody(newElement) {

  var preExistingElements = '';

  var endBody = '</body>\
  </html>';

  var periodicTable = fs.readFileSync('./PeriodicTable.json', 'utf8')
  if (periodicTable) {
    parsedJSON = JSON.parse(periodicTable);
  }

  for (var key in parsedJSON) {
    preExistingElements += parsedJSON[key];
  }

  var body = preExistingElements + endBody;

  return body;
}

function deletePeriodicTable(filename,element){
  var preExistingElements = {};


}

function savePeriodicTable(filename, element) {
  var preExistingElements = {};
  var preExistingTable = fs.readFileSync('./PeriodicTable.json','utf8');

  var preExistingTable = JSON.parse(preExistingTable);
  for(var key in preExistingTable){
    preExistingElements[key] = preExistingTable[key];
  }
  preExistingElements[filename] = element;
  var convert = JSON.stringify(preExistingElements);
  var fd = fs.openSync('./PeriodicTable.json','w+');
  fs.writeSync(fd,convert,function(err){
    if ( err ) throw err;
  });
 
}

function sendPostResponse(response, data, uri) {
  var postData = generatePOSTData(data);
  var header = createHTMLHeader(postData.elementName);
  var body = createHTMLBody(postData.elementName, postData.elementSymbol, postData.elementAtomicNumber, postData.elementDescription);
  var newHTML = createHTML(header, body);
  fs.exists(ELEMENT_DIR + postData.filename, function(exists) {
    if (!exists) {
      fs.writeFile(ELEMENT_DIR + postData.filename, newHTML, function(err) {
        if (err) throw err;
        writeFileSuccess(response);
        renderHomepage(postData);
        console.log('in');
        response.end();
      });

    } else {
      writeFileFail(response, ERR_DUPLICATE_FILE, uri);
      response.end();
    }
  });

}

function sendPutResponse(response, parsedData, uri) {
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
}

function sendDeleteResponse(request, response) {
  var uri = request.url;
  fs.exists(ELEMENT_DIR + uri, function(exists) {
    if (exists) {
      fs.unlink(ELEMENT_DIR + uri, function(err) {
        writeFileSuccess(response);
        var fd = fs.openSync('./PeriodicTable.json','w+');

        response.end();
      });
    } else {
      writeFileFail(response, ERR_NO_FILE_FOUND, uri);
      response.end();
    }
  });
}

server.listen(PORT);