// output for debugging
var post = (message, monitoredVar) => {
    if (monitoredVar == undefined) monitoredVar = "";
    if (debugMode == "terminal") console.log(message + " " + monitoredVar);
    else if (debugMode == "max_console") maxAPI.post(message + " " + monitoredVar);
}
// var debugMode = "terminal";
var debugMode = "max_console";

//// MAX COMMUNICATION

maxAPI.addHandlers({
    initNode: () => {
        debugMode = "max_console";
        post("GenoMus - version " + version);
    },
    brandNewSpecimen: () => {
        currentSpecimen = specimenDataStructure(createNewSpecimen());
        saveTemporarySpecimens(currentSpecimen);
        maxAPI.setDict("specimen.dict", currentSpecimen);
        maxAPI.outlet("finished");
        maxAPI.outlet("resetLastSpecsCounter");
    },
    // load JSON initial conditions from file
    loadInitialConditions: (savedSpecimenIndex) => {
        var initConditionsFromFile = JSON.parse(fs.readFileSync(currentInitialConditionsCollection));
        var totalSpecimensSaved = Object.keys(initConditionsFromFile).length;
        if (savedSpecimenIndex >= totalSpecimensSaved) {
            post("it doesn't exist specimen with index",savedSpecimenIndex);
        }
        else {
            // post("totalSpecimensSaved", totalSpecimensSaved);
            // post("loaded", Object.keys(initConditionsFromFile)[savedSpecimenIndex]);
            // post("savedSpecimenIndex", savedSpecimenIndex);
            var loadedInitConds = initConditionsFromFile[Object.keys(initConditionsFromFile)[savedSpecimenIndex]];
            // post("loadedInitConds", loadedInitConds);
            var specimenID = Object.keys(initConditionsFromFile)[savedSpecimenIndex];
            currentSpecimen = specimenDataStructure(specimenFromInitialConditions(
                loadedInitConds.specimenType, 
                loadedInitConds.localEligibleFunctions, 
                loadedInitConds.listsMaxNumItems, 
                loadedInitConds.seedForAlea,
                loadedInitConds.germinalVector));
            leaves = currentSpecimen.leaves;
            phenotypeSeed = currentSpecimen.initialConditions.phenotypeSeed;
            currentSpecimen.metadata.specimenID = specimenID;
            saveTemporarySpecimens(currentSpecimen);
            maxAPI.outlet(maxAPI.setDict("specimen.dict", currentSpecimen));
            maxAPI.outlet("finished");
        }
    },
    saveInitialConditions: (alias) => {
        newSpecimenName = currentSpecimen.metadata.specimenID;
        if (alias != "") newSpecimenName = newSpecimenName + "_" + alias;
        var newInitConds = {
            "species": currentSpecimen.initialConditions.species,
            "specimenType": currentSpecimen.initialConditions.specimenType,
            "localEligibleFunctions": {
                "includedFunctions":  currentSpecimen.initialConditions.localEligibleFunctions,   
                "excludedFunctions": []
            },
            "listsMaxNumItems": currentSpecimen.initialConditions.maxListCardinality,
            "seedForAlea": currentSpecimen.initialConditions.phenotypeSeed,
            "germinalVector": currentSpecimen.initialConditions.germinalVector,
        }
        var existingInitConditions = JSON.parse(fs.readFileSync(currentInitialConditionsCollection));
        existingInitConditions[newSpecimenName] = newInitConds;
        createJSON(existingInitConditions, currentInitialConditionsCollection);
    },
    deleteInitialConditions: (savedSpecimenIndex) => {
        var existingInitConditionsFromFile = JSON.parse(fs.readFileSync(currentInitialConditionsCollection));
        post('deleted specimen', Object.keys(existingInitConditionsFromFile)[savedSpecimenIndex]);
        var itemToRemove = Object.keys(existingInitConditionsFromFile)[savedSpecimenIndex];
        delete existingInitConditionsFromFile[itemToRemove];
        createJSON(existingInitConditionsFromFile, currentInitialConditionsCollection);
    },
    // saves and loads collections of initial conditions
    savePopulation: (filename) => {
        var existingInitConditionsFromFile = JSON.parse(fs.readFileSync(currentInitialConditionsCollection));
        createJSON(existingInitConditionsFromFile, 'populations/' + filename + '.json');
    },
    loadPopulation: (filename) => {
        var initConditionsFromFile = JSON.parse(fs.readFileSync('populations/' + filename));
        createJSON(initConditionsFromFile, currentInitialConditionsCollection);
        var loadedInitConds = initConditionsFromFile[Object.keys(initConditionsFromFile)[0]];
        var specimenID = Object.keys(initConditionsFromFile)[0];
        currentSpecimen = specimenDataStructure(specimenFromInitialConditions(
            loadedInitConds.specimenType, 
            loadedInitConds.localEligibleFunctions, 
            loadedInitConds.listsMaxNumItems, 
            loadedInitConds.seedForAlea,
            loadedInitConds.germinalVector));
        leaves = currentSpecimen.leaves;
        phenotypeSeed = currentSpecimen.initialConditions.phenotypeSeed;
        currentSpecimen.metadata.specimenID = specimenID;
        saveTemporarySpecimens(currentSpecimen);
        maxAPI.outlet(maxAPI.setDict("specimen.dict", currentSpecimen));
        maxAPI.outlet("finished");
        post("loaded initial conditions collection", filename);
    },
    // saves and loads complete specimen data
    saveSpecimen: (filename) => {;
        currentSpecimen.metadata.specimenID += "_" + filename;
        createJSON(currentSpecimen, 'specimens/' + filename + '.json');
    },
    loadSpecimen: (filename) => {
        currentSpecimen = JSON.parse(fs.readFileSync('specimens/' + filename));
        specimenMainFunctionType = currentSpecimen.initialConditions.specimenType;
        defaultListsMaxCardinality = currentSpecimen.initialConditions.maxListCardinality;
        phenotypeSeed = currentSpecimen.initialConditions.phenotypeSeed;
        leaves = currentSpecimen.leaves;
        maxAPI.setDict("specimen.dict", currentSpecimen);
        maxAPI.outlet("finished");
    },
    loadLastSpecimens: (lastSpecIndex) => {
        currentSpecimen = lastSpecimens[lastSpecIndex % lastSpecimens.length];
        specimenMainFunctionType = currentSpecimen.initialConditions.specimenType;
        defaultListsMaxCardinality = currentSpecimen.initialConditions.maxListCardinality;
        phenotypeSeed = currentSpecimen.initialConditions.phenotypeSeed;
        leaves = currentSpecimen.leaves;
        maxAPI.setDict("specimen.dict", currentSpecimen);
        maxAPI.outlet("finished");
    },
    // render from graphical germinal vector (to do: rename this function)
    renderInitialConditions: (arrayAsString) => {
        currentSpecimen  = specimenDataStructure(specimenFromInitialConditions(
            specimenMainFunctionType, 
            eligibleFunctions, 
            defaultListsMaxCardinality, 
            phenotypeSeed,
            eval(arrayAsString)));  
        saveTemporarySpecimens(currentSpecimen);          
        maxAPI.setDict("specimen.dict", currentSpecimen);
        maxAPI.outlet("finished");
        maxAPI.outlet("resetLastSpecsCounter");
    },
    encGenAsGerminal: () => {
        currentSpecimen = specimenDataStructure(specimenFromInitialConditions(
            currentSpecimen.initialConditions.specimenType,
            eligibleFunctions, 
            defaultListsMaxCardinality, 
            currentSpecimen.initialConditions.phenotypeSeed,
            currentSpecimen.encodedGenotype));            
        saveTemporarySpecimens(currentSpecimen);          
        maxAPI.setDict("specimen.dict", currentSpecimen);
        maxAPI.outlet("finished");
        maxAPI.outlet("resetLastSpecsCounter");
    },
    text: (typedDecGen) => {
        // if needed, removes quote symbols at the beginning and the end of the string
        if (typedDecGen[0] == '"') {
            typedDecGen = typedDecGen.substring(1);
            typedDecGen = typedDecGen.substring(0, typedDecGen.length - 1);
        }
        createNewSeed(currentSpecimen.initialConditions.phenotypeSeed);
        currentSpecimen = evalDecGen(typedDecGen);
        currentSpecimen.data = {
            specimenID: getFileDateName(currentUser),
            specimenType: currentSpecimen.funcType, // to be done: recognition of the first function entered typing
            localEligibleFunctions: [],
            maxListCardinality: "unlimited",
            phenotypeSeed: phenotypeSeed,
            germinalVector: currentSpecimen.encGen,
            iterations: 0,
            milliseconsElapsed: 0,
            encGenotypeLength: currentSpecimen.encGen.length,
            decGenotypeLength: currentSpecimen.decGen.length,
            germinalVectDeviation: 0,
            depth: measureStringMaxDepth(currentSpecimen.decGen),
            leaves: extractLeaves(currentSpecimen.encGen)
        };
        currentSpecimen = specimenDataStructure(currentSpecimen);
        saveTemporarySpecimens(currentSpecimen);          
        maxAPI.setDict("specimen.dict", currentSpecimen);
        maxAPI.outlet("finished");
        maxAPI.outlet("resetLastSpecsCounter");
    },
    changeBranch: (branchTyp) => {
        var startDate = new Date();
        var copyOfCurrentSpec = currentSpecimen;
        var newDecGen = replaceBranch(currentSpecimen, branchTyp, parseInt(Math.random()*10000));
        createNewSeed(copyOfCurrentSpec.initialConditions.phenotypeSeed);
        currentSpecimen = evalDecGen(newDecGen);
        currentSpecimen.data = {
            specimenID: getFileDateName(currentUser),
            specimenType: copyOfCurrentSpec.initialConditions.specimenType,
            localEligibleFunctions: copyOfCurrentSpec.initialConditions.localEligibleFunctions,
            maxListCardinality: copyOfCurrentSpec.initialConditions.maxListCardinality,
            phenotypeSeed: copyOfCurrentSpec.initialConditions.phenotypeSeed,
            germinalVector: currentSpecimen.encGen,
            iterations: 0,
            milliseconsElapsed: new Date() - startDate,
            encGenotypeLength: currentSpecimen.encGen.length,
            decGenotypeLength: currentSpecimen.decGen.length,
            germinalVectDeviation: 0,
            depth: measureStringMaxDepth(currentSpecimen.decGen),
            leaves: extractLeaves(currentSpecimen.encGen)
        };
        currentSpecimen = specimenDataStructure(currentSpecimen);
        saveTemporarySpecimens(currentSpecimen);          
        maxAPI.setDict("specimen.dict", currentSpecimen);
        maxAPI.outlet("finished");
        maxAPI.outlet("resetLastSpecsCounter");
    },
    growSpecimen: () => {
        if (currentSpecimen.initialConditions.specimenType == "scoreF") {
            var searchStartdate = new Date();
            var newScoreToAdd;
            var copyOfCurrentSpec = currentSpecimen;
            newRndSeed();
            do {
                newScoreToAdd = createGenotype(
                    "scoreF",
                    {
                        "includedFunctions": copyOfCurrentSpec.initialConditions.localEligibleFunctions,
                        "excludedFunctions": []
                    },
                    defaultListsMaxCardinality,
                    copyOfCurrentSpec.initialConditions.phenotypeSeed,
                    randomVector(defaultGerminalVecMaxLength)
                )
            } while (newScoreToAdd == -1);
            var newDecGen = "sConcatS(" + copyOfCurrentSpec.decodedGenotype + "," + newScoreToAdd.decGen + ")";
            createNewSeed(copyOfCurrentSpec.initialConditions.phenotypeSeed);
            currentSpecimen = evalDecGen(newDecGen);
            currentSpecimen.data = {
                specimenID: getFileDateName(currentUser),
                specimenType: "scoreF",
                localEligibleFunctions: copyOfCurrentSpec.initialConditions.localEligibleFunctions,
                maxListCardinality: copyOfCurrentSpec.initialConditions.maxListCardinality,
                phenotypeSeed: copyOfCurrentSpec.initialConditions.phenotypeSeed,
                germinalVector: currentSpecimen.encGen,
                iterations: 0,
                milliseconsElapsed: new Date() - searchStartdate,
                encGenotypeLength: currentSpecimen.encGen.length,
                decGenotypeLength: currentSpecimen.decGen.length,
                germinalVectDeviation: 0,
                depth: measureStringMaxDepth(currentSpecimen.decGen),
                leaves: extractLeaves(currentSpecimen.encGen)
            };
            currentSpecimen = specimenDataStructure(currentSpecimen);
            saveTemporarySpecimens(currentSpecimen);          
            maxAPI.setDict("specimen.dict", currentSpecimen);
            maxAPI.outlet("finished");
            maxAPI.outlet("resetLastSpecsCounter");
        }
        else {
            maxAPI.post("Error: only scoreF specimens can use the growing method");
        }
    },
    printCurrentSpecimen: () => {
        maxAPI.post(currentSpecimen);
    },
    visualizeSpecimen: () => {
        visualizeSpecimen(currentSpecimen.initialConditions.germinalVector, "visualizations/" + currentSpecimen.metadata.specimenID + "_germinalV");
        visualizeSpecimen(currentSpecimen.encodedGenotype, "visualizations/" + currentSpecimen.metadata.specimenID + "_encGen");
        visualizeSpecimen(currentSpecimen.encodedPhenotype, "visualizations/" + currentSpecimen.metadata.specimenID + "_encPhen");
    },
    mutateLeaves: () => {
        currentSpecimen = mutateSpecimenLeaves(currentSpecimen, mutationProbability, mutationAmount);
        createNewSeed(currentSpecimen.initialConditions.phenotypeSeed);
        saveTemporarySpecimens(currentSpecimen);          
        maxAPI.setDict("specimen.dict", currentSpecimen);
        maxAPI.outlet("finished");
        maxAPI.outlet("resetLastSpecsCounter");
    },
    specimenType: (str) => {
    specimenMainFunctionType = str;
    maxAPI.post("output type for creation of new specimens: " + str);
    },
    phenoseed: (newPhenoSeedFromMax) => {
        phenotypeSeed = newPhenoSeedFromMax;
        currentSpecimen = specimenDataStructure(specimenFromInitialConditions(
            currentSpecimen.initialConditions.specimenType,
            {
                "includedFunctions": currentSpecimen.initialConditions.localEligibleFunctions,
                "excludedFunctions": []
            },
            currentSpecimen.initialConditions.maxListCardinality, 
            phenotypeSeed,
            currentSpecimen.initialConditions.germinalVector));  
        saveTemporarySpecimens(currentSpecimen); 
        maxAPI.outlet(maxAPI.setDict("specimen.dict", currentSpecimen));
        maxAPI.outlet("finished");
        maxAPI.outlet("resetLastSpecsCounter");
    },
    minVoices: (integ) => {
        phenMinPolyphony = integ;
        maxAPI.post("phenotype minimal polyphony: " + phenMinPolyphony + " voices");
    },
    maxVoices: (integ) => {
        phenMaxPolyphony = integ;
        maxAPI.post("phenotype maximal polyphony: " + phenMaxPolyphony + " voices");
    },
    minLength: (integ) => {
        phenMinLength = integ;
        maxAPI.post("phenotype minimal number of events: " + phenMinLength);
    },
    maxLength: (integ) => {
        phenMaxLength = integ;
        maxAPI.post("phenotype maximal number of events: " + phenMaxLength);
    },
    listsCardinality: (integ) => {
        defaultListsMaxCardinality = integ;
        maxAPI.post("maximal lists length: " + defaultListsMaxCardinality);
    },
    depth: (integ) => {
        genMaxDepth = integ;
        maxAPI.post("deepest ramification level: " + genMaxDepth);
    },
    mutProb: (float) => {
        mutationProbability = float;
        maxAPI.post("probability of mutations: " + float);
    },
    mutAmou: (float) => {
        mutationAmount = float;
        maxAPI.post("maximal amount of a mutation: " + float);
    },
    setMandatoryFunction: (str) => {
        mandatoryFunction = str;
        maxAPI.post("mandatory function: " + str);
    },
    setMaxIntervalPerSearch: (integ) => {
        maxIntervalPerSearch = integ;
        maxAPI.post("max interval per search: " + integ +  " milliseconds");
    },
    setMaxIntervalPerBranch: (integ) => {
        maxIntervalPerNewBranch = integ;
        maxAPI.post("max interval per new branch: " + integ +  " milliseconds");
    },
    setMicrotonalDivision: (newOctaveDivision) => {
        notesPerOctave = newOctaveDivision;
        if (notesPerOctave == 12) p2m = norm2midipitch;
        else if (notesPerOctave == 0) p2m = norm2microtonalmidipitch; 
        else {
            norm2equalTemperamentDivisionMidipitch = p => r6d((Math.round((notesPerOctave/12) * 100 * u2n(p) + (notesPerOctave))) / (notesPerOctave/12));
            p2m = norm2equalTemperamentDivisionMidipitch;
        };
        maxAPI.post("temperament: " + newOctaveDivision + " notes per octave");
    },
    //////////// IN DEVELOPMENT
    mtries: () => {
        simpleBACHSearch();
        maxAPI.setDict("specimen.dict", currentSpecimen);
        maxAPI.outlet("finished");
        maxAPI.outlet("resetLastSpecsCounter");
        maxAPI.outlet("genosearch");

    },
    showPopulation: () => {
        currentPopulation.map(x => maxAPI.post(x));
    },
    showErrors: () => {
        maxAPI.post(onlyErrors);
    },
    // OLD TESTS
    geneAlgo: (numElements) => {
        var startdate = new Date();
        // genetic algorithm calculus
        var searchedData = geneticAlgoSearchMAX(numElements);
        createNewSeed(phenotypeSeed);
        currentSpecimen = evalDecGen("s(v(e(p(0.5),p(0.5),p(0.5),p(0.5))))");
        currentSpecimen.data = {
            specimenID: getFileDateName(currentUser),
            iterations: 0,
            milliseconsElapsed: Math.abs(new Date() - startdate),
            genotypeLength: currentSpecimen.length,
            germinalVector: "genetic algorithm",
            phenotypeSeed: phenotypeSeed,
            depth: searchedData,
            leaves: "no"
        };
        const dict = maxAPI.setDict("specimen.dict", specimenDataStructure(currentSpecimen));
        maxAPI.outlet(dict);
    },
    geneticAlgoTest: (integ) => {
        maxAPI.post("Genetic Algorithm test dimension " + integ);
        var myResult = geneticAlgoSearchMAX(integ);
        maxAPI.outlet("finished");
        maxAPI.outlet("resetLastSpecsCounter");
    }
});