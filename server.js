var http = require('http');
var HTTP_PAGE_404 = './public/404.html';
var fs = require('fs');
var querystring = require('querystring');
var PORT = 8080;
var Method = {
  GET: 'GET',
  POST: 'POST',
  HEAD: 'HEAD'
}
var PUBLIC_DIR = './public/';
var ELEMENT_DIR = './public/elements/';

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
      var toAppendHTML = createHTMLElements(postData);
       console.log('toAppendHTML',toAppendHTML); 
      fs.exists(ELEMENT_DIR + postData.filename, function(exists) {
        if (!exists) {
          fs.writeFile(ELEMENT_DIR + postData.filename, toAppendHTML, function(err) {
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
  var newElement = '<li><a href="/helium.html">Helium</li>';
  var buffer = new Buffer(newElement);
  // fs.readFile(PUBLIC_DIR+'index.html',function(err,data){
  //    console.log('data.toString()',data.toString()); 
  // });

  fs.open(PUBLIC_DIR + 'index.html', 'r+', function(err, fd) {

    fs.write(fd, buffer, 0, buffer.length, 315, function(err) {
      if (err) throw err;

      fs.close(fd, function() {
        console.log('done writing');
      })
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

function createHTMLElements(postData) {
  ####SEPERATE tags into new functions and jsut have createhtml as the only function being called  
  var header =  '<head>\
  <meta charset="UTF-8">\
  <title>The Elements - ' + postData.elementName + '</title>\
  <link rel="stylesheeeeeeet" href="/css/styles.css">\
</head>';

  var body = '<body>\
  <h1>' + postData.elementName + '</h1>\
  <h2>' + postData.elementSymbol + '</h2>\
  <h3>' + postData.elementAtomicNumber + '</h3>\
  <p>' + postData.elementDescription + '</p>\
  <p><a href="/">back</a></p>\
</body>';




}


function createHTML(postData) {
createHTMLElements(header,body);
  var generatedHTML = '<!DOCTYPE html>\
  '+header+'\
  '+body+'\
<html lang="en">\
 < /html>\
  ';

  return generatedHTML;

}



server.listen(PORT);