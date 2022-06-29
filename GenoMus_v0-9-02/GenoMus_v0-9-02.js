//// GENOMUS 0.9.02 
///////////////////

// DEPENDENCIES
// files handling
const fs = require('fs');
// connection with Max interface
const maxAPI = require('max-api');


//// DEFAULT CONDITIONS
var version = "0.9.02";
var currentUser = "jlm";

var currentSpecies = "piano";
// var currentSpecies = "piano_4xtra"; // as piano species with 4 extra generic parameters addedpiano_4xtra
// var currentSpecies = "csound";

var notesPerOctave = 12;
// temporary file while experimenting in Max (leaving other collections untouched until saving)
var currentInitialConditionsCollection = "aux/current_population.json";

var specimenMainFunctionType = "scoreF";
var defaultListsMaxCardinality = 16;
var phenotypeSeed = Math.round(Math.random() * 1e14);
var defaultGerminalVecMaxLength = 20;

var genMaxDepth = 60;
var defaultEventExpression; // variable to store a default event when no autoreferences are possible
var validGenotype = true;
var phenMinPolyphony = 1;
var phenMaxPolyphony = 8;
var phenMinLength = 0;
var phenMaxLength = 10000;
var maxIterations = 2000;
var maxIntervalPerSearch = 5000; // in milliseconds
var maxIntervalPerNewBranch = 1000; // in milliseconds
var mandatoryFunction = "";

// mutation constraints
var mutationProbability = .5;
var mutationAmount = .3;

var currentSpecimen; // stores the last specimen used
var leaves = []; // stores all numeric parameters
var genotypeLog = {};
var genCount = 0;

// saves temporarily last created specimens
var lastSpecimens = [];
var numberOfTemporarySavedSpecs = 100;
var saveTemporarySpecimens = (lastSpec) => {
    if (lastSpecimens.length == numberOfTemporarySavedSpecs) lastSpecimens.pop();
    lastSpecimens.unshift(lastSpec);
}


//// AUX FUNCTIONS



// // functions to create unique filenames for specimens
// var addZero = (i) => {
//     if (i < 10) {
//         i = "0" + i;
//     }
//     return i;
// }
// var addDoubleZero = (i) => {
//     if (i < 10) {
//         i = "00" + i;
//     }
//     else if (i < 100) {
//         i = "0" + i;
//     }
//     return i;
// }
// var getFileDateName = (optionalName) => {
//     if (optionalName == undefined || optionalName == "") {
//         optionalName = "";
//     }
//     else {
//         optionalName = "_" + optionalName;
//     }
//     var cDate = new Date();
//     var fileDateName = "" + cDate.getFullYear()
//         + addZero(cDate.getMonth() + 1)
//         + addZero(cDate.getDate())
//         + addZero(cDate.getHours())
//         + addZero(cDate.getMinutes())
//         + addZero(cDate.getSeconds())
//         + addDoubleZero(cDate.getMilliseconds())
//         + optionalName;
//     return fileDateName;
// }

// calculates a harmonic grid
// var calculateHarmonicGrid = (tuning, scale, mode, chord, root, chromaticism, octavation) => {
//     tuning = []; // temporary for testing
//     // remapping
//     scale = removeArrayDuplicates(scale.map(function(pitch) { return pitch % 12 }));
//     mode = removeArrayDuplicates(mode.map(function(pitch) { return pitch % 12 }));
//     scale = removeArrayDuplicates(tuneArray(scale, tuning));
//     mode = removeArrayDuplicates(tuneArray(mode, scale));
//     octavation = (octavation - 0.5) * 16;
//     chord = removeArrayDuplicates(chord.map(function(pitch) { return pitch % 48 }));
//     var chordLength = chord.length;
//     // redefines chord according to chromaticism degree, from unison to panchromatic harmony
//     if (chromaticism == 0) { chord = [chord[0]] } // unison
//     else if (chromaticism > 0 && chromaticism < 0.45 ) {
//         chord.splice(Math.ceil(chordLength*chromaticism/0.45));
//         var chord = removeArrayDuplicates(tuneArray(chord, octavateArray(mode,10))).sort((a, b) => a - b);
//     }
//     else if (chromaticism >= 0.45 && chromaticism < 0.55) {
//         var chord = removeArrayDuplicates(tuneArray(chord, octavateArray(mode,10))).sort((a, b) => a - b);
//     }
//     else if (chromaticism >= 0.55 && chromaticism < 0.75) { // filling the chord progressively
//         var complementChord = arrayDiff(mode, chord);
//         var complementChordLength = complementChord.length;
//         complementChord.splice(Math.ceil(complementChordLength*(chromaticism-0.55)/0.2));
//         chord = chord.concat(complementChord);
//         var chord = removeArrayDuplicates(tuneArray(chord, octavateArray(mode,10))).sort((a, b) => a - b);
//     }
//     else if (chromaticism >= 0.75) {
//         var modeClon = [...mode];
//         var chord = removeArrayDuplicates(tuneArray(chord, octavateArray(modeClon,10))).sort((a, b) => a - b);
//         chord = removeArrayDuplicates(chord.concat(mode)).sort((a, b) => a - b);
//         var complementMode = arrayDiff(scale, chord);
//         var complementModeLength = complementMode.length;
//         complementMode.splice(Math.ceil(complementModeLength*(chromaticism-0.75)/0.25));
//         chord = removeArrayDuplicates(chord.concat(mode.concat(complementMode)));      
//     };
//     root = closest(root,octavateArray(scale, 16));
//     chord = chord.map(function(num) { return num + root });
//     chord = removeArrayDuplicates(octavateArray(chord, octavation).sort((a, b) => a - b));
//     return chord;
// };

// //// RANDOM HANDLING

// // SEEDED RANDOM GENERATOR WITH UNIFORM DISTRIBUTION
// // adapted from https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
// function xmur3(str) {
//     for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
//         h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
//             h = h << 13 | h >>> 19;
//     return function () {
//         h = Math.imul(h ^ h >>> 16, 2246822507);
//         h = Math.imul(h ^ h >>> 13, 3266489909);
//         return (h ^= h >>> 16) >>> 0;
//     }
// }
// function mulberry32(a) {
//     return function () {
//         var t = a += 0x6D2B79F5;
//         t = Math.imul(t ^ t >>> 15, t | 1);
//         t ^= t + Math.imul(t ^ t >>> 7, t | 61);
//         return ((t ^ t >>> 14) >>> 0) / 4294967296;
//     }
// }
// // outputs one 32-bit hash to provide the seed for mulberry32
// var initSeed = (parseInt(Math.random() * 1e16)).toString();
// var seed = xmur3(initSeed);
// // creates rand() function
// var rand = mulberry32(seed());
// // reinits seed
// function createNewSeed(seedInput) {
//     seed = xmur3(seedInput.toString());
//     rand = mulberry32(seed());
// }
// // reinits seed randomly
// var newRndSeed = () => createNewSeed(parseInt(Math.random()*100000000));

