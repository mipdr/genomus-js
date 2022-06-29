//// PHENOTYPE DECODERS

// wraps genotypes into a scoreF function before decoding phenotypes
// to enable experimentation simple genotypes of any output type
var wrapDecGen = specimen => {
    var wrappedEncPhen = [];
    var receivedData = specimen.encPhen;
    var receivedDataLength = specimen.encPhen.length;
    // default values for notation of parameters
    var defaultN = n(0.3).encPhen;
    var defaultM = m(69).encPhen;
    var defaultA = a(75).encPhen;
    var defaultI = i(70).encPhen;
    // wrapping transformations only for bach roll in Max
    switch (specimen.data.specimenType) {
        case "scoreF":
            return specimen.encPhen;
        case "voiceF":
            return [0.618034].concat(receivedData);
        case "eventF":
            return [0.618034, 0.618034].concat(receivedData);
        case "lnotevalueF":
            wrappedEncPhen = [0.618034, z2p(receivedDataLength)];
            for (var it = 0; it < receivedDataLength; it++) {
                wrappedEncPhen.push(receivedData[it], 0.618034, defaultM, defaultA, defaultI)
            }
            return wrappedEncPhen;
        case "lmidipitchF":
            wrappedEncPhen = [0.618034, z2p(receivedDataLength)];
            for (var it = 0; it < receivedDataLength; it++) {
                wrappedEncPhen.push(defaultN, 0.618034, receivedData[it], defaultA, defaultI)
            }
            return wrappedEncPhen;
        case "larticulationF":
            wrappedEncPhen = [0.618034, z2p(receivedDataLength)];
            for (var it = 0; it < receivedDataLength; it++) {
                wrappedEncPhen.push(defaultN, 0.618034, defaultM, receivedData[it], defaultI)
            }
            return wrappedEncPhen;
        case "lintensityF":
            wrappedEncPhen = [0.618034, z2p(receivedDataLength)];
            for (var it = 0; it < receivedDataLength; it++) {
                wrappedEncPhen.push(defaultN, 0.618034, defaultM, defaultA, receivedData[it])
            }
            return wrappedEncPhen;
        case "listF": // uses the generic list for all event features
            wrappedEncPhen = [0.618034, z2p(receivedDataLength)];
            for (var it = 0; it < receivedDataLength; it++) {
                wrappedEncPhen.push(receivedData[it], 0.618034, receivedData[it], receivedData[it], receivedData[it])
            }
            return wrappedEncPhen;
        case "notevalueF":
            return [0.618034, 0.618034, receivedData[0], 0.618034, defaultM, defaultA, defaultI];
        case "midipitchF":
            return [0.618034, 0.618034, defaultN, 0.618034, receivedData[0], defaultA, defaultI];
        case "articulationF":
            return [0.618034, 0.618034, defaultN, 0.618034, defaultM, receivedData[0], defaultI];
        case "intensityF":
            return [0.618034, 0.618034, defaultN, 0.618034, defaultM, defaultA, receivedData[0]];
        case "paramF": // uses the generic parameter for all event features
            return [0.618034, 0.618034, receivedData[0], 0.618034, receivedData[0], receivedData[0], receivedData[0]];
        case "harmonyF": 
            wrappedEncPhen = [0.618034, z2p(receivedDataLength)];
            for (var it = 0; it < receivedDataLength; it++) {
                wrappedEncPhen.push(n(0.1).encPhen, 0.618034, receivedData[it], a(300).encPhen, defaultI)
            }
            return wrappedEncPhen;
        default:
            maxAPI.post("Error: Genotype type not found");
            break;
    }
};

// bach roll converter for piano species
var encPhen2bachRoll_piano = encPhen => {
    var wholeNoteDur = 4000; // default value for tempo, 1/4 note = 1 seg 
    var roll = [];
    var numVoices, numEvents, numPitches, pos = 0;
    var eventDur, totalVoiceDeltaTime;
    var pitchSet, articul, intens;
    // writes voices within a score
    numVoices = p2z(encPhen[pos]);
    pos++;
    for (var v = 0; v < numVoices; v++) {
        numEvents = p2z(encPhen[pos]);
        roll.push("(");
        pos++;
        // writes events within a voice
        totalVoiceDeltaTime = 0;
        for (var currEvent = 0; currEvent < numEvents; currEvent++) {
            // write event
            roll.push("(");
            // writes start time
            roll.push(totalVoiceDeltaTime);
            eventDur = wholeNoteDur * p2n(encPhen[pos]);
            pos++;
            // loads number of pitches within an event
            numPitches = p2z(encPhen[pos]);
            pos++;
            // reads the pitches;
            pitchSet = [];
            for (var pit = 0; pit < numPitches; pit++) {
                pitchSet.push(p2m(encPhen[pos]) * 100);
                pos++;
            }
            // reads articulation
            articul = eventDur * p2a(encPhen[pos]) * .01;
            pos++;
            // reads intensity (uses 27 as dynamic baseline to avoid too pianissimo notes)
            if (encPhen[pos] == 0) intens = 0;
            else intens = p2i(encPhen[pos]) + 27;
            pos++;
            // writes individual notes parameters
            if (intens > 0) {
                for (var pit = 0; pit < numPitches; pit++) {
                    roll.push("(");
                    // adds a pitch of the chord
                    roll.push(pitchSet[pit]);
                    // adds duration of sound according to articulation % value
                    roll.push(articul);
                    // adds dynamics (converts from 0-1 to 127 standard MIDI velocity)
                    roll.push(intens);
                    roll.push(")");
                }
            }
            totalVoiceDeltaTime = totalVoiceDeltaTime + eventDur;
            roll.push(")");
        }
        roll.push(")");
    }
    return roll;
};

