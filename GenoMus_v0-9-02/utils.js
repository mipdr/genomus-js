
// greates common divisor, taken and adapted from https://gist.github.com/redteam-snippets/3934258. 
// still to refine to avoid too weird numbers
// functions to create an unique filaname depending on date
var gcd = (a, b) => (b) ? gcd(b, a % b) : a;

var decimal2fraction = function (_decimal) {
    if (_decimal == parseInt(_decimal)) {
        var output = parseInt(_decimal);
        if (output.length < 7) {
            return output;
        }
        else {
            return _decimal;
        }
    }
    else {
        var top = _decimal.toString().includes(".") ? _decimal.toString().replace(/\d+[.]/, '') : 0;
        var bottom = Math.pow(10, top.toString().replace('-', '').length);
        if (_decimal >= 1) {
            top = +top + (Math.floor(_decimal) * bottom);
        }
        else if (_decimal <= -1) {
            top = +top + (Math.ceil(_decimal) * bottom);
        }

        var x = Math.abs(gcd(top, bottom));
        var output = (top / x) + '/' + (bottom / x);
        if (output.length < 7) {
            return output;
        }
        else {
            return _decimal;
        }
    }
};
var d2f = decimal2fraction;

// adapted from https://gist.github.com/drifterz28/6971440
var fraction2decimal = function (fraction) {
    var result, wholeNum = 0, frac, deci = 0;
    if (fraction.search('/') >= 0) {
        if (fraction.search('-') >= 0) {
            var wholeNum = fraction.split('-');
            frac = wholeNum[1];
            wholeNum = parseInt(wholeNum, 10);
        } else {
            frac = fraction;
        }
        if (fraction.search('/') >= 0) {
            frac = frac.split('/');
            deci = parseInt(frac[0], 10) / parseInt(frac[1], 10);
        }
        result = wholeNum + deci;
    } else {
        result = +fraction;
    }
    return r6d(result);
}
var f2d = fraction2decimal;

// function to test how many encoded indexes can be generated without recurrences
var testRepetitions = function (n) {
    var usedNumbers = [];
    var newValue = 0;
    for (var a = 0; a < n; a++) {
        newValue = goldeninteger2norm(a);
        for (var b = 0; b < usedNumbers.length; b++) {
            if (newValue == usedNumbers[b]) {
                console.log("Repetition of " + newValue + " found at iteration " + a + ". Founded the same number at index " + b + ".");
                return -1;
            }
        }
        if (a % 10000 == 0) {
            console.log("Tested " + b + " indexes. Recurrences not found so far.");
        }
        usedNumbers.push(newValue);
    }
    return 1;
};

//// AUX FUNCTIONS FOR HARMONIC GRIDS

// takes a value and aproximate each number to the nearest value of an array of values
var closest = (val, arr) => {
    return arr.reduce((a, b) => {
        let aDiff = Math.abs(a - val);
        let bDiff = Math.abs(b - val);
        if (aDiff == bDiff) {
            return a > b ? a : b;
        } else {
            return bDiff < aDiff ? b : a;
        }
    });
};

// takes an array and aproximate each value to a second array (that will be the harmonic grid to adjust)
// if gridArr is an empty array the first array is returned unchanged
var tuneArray = (arr, gridArr) => {
    if (gridArr.length === 0) { return arr };
    return arr.map(function(element){
        return closest(element, gridArr);
    });
};

// removes duplicates in array
var removeArrayDuplicates = (arr) => {
    return [...new Set(arr)];
};

// create octavations of an array
var octavateArray = (arr, numOctaves) => {
    arr.sort((a, b) => a - b);
    var octavatedArr = arr;
    var arrItem = 0;
    if (numOctaves == 0) return arr;
    if (numOctaves > 0) {
        var firstValue = arr[0];
        var newValue = 0;
        while (newValue < numOctaves * 12 + 12 + firstValue) {
            newValue = arr[arrItem] + 12;
            octavatedArr.push(newValue);
            arrItem++;
        };
        octavatedArr.pop();
    };
    if (numOctaves < 0) {
        var firstValue = arr[0];
        arr.reverse();
        var newValue = firstValue;
        while (newValue > numOctaves * 12 + firstValue) {
            newValue = arr[arrItem] - 12;
            octavatedArr.push(newValue);
            arrItem++;
        };
        octavatedArr.reverse();
    }
    return octavatedArr;
};

// returns complement set of b, substracting elements in set b from set a
function arrayDiff(a, b) {
    return a.filter( 
        function(el) {
        return b.indexOf(el) < 0;
        }
    );
}


// flats arrays with any level of nesting
var flattenDeep = arr1 => arr1.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), []);

// avoids exceeding interval [0, 1] for a value
var normalRange = (val) => {
    if (val < 0) { return 0 };
    if (val > 1) { return 1 };
    return val;
};

// remap a value from its range to another
var remap = (v, minInitRange, maxInitRange, minNewRange, maxNewRange) =>
    r6d(((v - minInitRange) / (maxInitRange - minInitRange)) * (maxNewRange - minNewRange) + minNewRange);

// remap an array from its range to another
var remapArray = (inputArr, minNewRange, maxNewRange) => {
    var minim = Math.min(...inputArr);
    var maxim = Math.max(...inputArr);
    return inputArr.map(x => remap(x, minim, maxim, minNewRange, maxNewRange));
};

// adjust a value from quantizedF to a range without rescaling
var adjustRange = (q, minQ, maxQ) => {
    if (q < minQ) { return minQ };
    if (q > maxQ) { return maxQ };
    return q;
};

// evaluates how far is a value from the desired range, giving a 1 as maximal score
var howNearToRange = (testedValue, rangeMin, rangeMax) => {
    if (testedValue < rangeMin) return testedValue/rangeMin;
    if (testedValue > rangeMax) return rangeMax/testedValue;
    return 1;
}

// measures expression depth
// adapted from https://learnersbucket.com/examples/algorithms/maximum-depth-of-nested-parentheses-in-a-string/
var measureStringMaxDepth = (str) => {
    var maxStrDepth = 0;
    var total_max = 0;
    for(var stringPos = 0; stringPos < str.length; stringPos++){
        if(str[stringPos] == '(') {
        maxStrDepth++;
        if(maxStrDepth > total_max) total_max = maxStrDepth;
        }
        else if(str[stringPos] == ')') {
            if(maxStrDepth > 0) maxStrDepth--;
            else return -1;
        }
    }
    if(maxStrDepth != 0) return -1;
    return total_max; 
};