const fs = require("fs");
const csv = require("csv-parse");
const path = require("node:path");

const { parse, transform, stringify } = csv;

// Construct the file paths to read CSV files
const slcspFilePath = path.join(__dirname, "assets", "slcsp.csv");
const plansFilePath = path.join(__dirname, "assets", "plans.csv");
const zipsFilePath = path.join(__dirname, "assets", "zips.csv");

// Read CSV files

let slcspRows = [];
let plansRows = [];
let zipsRows = [];
let zipsToRateAreas = {};

const readCSV = () => {
  fs.createReadStream(slcspFilePath)
    .pipe(parse({ delimiter: "," }))
    .on("data", (row) => {
      slcspRows.push(row);
    })
    .on("end", () => {
      //   console.log({ zipToRateArea, slcspRows });
    });

  fs.createReadStream(plansFilePath)
    .pipe(parse({ delimiter: "," }))
    .on("data", (row) => {
      plansRows.push(row);
    })
    .on("end", () => {
      //   console.log({ plansRows });
    });

  fs.createReadStream(zipsFilePath)
    .pipe(parse({ delimiter: "," }))
    .on("data", (row) => {
      zipsRows.push(row);
    })
    .on("end", () => {
      zipsToRateAreas = processZipToRate();
    });
};

const processZipToRate = () => {
  // Create a map of ZIP codes to rate areas
  const zipToRateArea = {};

  for (let i = 1; i < zipsRows.length; i++) {
    const [zip, , , , rateArea] = zipsRows[i];
    // console.log("hello");
    // console.log({ zip, rateArea });

    if (!zipToRateArea[zip]) {
      zipToRateArea[zip] = rateArea;
    }
    // zipToRateArea[zip].push(rateArea);
  }
  console.log({ zipToRateArea });
  return zipToRateArea;
};

readCSV();

// Function to find the second lowest silver plan rate for a given rate area
function findSecondLowestSilverPlanRate(plans, rateArea) {
  const silverPlansInArea = plans.filter((plan) => {
    const [, , metalLevel, rate, planRateArea] = plan;
    if (metalLevel === "Silver" && planRateArea === rateArea) return rate;
  });
  if (silverPlansInArea.length < 2) {
    return; // Not enough silver plans to determine SLCSP
  }
  const sortedRates = silverPlansInArea
    .map((rate) => parseFloat(rate))
    .sort((a, b) => a - b);
  return sortedRates[1];
}

// Iterate through each ZIP code in slcsp.csv
function processSlcspRows() {
  for (let i = 1; i < slcspRows.length; i++) {
    const [zip, rateArea] = slcspRows[i];
    // console.log({ zip, rateArea });
    const slcspRate = findSecondLowestSilverPlanRate(plansRows, rateArea);
    if (slcspRate) {
      console.log(`${zip},${slcspRate.toFixed(2)}`);
    } else {
      false && console.log(`${zip},`); // No second lowest cost silver plan
    }
  }
}