// bach roll converter for piano with 4 extra parameters species
var encPhen2bachRoll_piano_4xtra = encPhen => {
    var wholeNoteDur = 4000; // default value for tempo, 1/4 note = 1 seg 
    var roll = [];
    var numVoices, numEvents, numPitches, pos = 0;
    var eventDur, totalVoiceDeltaTime;
    var pitchSet, articul, intens;
    var extraPar1, extraPar2, extraPar3, extraPar4;
    // writes voices within a score
    numVoices = p2z(encPhen[pos]);
    pos++;
    for (var v = 0; v < numVoices; v++) {
        numEvents = p2z(encPhen[pos]);
        roll.push("(");
        pos++;
        // writes events within a voice
        totalVoiceDeltaTime = 0;
        for (var currEvent = 0; currEvent < numEvents; currEvent++) {
            // writes event
            roll.push("(");
            // writes start time
            roll.push(totalVoiceDeltaTime);
            eventDur = wholeNoteDur * p2n(encPhen[pos]);
            pos++;
            // loads number of pitches within an event
            numPitches = p2z(encPhen[pos]);
            pos++;
            // reads the pitches;
            pitchSet = [];
            for (var pit = 0; pit < numPitches; pit++) {
                pitchSet.push(p2m(encPhen[pos]) * 100);
                pos++;
            }
            // reads articulation
            articul = eventDur * p2a(encPhen[pos]) * .01;
            pos++;
            // reads intensity (uses 27 as dynamic baseline to avoid too pianissimo notes)
            if (encPhen[pos] == 0) intens = 0;
            else intens = p2i(encPhen[pos]) + 27;
            pos++;
            // reads extra parameters
            extraPar1 = encPhen[pos];
            pos++;
            extraPar2 = encPhen[pos];
            pos++;
            extraPar3 = encPhen[pos];
            pos++;
            extraPar4 = encPhen[pos];
            pos++;
            // writes individual notes parameters
            if (intens > 0) {
                for (var pit = 0; pit < numPitches; pit++) {
                    roll.push("(");
                    // adds a pitch of the chord
                    roll.push(pitchSet[pit]);
                    // adds duration of sound according to articulation % value
                    roll.push(articul);
                    // adds dynamics (converts from 0-1 to 127 standard MIDI velocity)
                    roll.push(intens);
                    // adds slot
                    roll.push("(");
                    roll.push("slots");
                    roll.push("(");
                    roll.push(4);
                    roll.push(extraPar1);
                    roll.push(extraPar2);
                    roll.push(extraPar3);
                    roll.push(extraPar4);
                    roll.push(")");
                    roll.push(")");
                    // closes note
                    roll.push(")");                }
            }
            totalVoiceDeltaTime = totalVoiceDeltaTime + eventDur;
            roll.push(")");
        }
        roll.push(")");
    }
    return roll;
};