// // SEEDED RANDOM FRACTAL RANDOM GENERATOR BASED ON LOGISTIC MAP
// // logistic map for creating random numbers
// var logisticSeed = 0.481920;
// // random array from a logistic map for creating list from a seed as argument
// // if seedvalue x <= 0 or >= 1 then seed is randomly chosen with Math.random()
// var logisticRandom = (x, numItems) => {
//     if (x <= 0 || x >= 1) x = r6d(Math.random());
//     var rndVector = [x];
//     for (var i = 0; i < numItems - 1; i++) {
//         x = x * 4 * (1 - x);
//         rndVector.push(r6d(x));
//     }
//     return rndVector;
// }
// // global random generator, independent from random series in genotypes 
// var gRnd = () => {
//     logisticSeed = logisticSeed * 4 * (1 - logisticSeed);
//     return logisticSeed;
// }
// // allows variable R to use special distributions of logistic equation. R within interval [0, 1] mapped to values 3.5 to 4 (chaotic behaviour)
// var logisticRandomVariableR = (r, x, numItems) => {
//     var rndVector = [x];
//     r = r * 0.5 + 3.5; // r within interval [0, 1] mapped to values 3.5 to 4 (chaotic behaviour)
//     for (var i = 0; i < numItems - 1; i++) {
//         x = x * r * (1 - x);
//         rndVector.push(r6d(x));
//     }
//     return rndVector;
// }

// // test normal distribution generator
// var testRndValues = () => {
//     var mini = 0.5;
//     var maxi = 0.5;
//     var pos = 0;
//     var neg = 0;
//     var val;
//     var iter = 0;
//     while (mini > 0 && maxi < 1) {
//         iter++;
//         val = gaussRnd();
//         if (val < .5) neg++;
//         if (val > .5) pos++;

//         if (val < mini) {
//             mini = val;
//             console.log("Min: " + mini + " | Max: " + maxi + " Negat: " + neg + " | Pos: " + pos + " | iter: " + iter);
//         }
//         if (val > maxi) {
//             maxi = val;
//             console.log("Min: " + mini + " | Max: " + maxi + " Negat: " + neg + " | Pos: " + pos + " | iter: " + iter);
//         }
//     }
//     console.log("Min: " + mini + " | Max: " + maxi + " Negat: " + neg + " | Pos: " + pos + " | iter: " + iter);
//     return -1;
// };

// // test logistic distribution generator
// var testLogisticValues = () => {
//     var mini = 0.5;
//     var maxi = 0.5;
//     var pos = 0;
//     var neg = 0;
//     var val = 0.1;
//     var iter = 0;
//     while (mini > 0 && maxi < 1) {
//         iter++;
//         val = val * 4 * (1 - val);
//         if (val < .5) neg++;
//         if (val > .5) pos++;

//         if (val < mini) {
//             mini = val;
//             console.log("Min: " + mini + " | Max: " + maxi + " Negat: " + neg + " | Pos: " + pos + " | Ratio: " + pos / neg + " | iter: " + iter);
//         }
//         if (val > maxi) {
//             maxi = val;
//             console.log("Min: " + mini + " | Max: " + maxi + " Negat: " + neg + " | Pos: " + pos + " | Ratio: " + pos / neg + " | iter: " + iter);
//         }
//     }
//     console.log("Min: " + mini + " | Max: " + maxi + " Negat: " + neg + " | Pos: " + pos + " | iter: " + iter);
//     return -1;
// };

// enables power of negative numbers and fractional exponents
Math.pow2 = function (n, p) {
    if (n < 0) {
        var v = Math.pow((n * -1), p);
        v = (v * -1);
        return v;
    }
    else {
        return Math.pow(n, p);
    }
}

// test decoded genotypes in Max
var mt = decGenotype => {
    initSubexpressionsArrays();
    var output = (evalDecGen(decGenotype));
    visualizeSpecimen(output.encGen, "encGen");
    visualizeSpecimen(output.encPhen, "encPhen");
    maxAPI.post("received decoded genotype: " + decGenotype);
    maxAPI.post("manually decoded genotype: " + decodeGenotype(output.encGen));
    maxAPI.post("automat. encoded genotype: " + eval(decGenotype).encGen);
    maxAPI.post("manually encoded genotype: " + encodeGenotype(decGenotype));
    return output;
};

//// FUNCTION LIBRARIES HANDLING

// // create JSON files from data in JavaScript Object 
// var createJSON = (objectData, filename) => fs.writeFileSync(filename, JSON.stringify(objectData));

// // delete initial conditions from last session
// createJSON({}, currentInitialConditionsCollection);

// // create the complet catalogue of all available functions
// var createFunctionIndexesCatalogues = (library) => {
//     var functionLibrary = JSON.parse(fs.readFileSync(library));
//     console.log(functionLibrary);
//     var functionDecodedIndexes = {};
//     var functionEncodedIndexes = {};
//     var functionNamesDictionary = {};
//     var availableTypes = Object.keys(functionLibrary);
//     var availableTypesLength = availableTypes.length;
//     var availableFunctionsLength, readName, readIndex, readFuncType;
//     for (var t = 0; t < availableTypesLength; t++) {
//         availableFunctionsLength = Object.keys(functionLibrary[availableTypes[t]]).length;
//         for (var num = 0; num < availableFunctionsLength; num++) {
//             readName = Object.keys(functionLibrary[availableTypes[t]])[num];
//             readIndex = Object.values(functionLibrary[availableTypes[t]])[num].functionIndex;
//             readArguments = Object.values(functionLibrary[availableTypes[t]])[num].arguments;
//             readFuncType = Object.values(functionLibrary[availableTypes[t]])[num].functionType;
//             functionDecodedIndexes[readIndex.toString()] = readName;
//             functionEncodedIndexes[z2p(readIndex).toString()] = readName;
//             functionNamesDictionary[readName] = { encIndex: z2p(readIndex), intIndex: readIndex, functionType: readFuncType, arguments: readArguments };
//         }
//     }
//     var decodedIndexesOrdered = {};
//     Object.keys(functionDecodedIndexes).sort().forEach(function (key) {
//         decodedIndexesOrdered[key] = functionDecodedIndexes[key];
//     });
//     var encodedIndexesOrdered = {};
//     Object.keys(functionEncodedIndexes).sort().forEach(function (key) {
//         encodedIndexesOrdered[key] = functionEncodedIndexes[key];
//     });
//     var functionNamesOrdered = {};
//     Object.keys(functionNamesDictionary).sort().forEach(function (key) {
//         functionNamesOrdered[key] = functionNamesDictionary[key];
//     });
//     var completCatalogue = {
//         decodedIndexes: decodedIndexesOrdered,
//         encodedIndexes: encodedIndexesOrdered,
//         functionNames: functionNamesOrdered,
//         functionLibrary: functionLibrary
//     }
//     return completCatalogue;
// };

