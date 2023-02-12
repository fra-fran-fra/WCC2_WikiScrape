const https = require('https');
const JSSoup = require('jssoup').default;
const fs = require('fs');
const url = "https://en.wikipedia.org/wiki/Loudness_war"; // FIRST: find a url of a page you are interested in from wikipedia 
const jsonPath = "./json/";
const name = "Loudness War";


/*
This web-scraping example is set up for working with wikipedia.If you want to adapt this
to scrape another site you should go and inspect the site in the browser first, then adapt this. 
*/

function cleanString(_array, _trash) {
    let finalArray = [];

    for (let i = 0; i < _array.length; i++) {
        let string = _array[i];
        let newString = string.replace(_trash, "");
        finalArray[i] = newString;
    }

    return finalArray;
}

function sliceString(_array) {
    let finalArray = [];

    for (let i = 0; i < _array.length; i++) {

        let string = _array[i];
        let newString = string.slice(0, 3);
        finalArray[i] = newString;
    }

    return finalArray;
}

function getTitle(soupTag) {
    let wikiTitle = soupTag.findAll('caption');
    let title = [];

    for (let i = 0; i < wikiTitle.length; i++) {
        let wTitle = wikiTitle[i].getText();
        title[i] = wTitle;
    }

    let finalArray = cleanString(title, /(\r\n|\n|\r)/gm);
    return finalArray;
}

function getColumn(soupTag) {
    let wikiColumns = soupTag.findAll('th', { scope: "col" });
    let columns = [];

    for (let i = 0; i < wikiColumns.length; i++) {
        let wCol = wikiColumns[i].getText();

        if (wCol.indexOf("production") == -1) {
            columns[i] = wCol;
        }

    }

    let finalArray = cleanString(columns, /(\r\n|\n|\r)/gm);
    return finalArray;
}

function getServices(soupTag) {
    let wikiRow = soupTag.findAll('th', { scope: "row" });
    let rows = [];

    for (let i = 0; i < wikiRow.length; i++) {
        let wRows = wikiRow[i].getText();
        rows[i] = wRows;
    }

    let newRows = rows.splice(0, 6);
    let finalArray = cleanString(newRows, /(\r\n|\n|\r)/gm);
    return finalArray;
}

function getLufs(soupTag) {
    let wikiRow = soupTag.findAll('td');
    let rows = [];

    for (let i = 0; i < wikiRow.length; i++) {
        let wRows = wikiRow[i].getText();
        rows[i] = wRows;
    }

    let newRows = rows.splice(2, 6);
    let finalArray = sliceString(newRows);
    return finalArray;
}

//pass in Plain Old Javascript Object that's formatted as JSON
function writeJSON(data) {
    try {
        let path = jsonPath + name + ".json";
        fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
        console.log("JSON file successfully saved");
    } catch (error) {
        console.log("An error has occurred ", error);
    }
}

//create soup  
function createSoup(document) {

    let soup = new JSSoup(document);
    let data = {
        "name": name,
        "url": url,
        "content": {}
    };

    let main = soup.find('main');//only get the content from the main body of the page

    data.content = {
        "title": getTitle(main),
        "columns": getColumn(main),
        "services": getServices(main),
        "lufs": getLufs(main)
    };

    //output json
    writeJSON(data);

}

//Request the url
https.get(url, (res) => {
    console.log('statusCode:', res.statusCode);
    console.log('headers:', res.headers);

    let document = [];

    res.on('data', (chunk) => {
        document.push(chunk);
    }).on('end', () => {
        document = Buffer.concat(document).toString();
        // console.log(body);
        createSoup(document);
    });

}).on('error', (e) => {
    console.error(e);
});

