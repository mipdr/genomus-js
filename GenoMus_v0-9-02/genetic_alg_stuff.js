//// GENETIC ALGORITHM FIRST APPROACH


var fitnessFunction = (candidate) => distanceBetweenArrays(BACH, candidate);  

var specimensPerGeneration = 140;
var createPopulation = () => {
    var newPopulation = [];
    var newItemLength;
    var maxLengthForGerminalVectors = defaultGerminalVecMaxLength;
    for (var a=0; a<specimensPerGeneration; a++) {
        newItemLength = parseInt((maxLengthForGerminalVectors - 5) * Math.random() + 1) + 5;
        newPopulation[a] = randomVector(newItemLength);
    }    
    return newPopulation;
}

// mutate an item according to a probability of mutation (mutPr) and a maximal amount of change for each mutation (mutAm)
var mutateItem = (cand, mutPr, mutAm) => {
    if (mutAm == 0 || mutPr == 0) return cand;
    if (mutPr < 1e-6) mutPr = 1e-6;
    var trials = 0;
    var arrLength = cand.length;
    var newArr = cand.slice();
    do {
        for (var ind = 0; ind < arrLength; ind++) {
            if (Math.random() < mutPr) {
                newArr[ind] = checkRange(r6d(newArr[ind] + mutAm * (Math.random() * 2 - 1)));
            }
        }
    // avoid identic mutations
    } while (arrayEquals(cand, newArr) && trials < 3);
    return newArr;
}

var currentPopulation = createPopulation(100);
var onlyErrors = [];

var currentErrors = [];
var newGeneration = [];
// replaces the proto germinal vector with truncated optimized germinal vector
var newGenerationMappedGerminalVectors = [];
var currentGenPhenotypeSeeds = []; // phenotype seed for each specimen
var numGeneration = 0;
var elitePreservedSpecimens = 0.1; // ratio of best specimens preserved withoud mutation for next generation
var graftedSpecimens = 0.4; // ratio of spceimens with a replaced branch
var brandNewSpecimens = 0.15; // ratio of total new specimens introduced at each generation in the genetic pool
var numEliteSpecs = Math.ceil(specimensPerGeneration * elitePreservedSpecimens);
var numGraftedSpecimens = Math.ceil(specimensPerGeneration * graftedSpecimens);
var numNewSpecs = Math.ceil(specimensPerGeneration * brandNewSpecimens);
var numMutatedSpecs = specimensPerGeneration - numEliteSpecs - numGraftedSpecimens - numNewSpecs;
var bestResult = Infinity;
var fitnessProgression = [];

// post("numEliteSpecs:", numEliteSpecs);
// post("numGraftedSpecs:", numGraftedSpecimens);
// post("numNewSpecs:", numNewSpecs);
// post("numMutatedSpecs:", numMutatedSpecs);

// var germinalVectorLength = 50;
// var refineSearchRange = germinalVectorLength * 0.01;
var generationsWithoutBetterResults = 0;
var maxUnsuccededTrials = 10000;