// // create the library with eligible functions extracted from the complete library
// var createEligibleFunctionLibrary = (completeLib, eligibleFunc) => {
//     var allDecIndexes = JSON.parse(JSON.stringify(completeLib.decodedIndexes));
//     var allFuncNames = JSON.parse(JSON.stringify(completeLib.functionNames));
//     var allFuncLibr = JSON.parse(JSON.stringify(completeLib.functionLibrary));
//     var includedFuncs = JSON.parse(JSON.stringify(eligibleFunc.includedFunctions));
//     if (includedFuncs.length == 0) includedFuncs = Object.keys(allDecIndexes).map(x => parseInt(x));
//     var excludedFuncs = JSON.parse(JSON.stringify(eligibleFunc.excludedFunctions));
//     var eligibleFuncLib = {
//         initialConditions: {
//             includedFunctions: eligibleFunc.includedFunctions,
//             excludedFunctions: excludedFuncs
//         },
//         eligibleFunctions: {},
//         decodedIndexes: {},
//         encodedIndexes: {},
//         functionNames: {},
//         functionLibrary: {
//             scoreF: {},
//             voiceF: {},
//             eventF: {},
//             listF: {},
//             paramF: {},
//             notevalueF: {},
//             durationF: {},
//             midipitchF: {},
//             frequencyF: {},
//             articulationF: {},
//             intensityF: {},
//             goldenintegerF: {},
//             quantizedF: {},
//             rhythmF: {},
//             harmonyF: {},
//             lnotevalueF: {},
//             ldurationF: {},
//             lmidipitchF: {},
//             lfrequencyF: {},
//             larticulationF: {},
//             lintensityF: {},
//             lgoldenintegerF: {},
//             lquantizedF: {},
//             operationF: {},
//             booleanF: {},
//         },
//     };
//     // add mandatory functions and remove duplicates if needed
//     // if (includedFuncs.length > 0) includedFuncs =
//     //    [... new Set(includedFuncs.concat(mandatoryFuncs))];
//     // remove excluded functions from the collection
//     var positionsForRemove = (excludedFuncs.map(x => includedFuncs.indexOf(x))).sort((a, b) => b - a);
//     positionsForRemove.map(x => { if (x > -1) includedFuncs.splice(x, 1); });
//     var totalIncludedFunctions = includedFuncs.length;
//     // write the eligible functions set
//     var readFunc, functTyp;
//     for (var fu = 0; fu < totalIncludedFunctions; fu++) {
//         readFunc = allDecIndexes[includedFuncs[fu]];
//         functTyp = allFuncNames[readFunc].functionType;
//         eligibleFuncLib.decodedIndexes[includedFuncs[fu].toString()] = readFunc;
//         eligibleFuncLib.encodedIndexes[z2p(includedFuncs[fu]).toString()] = readFunc;
//         eligibleFuncLib.functionNames[readFunc] = allFuncNames[readFunc];
//         eligibleFuncLib.functionLibrary[functTyp][readFunc] = allFuncLibr[functTyp][readFunc];
//     }
//     // sort lists
//     var decodedIndexesOrdered = {};
//     Object.keys(eligibleFuncLib.decodedIndexes).sort().forEach(function (key) {
//         decodedIndexesOrdered[key] = eligibleFuncLib.decodedIndexes[key];
//     });
//     eligibleFuncLib.decodedIndexes = decodedIndexesOrdered;
//     var encodedIndexesOrdered = {};
//     Object.keys(eligibleFuncLib.encodedIndexes).sort().forEach(function (key) {
//         encodedIndexesOrdered[key] = eligibleFuncLib.encodedIndexes[key];
//     });
//     eligibleFuncLib.encodedIndexes = encodedIndexesOrdered;
//     var functionNamesOrdered = {};
//     Object.keys(eligibleFuncLib.functionNames).sort().forEach(function (key) {
//         functionNamesOrdered[key] = eligibleFuncLib.functionNames[key];
//     });
//     eligibleFuncLib.functionNames = functionNamesOrdered;
//     eligibleFuncLib.eligibleFunctions = includedFuncs.sort((a, b) => a - b);
//     return eligibleFuncLib;
// };

// // generates the catalogues of function indexes
// var GenoMusFunctionLibrary = createFunctionIndexesCatalogues("aux/" + currentSpecies + "_functions.json");

// // exports the catalogues of function indexes, ordered by function name, encoded indexes and integer indexes
// createJSON(GenoMusFunctionLibrary, 'aux/GenoMus_function_library.json');

// //// GENOTYPES ENCODING, DECODING AND EVALUATION

