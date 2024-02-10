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

const readCSV = () => {
  fs.createReadStream(slcspFilePath)
    .pipe(parse({ delimiter: "," }))
    .on("data", (row) => {
      slcspRows.push(row);
    })
    .on("end", () => {
      const zipToRateArea = processZipToRate();
      console.log({ zipToRateArea });
    });

  fs.createReadStream(plansFilePath)
    .pipe(parse({ delimiter: "," }))
    .on("data", (row) => {
      plansRows.push(row);
    })
    .on("end", () => {
      // console.log({ plansRows });
    });

  fs.createReadStream(zipsFilePath)
    .pipe(parse({ delimiter: "," }))
    .on("data", (row) => {
      zipsRows.push(row);
    })
    .on("end", () => {
      // console.log({ zipsRows });
    });
};

const processZipToRate = () => {
  // Create a map of ZIP codes to rate areas
  const zipToRateArea = {};

  for (let i = 1; i < slcspRows.length; i++) {
    const [zip, rateArea] = slcspRows[i];
    console.log("hello");
    console.log({ zip, rateArea });

    if (!zipToRateArea[zip]) {
      zipToRateArea[zip] = [];
    }
    zipToRateArea[zip].push(rateArea);
  }

  return zipToRateArea;
};

readCSV();

// console.log({ zipToRateArea, slcspRows });

// Function to find the second lowest silver plan rate for a given rate area
function findSecondLowestSilverPlanRate(plans, rateArea) {
  const silverPlansInArea = plans.filter((plan) => {
    return plan["metal_level"] === "Silver" && plan["rate_area"] === rateArea;
  });
  if (silverPlansInArea.length < 2) {
    return; // Not enough silver plans to determine SLCSP
  }
  const sortedRates = silverPlansInArea
    .map((plan) => parseFloat(plan["rate"]))
    .sort((a, b) => a - b);
  return sortedRates[1];
}

// Iterate through each ZIP code in slcsp.csv
slcspRows.forEach((row) => {
  const zip = row["zipcode"];
  const rateAreas = zipToRateArea[zip];
  if (!rateAreas || rateAreas.length !== 1) {
    console.log(`${zip},`); // Ambiguous or unknown rate area
    return;
  }
  const rateArea = rateAreas[0];
  const slcspRate = findSecondLowestSilverPlanRate(plansRows, rateArea);
  if (slcspRate) {
    console.log(`${zip},${slcspRate.toFixed(2)}`);
  } else {
    false && console.log(`${zip},`); // No second lowest cost silver plan
  }
});
