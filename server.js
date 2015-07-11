var http = require('http');
var fs = require('fs');
var querystring = require('querystring');
var PORT = 8080;
var Method = {
  GET: 'GET',
  POST: 'POST'
}
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


    });


  }

}

/**
 * Create an HTML template that could be easily dynamic.
 * 
 */


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

}


function htmlTemplate(elementName, elementSymbol, elementAtomicNumber, elementDescription) {
var generatedHTML = "<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <title>The Elements - Boron</title> <link rel="stylesheet" href="/css/styles.css"> </head> <body> <h1>Boron</h1> <h2>B</h2> <h3>Atomic number 5</h3> <p>Boron is a chemical element with symbol B and atomic number 5. Because boron is produced entirely by cosmic ray spallation and not by stellar nucleosynthesis it is a low-abundance element in both the Solar system and the Earth's crust.[12] Boron is concentrated on Earth by the water-solubility of its more common naturally occurring compounds, the borate minerals. These are mined industrially as evaporites, such as borax and kernite. The largest proven boron deposits are in Turkey, which is also the largest producer of boron minerals.</p> <p><a href="/">back</a></p> </body> </html>";

return generatedHTML;

}



server.listen(PORT);