// // Genotypes encoder
// var encodeGenotype = decGen => {
//     var encodedGenotype = [];
//     var leafType, leafIndex, readToken = "";
//     decGen = decGen.replace(/ /g, ""); // remove blanck spaces
//     var pos = 0;
//     do {
//         if (/^\,/.test(decGen) || /^\(/.test(decGen)) {
//             // ignores commas and open parenthesis, to not be read as a number
//             decGen = decGen.substr(1);
//         }
//         else if (/^\)/.test(decGen)) {
//             encodedGenotype.push(0);
//             decGen = decGen.substr(1);
//         }
//         else if (/^[a-zA-Z]/.test(decGen)) {
//             do {
//                 readToken += decGen[0];
//                 decGen = decGen.substr(1);
//             } while (decGen[pos] != "(");
//             if (GenoMusFunctionLibrary.functionNames[readToken] == undefined) {
//                 console.log("Error: invalid function name. Not found in the library.");
//                 return [-1];
//             }
//             else {
//                 leafType = GenoMusFunctionLibrary.functionNames[readToken].arguments[0];
//                 encodedGenotype.push(1, GenoMusFunctionLibrary.functionNames[readToken].encIndex);
//             }
//             readToken = "";
//             decGen = decGen.substr(1);
//         }
//         else if ((/^\d/.test(decGen) || /^./.test(decGen) || /^\//.test(decGen)) && /^\,/.test(decGen) == false && /^\)/.test(decGen) == false) {
//             while ((/^\d/.test(decGen) || /^./.test(decGen) || /^\//.test(decGen)) && /^\,/.test(decGen) == false && /^\)/.test(decGen) == false) {
//                 readToken += decGen[0];
//                 decGen = decGen.substr(1);
//             };
//             switch (leafType) {
//                 case "voidLeaf":
//                     break;
//                 case ("leaf"):
//                 case ("listLeaf"):
//                     encodedGenotype.push(0.5, parseFloat(readToken)); break;
//                 case "notevalueLeaf":
//                 case "lnotevalueLeaf":
//                     encodedGenotype.push(0.51, n2p(fraction2decimal(readToken))); break;
//                 case "durationLeaf":
//                 case "ldurationLeaf":
//                     encodedGenotype.push(0.52, d2p(parseFloat(readToken))); break;
//                 case "midipitchLeaf":
//                 case "lmidipitchLeaf":
//                     encodedGenotype.push(0.53, m2p(parseFloat(readToken))); break;
//                 case "frequencyLeaf":
//                 case "lfrequencyLeaf":
//                     encodedGenotype.push(0.54, f2p(parseFloat(readToken))); break;
//                 case "articulationLeaf":
//                 case "larticulationLeaf":
//                     encodedGenotype.push(0.55, a2p(parseFloat(readToken))); break;
//                 case "intensityLeaf":
//                 case "lintensityLeaf":
//                     encodedGenotype.push(0.56, i2p(parseFloat(readToken))); break;
//                 case "goldenintegerLeaf":
//                 case "lgoldenintegerLeaf":
//                     encodedGenotype.push(0.57, z2p(parseFloat(readToken))); break;
//                 case "quantizedLeaf":
//                 case "lquantizedLeaf":
//                     encodedGenotype.push(0.58, q2p(parseFloat(readToken))); break;
//                 default:
//                     console.log("Error: leaf type not found.");
//                     return [-1];
//             }
//             readToken = "";
//         }
//         else {
//             decGen = decGen.substr(1);
//         }
//     } while (decGen.length > 0);
//     return encodedGenotype;
// };

// // Genotypes decoder
// var decodeGenotype = encGen => {
//     var encGenLength = encGen.length;
//     var decodedGenotype = "";
//     var pos = 0;
//     while (pos < encGenLength) {
//         switch (encGen[pos]) {
//             case 0:
//                 decodedGenotype += "),"; break;
//             case 0.5:
//                 pos++; decodedGenotype += encGen[pos] + ","; break;
//             case 0.51:
//                 pos++; decodedGenotype += p2n(encGen[pos]) + ","; break;
//             case 0.52:
//                 pos++; decodedGenotype += p2d(encGen[pos]) + ","; break;
//             case 0.53:
//                 pos++; decodedGenotype += p2m(encGen[pos]) + ","; break;
//             case 0.54:
//                 pos++; decodedGenotype += p2f(encGen[pos]) + ","; break;
//             case 0.55:
//                 pos++; decodedGenotype += p2a(encGen[pos]) + ","; break;
//             case 0.56:
//                 pos++; decodedGenotype += p2i(encGen[pos]) + ","; break;
//             case 0.57:
//                 pos++; decodedGenotype += p2z(encGen[pos]) + ","; break;
//             case 0.58:
//                 pos++; decodedGenotype += p2q(encGen[pos]) + ","; break;
//             case 0.6:
//                 pos++; decodedGenotype += encGen[pos] + ","; break;
//             case 1:
//                 pos++; decodedGenotype += GenoMusFunctionLibrary.encodedIndexes[encGen[pos]] + "("; break;
//             default:
//                 console.log("Error: not recognized token reading input decoded genotype.");
//                 console.log("Readed value:" + encGen[pos]);
//                 return decodedGenotype;
//         }
//         pos++;
//     }
//     // removes trailing commas after returning decoded genotype
//     return decodedGenotype.replace(/\,\)/g, ")").slice(0, -1);
// };

// Extraction of leaves
// var extractLeaves = encGen => {
//     var encGenLength = encGen.length;
//     var pos = 0;
//     var encodedLeaves = [];
//     var autorefFunctionsIdentifiers = [0.45085, 0.068884, 0.686918, 0.304952, 0.922986, 
//         0.195415, 0.431483, 0.667551, 0.285585, 0.521653, 0.757721, 0.375755, 0.993789, 
//         0.611823, 0.229857, 0.847891, 0.465925, 0.083959];
//     while (pos < encGenLength) {
//         switch (encGen[pos]) {
//             case 0:
//                 break;
//             case 0.5:
//                 pos++; encodedLeaves.push([pos, encGen[pos], encGen[pos]]); break;
//             case 0.51:
//                 pos++; encodedLeaves.push([pos, encGen[pos], p2n(encGen[pos])]); break;
//             case 0.52:
//                 pos++; encodedLeaves.push([pos, encGen[pos], p2d(encGen[pos])]); break;
//             case 0.53:
//                 pos++; encodedLeaves.push([pos, encGen[pos], p2m(encGen[pos])]); break;
//             case 0.54:
//                 pos++; encodedLeaves.push([pos, encGen[pos], p2f(encGen[pos])]); break;
//             case 0.55:
//                 pos++; encodedLeaves.push([pos, encGen[pos], p2a(encGen[pos])]); break;
//             case 0.56:
//                 pos++; encodedLeaves.push([pos, encGen[pos], p2i(encGen[pos])]); break;
//             case 0.57: {
//                 pos++; 
//                 // filter to avoid mutation of internal autoreferences
//                 if (autorefFunctionsIdentifiers.includes(encGen[pos-2])) break;
//                 else {
//                     encodedLeaves.push([pos, encGen[pos], p2z(encGen[pos])]); 
//                     break;
//                 }
//             } 
//             case 0.58:
//                 pos++; encodedLeaves.push([pos, encGen[pos], p2q(encGen[pos])]); break;
//             case 0.6:
//                 pos++; encodedLeaves.push([pos, encGen[pos], encGen[pos]]); break;
//             case 1:
//                 break;
//         }
//         pos++;
//     }
//     // removes trailing commas after returning decoded genotype
//     return encodedLeaves;
// };


//// EXPRESSIONS PROCESSING

