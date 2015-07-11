var http = require('http');
var fs = require('fs');
var querystring = require('querystring');
var PORT = 8080;
var Method = {
  GET: 'GET',
  POST: 'POST'
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
      var atomicElementHTML = createHTML(postData.elementName, postData.elementSymbol, postData.elementAtomicNumber, postData.elementDescription);
      fs.exists(ELEMENT_DIR + postData.filename, function(exists) {
        if (!exists) {
          fs.writeFile(ELEMENT_DIR + postData.filename, atomicElementHTML, function(err) {
            if (err) {
              response.write('err');
              response.end();
            } else {
              writeFileSuccess(response);
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

function writeFileSuccess(response) {
  response.writeHead(200, {
    'Content-Type': 'application/json'
  });
  response.write('success:true');


}

function generatePOSTData(data) {
  fs.stat
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



function createHTML(elementName, elementSymbol, elementAtomicNumber, elementDescription) {
  var generatedHTML = '<!DOCTYPE html>\
<html lang="en">\
<head>\
  <meta charset="UTF-8">\
  <title>The Elements - ' + elementName + '</title>\
  <link rel="stylesheet" href="/css/styles.css">\
</head>\
<body>\
  <h1>' + elementName + '</h1>\
  <h2>' + elementSymbol + '</h2>\
  <h3>' + elementAtomicNumber + '</h3>\
  <p>' + elementDescription + '</p>\
  <p><a href="/">back</a></p>\
</body>\
</html>\
';

  return generatedHTML;

}



server.listen(PORT);