var simpleBACHSearch = () => {
    var timeLapse = 3000;
    var thisLoopTrials = 0;
    var startTime = new Date();
    var newTryBestDistance = Infinity;
    var foundNewBest = false;
    var progressiveMutationFactor;
    var generationsWithoutBetterResults = 0;
    var oscilFactor1, oscilFactor2;
    var evaluatedNewCandidate;
    var evaluatedSpecimenToGraft;
    var graftedDecGenotype;
    var branchTypeToGraft;
    var errorsWithoutDuplicates;
    var outputTypes = [
        "scoreF", 
        "voiceF", 
        "eventF", 
        "paramF", 
        "listF", 
        "notevalueF", 
        "lnotevalueF", 
        "midipitchF", 
        "lmidipitchF", 
        "articulationF", 
        "larticulationF", 
        "intensityF", 
        "lintensityF", 
        "goldenintegerF", 
        "lgoldenintegerF", 
        "quantizedF", 
        "lquantizedF"];
    // maxAPI.post(currentPopulation[0]);
    do {
        generationsWithoutBetterResults++;
        numGeneration++;
        thisLoopTrials++;
        // maxAPI.post("trials:" + thisLoopTrials);
        // creates new generation
        newGeneration = [];
        // preserve elite specimens avoiding duplicates
        var takenEliteSpecIdx = 0;
        // post("currentErrors",currentErrors);
        for (var specIndx = 0; takenEliteSpecIdx < numEliteSpecs; specIndx++) {
            newGeneration.push(currentPopulation[takenEliteSpecIdx].slice());
            takenEliteSpecIdx++;       
        }
        // adds mutated specimens
        for (var specIndx2 = 0; specIndx2 < numMutatedSpecs; specIndx2++) {
            // newGeneration.push(mutateItem(currentPopulation[specIndx2].slice(), Math.random(), 0.5*refineSearchRange));
            if (Math.random() > 0.75) phenotypeSeed = parseInt(Math.random()*100000000);
            progressiveMutationFactor = Math.pow((specIndx2+1)/(numMutatedSpecs+1),3);
            // maxAPI.post(progressiveMutationFactor);
            oscilFactor1 = (Math.sin(numGeneration * 0.1) + 1) * 0.8;
            oscilFactor2 = (Math.sin(numGeneration * 0.17) + 1) * 0.8;
            newGeneration.push(
                mutateItem(
                    currentPopulation[specIndx2 % numMutatedSpecs].slice(), 
                    (progressiveMutationFactor+0.01) * oscilFactor1, 
                    (progressiveMutationFactor+0.01+generationsWithoutBetterResults*0.005) * oscilFactor2
                ) 
            );

            // newGeneration.push(mutateItem(currentPopulation[specIndx2].slice(), 0.05, 0.2));
        }
        // adds specimen with replaced branches
        for (var specIndx3 = 0; specIndx3 < numGraftedSpecimens; specIndx3++) {
            // newRndSeed();
            evaluatedSpecimenToGraft = specimenDataStructure(specimenFromInitialConditions(
                "scoreF",
                eligibleFunctions,
                defaultListsMaxCardinality,
                phenotypeSeed,
                currentPopulation[specIndx3 % numEliteSpecs].slice()));
            // post("tomado: ", evaluatedSpecimenToGraft.decodedGenotype);
            branchTypeToGraft = outputTypes[parseInt(Math.random()*outputTypes.length)];
            // post("branchTypeToGraft",branchTypeToGraft);
            graftedDecGenotype = replaceBranch(
                evaluatedSpecimenToGraft, 
                branchTypeToGraft, 
                parseInt(Math.random()*1000)
            );  
            newGeneration.push(encodeGenotype(graftedDecGenotype));   
            // post("graftedSpecimen", graftedDecGenotype);
        }
        // adds brand new specimens
        for (var specIndx4 = 0; specIndx4 < numNewSpecs; specIndx4++) {
            newRndSeed();
            newGeneration.push(randomVector(defaultGerminalVecMaxLength));
        }
        // evaluates fitness of each new specimen
        for (var a=0; a<specimensPerGeneration; a++) {
            evaluatedNewCandidate = specimenDataStructure(specimenFromInitialConditions(
                "scoreF",
                eligibleFunctions,
                defaultListsMaxCardinality,
                phenotypeSeed,
                newGeneration[a]));
            currentErrors[a] = [a,fitnessFunction(evaluatedNewCandidate.encodedPhenotype)];
            newGenerationMappedGerminalVectors[a] = evaluatedNewCandidate.encodedGenotype;
            newGeneration[a] = newGenerationMappedGerminalVectors[a];
        }
        // order specimen indexes according to errors 
        currentErrors.sort((a,b)=>a[1]-b[1]);
        onlyErrors = [...new Set(currentErrors.map(x => x[1]))];

        // reorder newGeneration according to its previous calculated error, replacing current population
        currentPopulation = [];
        errorsWithoutDuplicates = [];
        for (var a=0; a<specimensPerGeneration; a++) {
            // check if specimen error is yet included
            if (errorsWithoutDuplicates.includes(currentErrors[a][1]) == false) {
                currentPopulation.push(newGeneration[currentErrors[a][0]]);
                errorsWithoutDuplicates.push(currentErrors[a][1]);
            }  
        }
        //maxAPI.post("after ordering: " + currentErrors);
        //maxAPI.post("errorsWithoutDuplicates: " + errorsWithoutDuplicates);
        //maxAPI.post("currentPopulationlength: " + currentPopulation.length);

        newTryBestDistance = currentErrors[0][1];
        // maxAPI.post("newTryBestDistance " + newTryBestDistance);
        // maxAPI.post("but bestResult " + bestResult);
        
        // var newGerminalV = mutateItem(currentPopulation[0], Math.random(), 0.4);
        // var newCandidate = specimenDataStructure(specimenFromInitialConditions(newGerminalV, globalSeed, phenotypeSeed));
        // newDistance = distanceBetweenArrays(BACH, newCandidate.encodedPhenotype);
        if (newTryBestDistance < bestResult) {
            // currentPopulation[0] = newGerminalV;
            bestResult = newTryBestDistance; 
            foundNewBest = true;       
            maxAPI.post("best specimen was number " + currentErrors[0][0]);
        }

        // after deleting duplicates, adds more brand new specimens to complete the population, if needed
        if (specimensPerGeneration - currentPopulation.length > 0) {
            for (var specIndx5 = 0; specIndx5 < specimensPerGeneration - currentPopulation.length; specIndx5++) {
                newRndSeed();
                currentPopulation.push(randomVector(defaultGerminalVecMaxLength));
            }
        }
        fitnessProgression.push(bestResult);
    // } while ((new Date()) - startTime < timeLapse && foundNewBest == false);
    } while ( thisLoopTrials < 10 && foundNewBest == false);
    if (foundNewBest) {
        var newBestSpecimen = specimenDataStructure(specimenFromInitialConditions(
            "scoreF",
            eligibleFunctions,
            defaultListsMaxCardinality,
            phenotypeSeed,
            newGeneration[0]))
        // for (var nums = 0; nums < specimensPerGeneration; nums++) {
        //     maxAPI.post(currentPopulation[nums][0] + " " + currentPopulation[nums][1] + " " + currentPopulation[nums][2] + " " + currentPopulation[nums][3] + " " + currentPopulation[nums][4] + " " + currentPopulation[nums][5] + " " + currentPopulation[nums][6] + " " + currentPopulation[nums][7] + " " + currentPopulation[nums][8]);
        // }
        maxAPI.post("proximity: " + bestResult + " after " + numGeneration);
        currentSpecimen = newBestSpecimen;
        currentSpecimen.fitness = bestResult;
        currentSpecimen.fitnessProgression = fitnessProgression;
        currentSpecimen.fitnessHighestValue = Math.max(...fitnessProgression);
        currentSpecimen.generationNumber = numGeneration;
    } else {
        // maxAPI.post("current fitness: " + bestResult + " after " + numGeneration);
        maxAPI.post(numGeneration + " generations");
    }
}