// compresses an expanded expression
// var compressExpr = expandedFormExpr => {
//     var temporaryExpr = "";
//     for (var charIndx = 0; charIndx < expandedFormExpr.length; charIndx++) {
//         if (expandedFormExpr.charAt(charIndx) != " " && expandedFormExpr.charAt(charIndx) != "\n") {
//             temporaryExpr = temporaryExpr + expandedFormExpr.charAt(charIndx);
//         }
//     }
//     temporaryExpr = temporaryExpr.replace(/,/g, ", ");
//     expandedFormExpr = temporaryExpr;
//     return expandedFormExpr;
// };

// // expands and indents a compressed expression in a human-readable format
// var expandExpr = compressedFormExpr => {
//     compressedFormExpr = compressExpr(compressedFormExpr);
//     compressExpr(compressedFormExpr);
//     var expandedExpression = "";
//     compressedFormExpr = compressedFormExpr.replace(/\(/g, "(\n");
//     compressedFormExpr = compressedFormExpr.replace(/, /g, ",\n");
//     compressedFormExpr = compressedFormExpr.replace(/\n\)/g, ")");
//     compressedFormExpr = compressedFormExpr.replace(/\bp\(\n/g, "p(");
//     compressedFormExpr = compressedFormExpr.replace(/\bn\(\n/g, "n(");
//     compressedFormExpr = compressedFormExpr.replace(/\bd\(\n/g, "d(");
//     compressedFormExpr = compressedFormExpr.replace(/\bm\(\n/g, "m(");
//     compressedFormExpr = compressedFormExpr.replace(/\bf\(\n/g, "f(");
//     compressedFormExpr = compressedFormExpr.replace(/\ba\(\n/g, "a(");
//     compressedFormExpr = compressedFormExpr.replace(/\bi\(\n/g, "i(");
//     compressedFormExpr = compressedFormExpr.replace(/\bq\(\n/g, "q(");
//     compressedFormExpr = compressedFormExpr.replace(/\bz\(\n/g, "z(");
//     compressedFormExpr = compressedFormExpr.replace(/pAutoref\(\n/g, "pAutoref(");
//     compressedFormExpr = compressedFormExpr.replace(/lAutoref\(\n/g, "lAutoref(");
//     compressedFormExpr = compressedFormExpr.replace(/eAutoref\(\n/g, "eAutoref(");
//     compressedFormExpr = compressedFormExpr.replace(/vAutoref\(\n/g, "vAutoref(");
//     compressedFormExpr = compressedFormExpr.replace(/sAutoref\(\n/g, "sAutoref(");
//     compressedFormExpr = compressedFormExpr.replace(/nAutoref\(\n/g, "nAutoref(");
//     compressedFormExpr = compressedFormExpr.replace(/dAutoref\(\n/g, "dAutoref(");
//     compressedFormExpr = compressedFormExpr.replace(/mAutoref\(\n/g, "mAutoref(");
//     compressedFormExpr = compressedFormExpr.replace(/fAutoref\(\n/g, "fAutoref(");
//     compressedFormExpr = compressedFormExpr.replace(/aAutoref\(\n/g, "aAutoref(");
//     compressedFormExpr = compressedFormExpr.replace(/iAutoref\(\n/g, "iAutoref(");
//     compressedFormExpr = compressedFormExpr.replace(/gAutoref\(\n/g, "gAutoref(");
//     compressedFormExpr = compressedFormExpr.replace(/qAutoref\(\n/g, "qAutoref(");
//     compressedFormExpr = compressedFormExpr.replace(/oAutoref\(\n/g, "oAutoref(");
//     compressedFormExpr = compressedFormExpr.replace(/lmAutoref\(\n/g, "lmAutoref(");
//     var parenthCount = 0;
//     for (var charIndx = 0; charIndx < compressedFormExpr.length; charIndx++) {
//         expandedExpression = expandedExpression + compressedFormExpr.charAt(charIndx);
//         if (compressedFormExpr.charAt(charIndx) == "(") {
//             parenthCount++
//         }
//         if (compressedFormExpr.charAt(charIndx) == ")") {
//             parenthCount--
//         }
//         if (compressedFormExpr.charAt(charIndx) == "\n") {
//             var tabulation = "   ";
//             for (nv = 0; nv < parenthCount; nv++) {
//                 expandedExpression = expandedExpression + tabulation;
//             }
//         }
//     }
//     // rewrites expandedExpr maintaining matrices in a single line
//     var matrixCompactExpr = "";
//     var matrixOpen = 0;
//     for (charIndx = 0; charIndx < expandedExpression.length; charIndx++) {
//         if (expandedExpression.charAt(charIndx) == "[") {
//             matrixOpen++
//         };
//         if (expandedExpression.charAt(charIndx) == "]") {
//             matrixOpen--
//         };
//         if (matrixOpen > 0) {
//             if (expandedExpression.charAt(charIndx) != "\n" && expandedExpression.charAt(charIndx) != " ") {
//                 matrixCompactExpr = matrixCompactExpr + expandedExpression.charAt(charIndx);
//             }
//         } else {
//             matrixCompactExpr = matrixCompactExpr + expandedExpression.charAt(charIndx);
//         }
//     }
//     compressedFormExpr = matrixCompactExpr;
//     //compressedFormExpr = compressedFormExpr.substring(1,compressedFormExpr.length-1);
//     return compressedFormExpr;
//     // outlet(0, compressedFormExpr);
//     // outlet(1, eval(compressedFormExpr)[0]);
// };