// bach roll converter for csound species
var encPhen2bachRoll_csound = encPhen => {
    var wholeNoteDur = 4000; // default value for tempo, 1/4 note = 1 seg 
    var roll = [];
    var numVoices, numEvents, numPitches, pos = 0;
    var eventDur, totalVoiceDeltaTime;
    var freqSet, articul, intens;
    var extraPar1, extraPar2, extraPar3, extraPar4, extraPar5, extraPar6, extraPar7, extraPar8;
    // writes voices within a score
    numVoices = p2z(encPhen[pos]);
    pos++;
    for (var v = 0; v < numVoices; v++) {
        numEvents = p2z(encPhen[pos]);
        roll.push("(");
        pos++;
        // writes events within a voice
        totalVoiceDeltaTime = 0;
        for (var currEvent = 0; currEvent < numEvents; currEvent++) {
            // writes event
            roll.push("(");
            // writes start time
            roll.push(totalVoiceDeltaTime);
            eventDur = wholeNoteDur * p2n(encPhen[pos]);
            // eventDur = 1000;
            pos++;
            // loads number of frecuencies within an event
            numPitches = p2z(encPhen[pos]);
            pos++;
            // reads the frequencies;
            freqSet = [];
            for (var pit = 0; pit < numPitches; pit++) {
                freqSet.push(p2mm(encPhen[pos]) * 100);
                pos++;
            }
            // reads articulation
            articul = eventDur * p2a(encPhen[pos]) * .01;
            // articul = 100;
            pos++;
            // reads intensity (uses 27 as dynamic baseline to avoid too pianissimo notes)
            if (encPhen[pos] == 0) intens = 0;
            else intens = p2i(encPhen[pos]) + 27;
            pos++;
            // reads extra parameters
            extraPar1 = encPhen[pos];
            pos++;
            extraPar2 = encPhen[pos];
            pos++;
            extraPar3 = encPhen[pos];
            pos++;
            extraPar4 = encPhen[pos];
            pos++;
            extraPar5 = encPhen[pos];
            pos++;
            extraPar6 = encPhen[pos];
            pos++;
            extraPar7 = encPhen[pos];
            pos++;
            extraPar8 = encPhen[pos];
            pos++;
            // writes individual notes parameters
            if (intens > 0) {
                for (var pit = 0; pit < numPitches; pit++) {
                    roll.push("(");
                    // adds a pitch of the chord
                    roll.push(freqSet[pit]);
                    // adds duration of sound according to articulation % value
                    roll.push(articul);
                    // adds dynamics (converts from 0-1 to 127 standard MIDI velocity)
                    roll.push(intens);
                    // adds slot
                    roll.push("(");
                    roll.push("slots");
                    roll.push("(");
                    roll.push(4);
                    roll.push(extraPar1);
                    roll.push(extraPar2);
                    roll.push(extraPar3);
                    roll.push(extraPar4);
                    roll.push(extraPar5);
                    roll.push(extraPar6);
                    roll.push(extraPar7);
                    roll.push(extraPar8);
                    roll.push(")");
                    roll.push(")");
                    // close note
                    roll.push(")");
                }
            }
            totalVoiceDeltaTime = totalVoiceDeltaTime + eventDur;

            roll.push(")");
        }
        roll.push(")");
    }
    return roll;
};

// csound score converter
var encPhen2csoundScore = encPhen => {
    var tempoFactor = 1; // duration is measured in seconds
    var csoundEvent = [];
    var csoundScore = {};
    var numVoices, numEvents, numPitches;
    var pos = 0;
    var eventDur, totalVoiceDeltaTime;
    var pitchSet, articul, intens, param5, param6, param7, param8, param9, param10, param11, param12;
    var numCsoundEvents = 1;
    // writes voices within a score
    numVoices = p2z(encPhen[pos]);
    pos++;
    for (var v = 0; v < numVoices; v++) {
        numEvents = p2z(encPhen[pos]);
        pos++;
        // writes events within a voice
        totalVoiceDeltaTime = 0;
        for (var e = 0; e < numEvents; e++) {
            // calculates start time
            eventDur = tempoFactor * p2d(encPhen[pos]);
            pos++;
            // loads number of pitches within an event
            numPitches = p2z(encPhen[pos]);
            pos++;
            // reads the pitches;
            pitchSet = [];
            for (var pit = 0; pit < numPitches; pit++) {
                pitchSet.push(p2f(encPhen[pos]));
                pos++;
            }
            // reads articulation
            articul = eventDur * p2a(encPhen[pos]) * .01;
            pos++;
            // reads intensity
            if (encPhen[pos] == 0) intens = 0;
            else intens = p2i(encPhen[pos]);
            pos++;
            // reads extra parameters
            param5 = encPhen[pos];
            pos++;            
            param6 = encPhen[pos];
            pos++; 
            param7 = encPhen[pos];
            pos++;            
            param8 = encPhen[pos];
            pos++;  
            param9 = encPhen[pos];
            pos++;            
            param10 = encPhen[pos];
            pos++;  
            param11 = encPhen[pos];
            pos++;            
            param12 = encPhen[pos];
            pos++;    
            // writes individual notes parameters
            if (intens > 0) {
                for (var pit = 0; pit < numPitches; pit++) {
                    // adds instrument number
                    csoundEvent.push("e");
                    csoundEvent.push("i4");
                    // adds start time
                    csoundEvent.push(r6d(totalVoiceDeltaTime));
                    // adds duration of sound according to articulation % value
                    csoundEvent.push(r6d(articul));
                    // adds dynamics (converts from 0-1 to 127 standard MIDI velocity)
                    csoundEvent.push(r6d(intens));
                    // adds a pitch of the chord
                    csoundEvent.push(r6d(pitchSet[pit]));
                    // adds extra parameters
                    csoundEvent.push(r6d(param5));
                    csoundEvent.push(r6d(param6));
                    csoundEvent.push(r6d(param7));
                    csoundEvent.push(r6d(param8));
                    csoundEvent.push(r6d(param9));
                    csoundEvent.push(r6d(param10));
                    csoundEvent.push(r6d(param11));
                    csoundEvent.push(r6d(param12));
                    // adds new line to score and reinit event string
                    csoundScore[numCsoundEvents] = csoundEvent;
                    csoundEvent = [];
                    numCsoundEvents++;
                }
            }
            totalVoiceDeltaTime = totalVoiceDeltaTime + eventDur;
        }
    }
    return csoundScore;
};

// encPhen2bachRoll([ 0.618034, 0.618034, 0.6, 0.618034, 0.48, 1, 1 ]);
// encPhen2bachRoll(evalDecGen("s(v(e(p(0.5),p(.5),p(.5),p(.5))))").encPhen);