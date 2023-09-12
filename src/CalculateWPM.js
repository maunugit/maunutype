// CalculateWPM.js

export const shuffleArray = (array) => {
    const shuffledArray = array.slice(); // to avoid mutating the original array
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; // swap elements
    }
    return shuffledArray;
  }
  
  export const calculateWPM = (startTime, correctCharCount) => {
    const currentTime = Date.now();
    const timeInSeconds = (currentTime - startTime) / 1000;
    const timeInMinutes = timeInSeconds / 60;
    const wordsEquivalent = correctCharCount / 5;
    const calculatedWPM = Math.floor(wordsEquivalent / timeInMinutes);
    return calculatedWPM;
  }
  
  export const calculateAccuracy = (correctCharCount, typedCharCount) => {
    const calculatedAccuracy = (correctCharCount / typedCharCount) * 100;
    return Math.round(calculatedAccuracy);
  }
  