// // new unified CORE FUNCTION, introducing reversible germinal vector <-> encoded genotype
// var createGenotype = (
//         specimenType,
//         localEligibleFunctions,
//         listsMaxNumItems,
//         seedForAlea,
//         germinalVector
//     ) => {
//     initSubexpressionsArrays();
//     // main variable
//     var newBranch;
//     // generates the local catalogue of eligible functions to be used for genotype generation
//     var local_functions_catalogue = createEligibleFunctionLibrary(GenoMusFunctionLibrary, localEligibleFunctions);
//     // aux variables
//     var germinalVectorLength = germinalVector.length;
//     var germinalVectorReadingPos = 0;
//     var preEncGen = []; // rewriting of the germinal vector, to be an "identity germinal vector"
//     var newDecodedGenotype = "";
//     var genotypeDepth = 0;
//     var newLeaf;
//     var validGenotype = true;    
//     var notFilledParameters = [];
//     var expectedFunctions = [specimenType]; // stores functions names in process of writing; starting with the output type function
//     var chosenFunction;
//     var chosenEncIndex;
//     var openFunctionTypes = [];
//     var nextFunctionType = specimenType;
//     var eligibleFuncionNames;
//     var eligibleFuncionNamesLength;
//     var orderedElegibleEncIndexes;
//     var valueForChoosingNewFunction;
//     // important trick here: as leaf types codes are numbers bigger than 0.5, this values always will pass the threshold value
//     // with the following threshold design, there is an absolute minimum of 2 elements per list
//     var newListElementThreshold = Math.min(0.5, 1/listsMaxNumItems); 
//     var preItemValue; // determines if a new value must be added to a list
//     var cardinality;
//     var converser;
//     var typeIdentifier;
//     // start time for measuring creation loop and comparing to maxIntervalPerNewBranch
//     var newBranchStartTime = new Date();
//     do {
//         // adds a function
//         if (leafTypes.includes(nextFunctionType) == false) {
//             germinalVectorReadingPos++; // ignores first germinal value
//             preEncGen.push(1); // starts with new function identifier
//             // chooses a new function
//             valueForChoosingNewFunction = checkRange(r6d(germinalVector[germinalVectorReadingPos % germinalVectorLength]));
//             germinalVectorReadingPos++;
//             eligibleFuncionNames = (Object.keys(local_functions_catalogue.functionLibrary[nextFunctionType]));
//             eligibleFuncionNamesLength = eligibleFuncionNames.length;
//             orderedElegibleEncIndexes = [];
//             for (var elegitem = 0; elegitem < eligibleFuncionNamesLength; elegitem++) {
//                 orderedElegibleEncIndexes.push(local_functions_catalogue.functionNames[eligibleFuncionNames[elegitem]].encIndex);
//             }
//             orderedElegibleEncIndexes.sort((a, b) => a - b);
//             chosenEncIndex = findEligibleFunctionEncIndex(orderedElegibleEncIndexes, valueForChoosingNewFunction);
//             chosenFunction = local_functions_catalogue.encodedIndexes[chosenEncIndex];
//             // writes the new function
//             preEncGen.push(chosenEncIndex);
//             newDecodedGenotype += chosenFunction + "(";
//             // reads the expected parameters of the chosen function
//             openFunctionTypes[openFunctionTypes.length] = nextFunctionType;
//             notFilledParameters[notFilledParameters.length] = Object.keys
//                 (local_functions_catalogue.functionLibrary[nextFunctionType][chosenFunction].arguments).length;
//             expectedFunctions[notFilledParameters.length - 1] = chosenFunction;
//             // checks depth limits
//             if (notFilledParameters.length > genMaxDepth) {
//                 validGenotype = false;
//             } else if (notFilledParameters.length > genotypeDepth) genotypeDepth = notFilledParameters.length;
//         }
//         // adds a leaf
//         else {
//             // possibly optimizable if-block with less redundancy
//             if (nextFunctionType != "voidLeaf") {
//                 germinalVectorReadingPos++; // ignores germinal value, since it will be replaced with the leaf type identifier
//                 // reads leaf value
//                 newLeaf = checkRange(r6d(germinalVector[germinalVectorReadingPos % germinalVectorLength]));
//                 cardinality = 1;
//                 converser = functionTypesConverters[nextFunctionType].conversionFunc;
//                 typeIdentifier = functionTypesConverters[nextFunctionType].identifier;
//                 newDecodedGenotype += converser(newLeaf);
//                 preEncGen.push(typeIdentifier, newLeaf);
//                 // post(newDecodedGenotype);
//                 germinalVectorReadingPos++;
//                 preItemValue = checkRange(r6d(germinalVector[germinalVectorReadingPos % germinalVectorLength]));
//                 // when leaf is actually a list
//                 if (listLeafTypes.includes(nextFunctionType)) {
//                     while (preItemValue >= newListElementThreshold && cardinality < listsMaxNumItems) {
//                         germinalVectorReadingPos++;
//                         newLeaf = checkRange(r6d(germinalVector[germinalVectorReadingPos % germinalVectorLength]));
//                         germinalVectorReadingPos++;
//                         preItemValue = checkRange(r6d(germinalVector[germinalVectorReadingPos % germinalVectorLength]));
//                         newDecodedGenotype += "," + converser(newLeaf);
//                         preEncGen.push(typeIdentifier, newLeaf);
//                         cardinality++;
//                     }
//                 }
//             }
//             notFilledParameters[notFilledParameters.length - 1]--;
//             // if number of parameters of this depth level if filled, deletes this count level and adds ")", and "," if needed
//             if (notFilledParameters[notFilledParameters.length - 1] == 0) {
//                 do {
//                     if (notFilledParameters.length > 1) {
//                         notFilledParameters.pop();
//                         expectedFunctions.pop();
//                         openFunctionTypes.pop();
//                     }
//                     germinalVectorReadingPos++; // ignores next value, since is replaced with closing parenth. identifier
//                     preEncGen.push(0);
//                     newDecodedGenotype += ")";
//                     notFilledParameters[notFilledParameters.length - 1]--;
//                 } while (
//                     notFilledParameters[notFilledParameters.length - 1] == 0 &&
//                     validGenotype == true)
//             }
//             if (notFilledParameters[0] > 0) newDecodedGenotype += ",";
//         }
//         nextFunctionType = local_functions_catalogue.functionLibrary
//         [openFunctionTypes[openFunctionTypes.length - 1]]
//         [expectedFunctions[expectedFunctions.length - 1]]
//             .arguments[local_functions_catalogue.functionLibrary
//             [openFunctionTypes[openFunctionTypes.length - 1]]
//             [expectedFunctions[expectedFunctions.length - 1]]
//                 .arguments.length - notFilledParameters[notFilledParameters.length - 1]];
//         if (notFilledParameters.length > genMaxDepth) validGenotype == false;
//     } while (
//         notFilledParameters[0] > 0 &&
//         validGenotype == true); // &&
//     // removes trailing commas
//     newDecodedGenotype.substring(0, newDecodedGenotype.length - 1);
//     // phenotype seed only for evaluation of random functions (to be removed by using seed parameters in random funcs.)
//     if (validGenotype == true && new Date() - newBranchStartTime < maxIntervalPerNewBranch) {
//         createNewSeed(seedForAlea);
//         newBranch = eval(newDecodedGenotype);
//     } else {
//         return -1; // indicates not valid genotype found
//     }  
//     newBranch.data = {
//         specimenID: getFileDateName(currentUser),
//         specimenType: specimenType,
//         localEligibleFunctions: local_functions_catalogue.eligibleFunctions,
//         maxListCardinality: listsMaxNumItems,
//         phenotypeSeed: seedForAlea,
//         germinalVector: germinalVector,
//         encGenotypeLength: newBranch.encGen.length,
//         decGenotypeLength: newDecodedGenotype.length,
//         depth: genotypeDepth,
//         leaves: extractLeaves(newBranch.encGen),
//         germinalVectDeviation: distanceBetweenArrays(newBranch.encGen, germinalVector)
//     };
//     return newBranch;
// }