//// CORE FUNCTIONS FOR SPECIMEN CREATION AND EVOLUTION

// FORMATS SPECIMEN DATA ACCORDING TO AN OUTPUT DATA STRUCTURE FOR AN OBJECT AND JSON FILES
var specimenDataStructure = (specimenData) => ({
    initialConditions: {
        species: currentSpecies,
        specimenType: specimenData.data.specimenType,
        localEligibleFunctions: specimenData.data.localEligibleFunctions,
        maxListCardinality: specimenData.data.maxListCardinality,
        phenotypeSeed: specimenData.data.phenotypeSeed,
        germinalVector: specimenData.data.germinalVector
    },
    metadata: {
        specimenID: specimenData.data.specimenID,
        GenoMusVersion: version,
        iterations: specimenData.data.iterations,
        milliseconsElapsed: specimenData.data.milliseconsElapsed,
        depth: specimenData.data.depth,
        voices: specimenData.phenVoices,
        events: specimenData.phenLength,
        decGenotypeLength: specimenData.data.decGenotypeLength,
        encGenotypeLength: specimenData.data.encGenotypeLength,
        germinalVectorLength: specimenData.data.germinalVector.length,
        germinalVectorDeviation: specimenData.data.germinalVectDeviation,
        genotypeSeed: specimenData.data.genotypeSeed
    },
    encodedGenotype: specimenData.encGen,
    decodedGenotype: specimenData.decGen,
    formattedGenotype: expandExpr(specimenData.decGen),
    encodedPhenotype: specimenData.encPhen,
    subexpressions: {
        scoreF: subexpressions["scoreF"],
        voiceF: subexpressions["voiceF"],
        eventF: subexpressions["eventF"],
        paramF: subexpressions["paramF"],
        listF: subexpressions["listF"],
        notevalueF: subexpressions["notevalueF"],
        lnotevalueF: subexpressions["lnotevalueF"],
        durationF: subexpressions["durationF"],
        ldurationF: subexpressions["ldurationF"],
        midipitchF: subexpressions["midipitchF"],
        lmidipitchF: subexpressions["lmidipitchF"],
        frequencyF: subexpressions["frequencyF"],
        lfrequencyF: subexpressions["lfrequencyF"],
        articulationF: subexpressions["articulationF"],
        larticulationF: subexpressions["larticulationF"],
        intensityF: subexpressions["intensityF"],
        lintensityF: subexpressions["lintensityF"],
        goldenintegerF: subexpressions["goldenintegerF"],
        lgoldenintegerF: subexpressions["lgoldenintegerF"],
        quantizedF: subexpressions["quantizedF"],
        lquantizedF: subexpressions["lquantizedF"],
        harmonyF: subexpressions["harmonyF"],
        operationF: subexpressions["operationF"],
        booleanF: subexpressions["booleanF"]
    },
    leaves: specimenData.data.leaves,
    // wraps encPhen before creating bach roll for Max
    roll: encPhen2bachRoll(wrapDecGen(specimenData)),
    // csoundScore: encPhen2csoundScore(specimen.encPhen)
});