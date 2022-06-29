//// VISUALIZATION OF GENETIC STRUCTURES

var visualizeSpecimen = (normArray, filename) => {
    var maxLinesPerRow = 130, graphWidth, graphHeight;
    var lineColor, lineMaxHeight = 140, lineWidth = 10, lineOffset = 1, rowOffset = 15, lineColor;
    var roundedCornerRadius = lineWidth * 0.5;
    var specimenLength = normArray.length;
    var totalRows = Math.ceil(specimenLength / maxLinesPerRow);
    var goldenNumbers = [...Array(1000).keys()].map(z2p);
    if (specimenLength > maxLinesPerRow) {
        graphWidth = maxLinesPerRow * (lineWidth + lineOffset);
    } else {
        graphWidth = specimenLength * (lineWidth + 1);
    }
    graphHeight = lineMaxHeight * totalRows + rowOffset * (totalRows - 1);
    var lines = "";
    var SVGheader = "<svg version='1.1'\n    baseProfile='full'\n    width='" +
        graphWidth + "' height='" + graphHeight +
        "'\n    xmlns='http://www.w3.org/2000/svg'>\n    <rect x='0' y='0' width=';" +
        graphWidth + "' height='" + graphHeight +
        "' style='fill:white;' />\n";
    for (var i = 0; i < specimenLength; i++) {
        lineHeight = normArray[i] * (lineMaxHeight - lineWidth) + lineWidth;
        if (normArray[i] == 0 || normArray[i] == 1) lineColor = "black"; // functions openings and ends
        else if (goldenNumbers.includes(normArray[i])) lineColor = "hsl(" + (norm2goldeninteger(normArray[i]) % 60) + "," + 80 + "%," + 56 + "%)"; // golden numbers
        else if (normArray[i] == 0.5) lineColor = "#999999"; // leaves identifiers
        else if (normArray[i] == 0.51) lineColor = "#A0A0A0";
        else if (normArray[i] == 0.52) lineColor = "#AAAAAA";
        else if (normArray[i] == 0.53) lineColor = "#B0B0B0";
        else if (normArray[i] == 0.54) lineColor = "#BBBBBB";
        else if (normArray[i] == 0.55) lineColor = "#C0C0C0";
        else if (normArray[i] == 0.56) lineColor = "#CCCCCC";
        else if (normArray[i] == 0.57) lineColor = "#D0D0D0";
        else if (normArray[i] == 0.58) lineColor = "#DDDDDD";
        else if (normArray[i] == 0.59) lineColor = "#E0E0E0";
        else if (normArray[i] == 0.6) lineColor = "#EEEEEE";
        else lineColor = "hsl(" + (norm2goldeninteger(normArray[i]) % 180 + 100) + "," + 80 + "%," + 56 + "%)"; // leaf values
        lines = lines +
            "    <rect x='" + (i * (lineWidth + lineOffset) - Math.floor(i / maxLinesPerRow) * maxLinesPerRow * (lineWidth + lineOffset)) +
            "' y='" + (Math.floor(i / maxLinesPerRow) * (lineMaxHeight + rowOffset) + lineMaxHeight - lineHeight) +
            "' rx='" + roundedCornerRadius + "' ry='" + roundedCornerRadius + "' width='" + lineWidth + "' height='" + lineHeight +
            "' style='fill:" + lineColor + "' />\n";
    }
    var SVGcode = SVGheader + lines + "</svg>";
    fs.writeFileSync(filename + '.svg', SVGcode);
};


// test colorization with minimal steps
var testColorization = () => {
    var coloredValues = [];
    var firstValue = 0.8;
    var lastValue = 0.801;
    step = 0.000001;
    for ( var i=firstValue, l=lastValue; i<l; i+=step ){
        coloredValues: coloredValues.push(r6d(i));
    };
    console.log(coloredValues);
    visualizeSpecimen(coloredValues, "testcolors-000001");
};

testColorization();