// creates brand new specimen
// var createNewSpecimen = () => {
//     var searchStartdate = new Date();
//     // main variables
//     var newSpecimen;
//     var bestSpecimen = -1;
//     // initial conditions
//     var germinalVec;
//     var outputType = specimenMainFunctionType;
//     var eligibleFuncs = eligibleFunctions;
//     var listMaxLength = defaultListsMaxCardinality;
//     var aleaSeed = parseInt(Math.random()*1e15);
//     // aux variables
//     var genotypeDepth;
//     var maxIterationPerSearch = maxIterations;
//     var iterations = 0;
//     var satisfiedConstraints = false;
//     if (outputType != "scoreF" && outputType != "voiceF") { 
//         maxIterationPerSearch = 1 }; // to avoid long searches for testing function types
//     var fitness = 0;
//     var bestFitness = -1;
//     // searches a specimen
//     do {
//         iterations++;
//         // creates a new genotype
//         germinalVec = randomVector(parseInt(Math.random()*defaultGerminalVecMaxLength) + 1);
//         newSpecimen = createGenotype(
//             outputType, eligibleFuncs, listMaxLength, aleaSeed, germinalVec);
//         // saves last genotype created as log file
//         // createJSON(iterations + ": " + newSpecimen.decGen, 'lastGenotype.json');
//         // tests if preconditions are fullfilled
//         if (
//             newSpecimen != -1
//             && newSpecimen.decGen.includes(mandatoryFunction) == true
//             && newSpecimen.phenLength >= phenMinLength
//             && newSpecimen.phenLength <= phenMaxLength
//             && newSpecimen.phenVoices >= phenMinPolyphony
//             && newSpecimen.phenVoices <= phenMaxPolyphony
//         ) {
//             satisfiedConstraints = true;
//             bestSpecimen = newSpecimen;
//         };
//         fitness = howNearToRange(newSpecimen.phenLength, phenMinLength, phenMaxLength)
//         + howNearToRange(newSpecimen.phenVoices, phenMinPolyphony, phenMinPolyphony);
//         if (fitness > bestFitness && satisfiedConstraints == false && newSpecimen != -1) {
//             bestSpecimen = newSpecimen;
//             bestFitness = fitness;
//             // post("new best fitness", bestFitness);
//             // post("satisfiedConstraints", satisfiedConstraints);
//         };
//     } while (
//         satisfiedConstraints == false
//         && iterations < maxIterationPerSearch
//         && new Date() - searchStartdate <= maxIntervalPerSearch);
//     // saves all genotypes as log file
//     // genotypeLog["gen" + genCount++] = bestSpecimen.decGen;
//     // createJSON(genotypeLog, 'genotipeLog.json');
//     if (bestSpecimen == -1) {
//         // post("VALID SPECIMEN NOT FOUND");
//         bestSpecimen = eval("s(v(" + defaultEventExpression + "))");
//         bestSpecimen.data = {
//             specimenID: getFileDateName("not_found"),
//             specimenType: specimenMainFunctionType,
//             iterations: iterations,
//             milliseconsElapsed: new Date() - searchStartdate,
//             encGenotypeLength: "using default expression",
//             decGenotypeLength: ("s(v(" + defaultEventExpression + "))").length,
//             germinalVector: germinalVec,
//             germinalVectorDeviation: 0,
//             phenotypeSeed: aleaSeed,            
//             depth: 4,
//             leaves: extractLeaves(bestSpecimen.encGen),
//         };
//         return bestSpecimen;
//     };
//     if (satisfiedConstraints) maxAPI.outlet("found") 
//     else maxAPI.outlet("notfound");
//     bestSpecimen.data.iterations = iterations;
//     bestSpecimen.data.milliseconsElapsed = new Date() - searchStartdate;
//     // post("final fitness",fitness);
//     // post("satisfiedConstraints", satisfiedConstraints);
//     return bestSpecimen;
// }

// // creates specimen from initial conditions
// var specimenFromInitialConditions = (
//     outputType, eligibleFuncs, listMaxLength, aleaSeed, germinalVec) => {
//     var searchStartdate = new Date();
//     // main variable
//     var specimenFromInitConds;
//     // aux variables
//     var genotypeDepth;
//     // renders the genotype
//     specimenFromInitConds = createGenotype(
//         outputType, eligibleFuncs, listMaxLength, aleaSeed, germinalVec);
//     // saves last genotype created as log file
//     createJSON(specimenFromInitConds.decGen, 'aux/lastGenotype.json');
//     if (specimenFromInitConds == -1) {
//         specimenFromInitConds = eval("s(v(" + defaultEventExpression + "))");
//         specimenFromInitConds.data = {
//             specimenID: getFileDateName("not_valid_initial_conditions"),
//             iterations: 0,
//             milliseconsElapsed: new Date() - searchStartdate,
//             encGenotypeLength: specimenFromInitConds.encGen.length,
//             decGenotypeLength: specimenFromInitConds.decGen.length,
//             localEligibleFunctions: eligibleFuncs,
//             germinalVector: germinalVec,
//             germinalVectDeviation: distanceBetweenArrays(specimenFromInitConds.encGen, germinalVec),
//             phenotypeSeed: aleaSeed,            
//             depth: genotypeDepth,
//             leaves: extractLeaves(specimenFromInitConds.encGen)
//         };
//         return specimenFromInitConds;
//     }
//     specimenFromInitConds.data = {
//         specimenID: getFileDateName(currentUser),
//         specimenType: outputType,
//         localEligibleFunctions: specimenFromInitConds.data.localEligibleFunctions,
//         maxListCardinality: listMaxLength,
//         phenotypeSeed: aleaSeed,            
//         germinalVector: germinalVec,
//         iterations: 0,
//         milliseconsElapsed: new Date() - searchStartdate,
//         encGenotypeLength: specimenFromInitConds.encGen.length,
//         decGenotypeLength: specimenFromInitConds.decGen.length,
//         germinalVectDeviation: distanceBetweenArrays(specimenFromInitConds.encGen, germinalVec),
//         depth: specimenFromInitConds.data.depth,
//         leaves: extractLeaves(specimenFromInitConds.encGen)
//     };    
//     return specimenFromInitConds;
// };

