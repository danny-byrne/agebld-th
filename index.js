const fs = require("fs");
const csv = require("csv-parse");
const path = require("node:path");

const { parse } = csv;

// Construct the file paths to read CSV files
const slcspFilePath = path.join(__dirname, "assets", "slcsp.csv");
const plansFilePath = path.join(__dirname, "assets", "plans.csv");
const zipsFilePath = path.join(__dirname, "assets", "zips.csv");
const outputFilePath = path.join(__dirname, "assets", "output.csv"); // New output file path
// Read CSV files

let slcspRows = [];
let plansRows = [];
let zipsRows = [];
let zipsToRateAreas = {};

const readCSV = async () => {
  await new Promise((resolve, reject) => {
    fs.createReadStream(zipsFilePath)
      .pipe(parse({ delimiter: "," }))
      .on("data", (row) => {
        zipsRows.push(row);
      })
      .on("end", () => {
        zipsToRateAreas = processZipToRate();
        resolve();
      });
  });

  await new Promise((resolve, reject) => {
    fs.createReadStream(plansFilePath)
      .pipe(parse({ delimiter: "," }))
      .on("data", (row) => {
        plansRows.push(row);
      })
      .on("end", resolve);
  });

  await new Promise((resolve, reject) => {
    fs.createReadStream(slcspFilePath)
      .pipe(parse({ delimiter: "," }))
      .on("data", (row) => {
        slcspRows.push(row);
      })
      .on("end", () => {
        processSlcspRows();
        resolve();
      });
  });
};

readCSV();

//todo: figure out state + rate area thing
//figure out where there is no second lowest rate  ex 40813

//state and rate area tuple 'CA 1'

function processZipToRate() {
  // Create a map of ZIP codes to rate areas
  // todo: create TUPLE of state and rate area
  const zipToRateArea = {};
  for (let i = 1; i < zipsRows.length; i++) {
    const [zip, state, , , rateArea] = zipsRows[i];
    if (!zipToRateArea[zip]) {
      zipToRateArea[zip] = `${state} ${rateArea}`;
    }
  }
  //   console.log({ zipToRateArea });
  return zipToRateArea;
}

function processSlcspRows() {
  const outputData = ["zipcode, rate"]; // Array to store output data
  for (let i = 1; i < slcspRows.length; i++) {
    const [zip] = slcspRows[i];
    const stateAndRateArea = zipsToRateAreas[zip];

    const slcspRate = findSecondLowestSilverPlanRate(
      plansRows,
      stateAndRateArea
    );
    const outputLine = slcspRate ? `${zip},${slcspRate.toFixed(2)}` : `${zip},`;
    outputData.push(outputLine); // Add the output line to the array
  }
  fs.writeFileSync(outputFilePath, outputData.join("\n"));
}

// Function to find the second lowest silver plan rate for a given rate area
function findSecondLowestSilverPlanRate(plans, stateAndRate) {
  const [rateState, rateArea] = stateAndRate.split(" ");
  const silverPlanRatesInArea = plans.filter((plan) => {
    const [, planState, metalLevel, rate, planRateArea] = plan;
    if (
      metalLevel === "Silver" &&
      planRateArea === rateArea &&
      planState === rateState
    )
      return rate;
  });
  if (silverPlanRatesInArea.length < 2) {
    return; // Not enough silver plans to determine SLCSP
  }
  const sortedRates = silverPlanRatesInArea
    .map((rate) => parseFloat(rate))
    .sort((a, b) => a - b);
  return sortedRates[1];
}