// // mutates only leaves of a specimen according to certain probabilities
// // mutProbability is mutations probability (0 -> no mutations, 1 -> everything mutated)
// // mutAmount is range of a mutation, no trespassing interval [0, 1]
// var mutateSpecimenLeaves = (originalSpecimen, mutProbability, mutAmount) => {
//     var startDate = new Date();
//     initSubexpressionsArrays();
//     var mutatedSpecimen = originalSpecimen;
//     var extractedLeaves = extractLeaves(mutatedSpecimen.encodedGenotype);
//     var numLeaves = extractedLeaves.length;
//     for (var currentLeaf=0; currentLeaf<numLeaves; currentLeaf++) {
//         if (Math.random() < mutProbability) {
//             mutatedSpecimen.encodedGenotype[extractedLeaves[currentLeaf][0]] = 
//             checkRange(r6d(mutatedSpecimen.encodedGenotype[extractedLeaves[currentLeaf][0]] + mutAmount * (Math.random() * 2 - 1)));
//         }
//     }
//     createNewSeed(originalSpecimen.initialConditions.phenotypeSeed);
//     mutatedSpecimen = eval(decodeGenotype(mutatedSpecimen.encodedGenotype));
//     mutatedSpecimen.data = {
//         specimenID: getFileDateName(currentUser),
//         specimenType: originalSpecimen.initialConditions.specimenType,
//         localEligibleFunctions: originalSpecimen.initialConditions.localEligibleFunctions,
//         maxListCardinality: originalSpecimen.initialConditions.maxListCardinality,
//         phenotypeSeed: originalSpecimen.initialConditions.phenotypeSeed,
//         germinalVector: mutatedSpecimen.encGen,
//         iterations: 0,
//         milliseconsElapsed: new Date() - startDate,
//         encGenotypeLength: mutatedSpecimen.encGen.length,
//         decGenotypeLength: mutatedSpecimen.decGen.length,
//         germinalVectDeviation: 0,
//         depth: originalSpecimen.metadata.depth,
//         leaves: extractLeaves(mutatedSpecimen.encGen)
//     };
//     return specimenDataStructure(mutatedSpecimen);
// };

// // replaces a branch of a given output type in a specimen, 
// // with a brand new generated branch, a returns only the new decodedGenotype
// var replaceBranch = (originalSpecimen, replacedBranchType, branchIndex) => {
//     var replacedBranchSet = originalSpecimen.subexpressions[replacedBranchType];
//     if (replacedBranchSet.length == 0) return originalSpecimen.decodedGenotype;
//     var replacedBranch = replacedBranchSet[branchIndex % replacedBranchSet.length];
//     newRndSeed();
//     var branchReplacement = createGenotype(
//         replacedBranchType,
//         {
//             includedFunctions: originalSpecimen.initialConditions.localEligibleFunctions,
//             excludedFunctions: []
//         },
//         originalSpecimen.initialConditions.maxListCardinality,
//         originalSpecimen.initialConditions.phenotypeSeed,
//         randomVector(defaultGerminalVecMaxLength)
//     ).decGen;
//     if (branchReplacement == -1) {
//         post("not valid branch replacement found", "");
//         return originalSpecimen.decodedGenotype;
//     } 
//     return originalSpecimen.decodedGenotype.replace(replacedBranch, branchReplacement);
// };



//// SPECIES HANDLING

// global variable to store specific functions depending on current species 
// var encPhen2bachRoll;
// var e; // identity event function
// var mergeScores; // aux function to merge scores
// var vMotif, vMotifLoop, vPerpetuumMobile, vPerpetuumMobileLoop;
// var vSlice;
// var e2Pitches, e3Pitches, e4Pitches, e5Pitches;

// // create specific functions for the current species
// var createSpeciesDependentFunctions = (speciesName) => {
//     switch (speciesName) {
//         case "piano":
//             encPhen2bachRoll = encPhen2bachRoll_piano;
//             e = e_piano;
//             mergeScores = mergeScores_piano;
//             vMotif = vMotif_piano;
//             vMotifLoop = vMotifLoop_piano;
//             vSlice = vSlice_piano;
//             vPerpetuumMobile = vPerpetuumMobile_piano;
//             vPerpetuumMobileLoop = vPerpetuumMobileLoop_piano;
//             e2Pitches = e2Pitches_piano;
//             e3Pitches = e3Pitches_piano;
//             e4Pitches = e4Pitches_piano;
//             e5Pitches = e5Pitches_piano;
//             break;
//         case "piano_4xtra":
//             encPhen2bachRoll = encPhen2bachRoll_piano_4xtra;
//             e = e_piano_4xtra;
//             mergeScores = mergeScores_piano_4xtra;
//             vMotif = vMotif_piano_4xtra;
//             vMotifLoop = vMotifLoop_piano_4xtra;
//             vSlice = vSlice_piano_4xtra;
//             vPerpetuumMobile = vPerpetuumMobile_piano_4xtra;
//             vPerpetuumMobileLoop = vPerpetuumMobileLoop_piano_4xtra;
//             e2Pitches = e2Pitches_piano_4xtra;
//             e3Pitches = e3Pitches_piano_4xtra;
//             e4Pitches = e4Pitches_piano_4xtra;
//             e5Pitches = e5Pitches_piano_4xtra;
//             break;
//         case "csound":
//             encPhen2bachRoll = encPhen2bachRoll_csound;
//             e = e_csound;
//             mergeScores = mergeScores_csound;
//             vMotif = vMotif_csound;
//             vMotifLoop = vMotifLoop_csound;
//             vSlice = vSlice_csound;
//             vPerpetuumMobile = vPerpetuumMobile_csound;
//             vPerpetuumMobileLoop = vPerpetuumMobileLoop_csound;
//             e2Pitches = e2Pitches_csound;
//             e3Pitches = e3Pitches_csound;
//             e4Pitches = e4Pitches_csound;
//             e5Pitches = e5Pitches_csound;
//             break;
//         default:
//             console.log("Error: species unknown.");
//             return [-1];
//     }
// }
// createSpeciesDependentFunctions(currentSpecies);

// init currentSpecimen with a random default specimen
// var currentSpecimen = evalDecGen(defaultEventExpression);
// var currentSpecimen = specimenDataStructure(createNewSpecimen());





